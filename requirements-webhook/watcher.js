/**
 * watcher.js  –  ELDROS Requirements Webhook
 * ============================================
 * Two independent listeners run in parallel:
 *
 *   1. **Local chokidar watcher**
 *      Monitors deposit/requirements.md and display/requirements.md for
 *      on-disk changes (e.g. you edit them locally or another tool writes
 *      them).
 *
 *   2. **Team notifications (remote)**
 *      - Poll mode: periodically `git fetch` and diff ONLY the two
 *        requirements files from the shared remote ref (default: origin/main)
 *        using `git show <ref>:path`. This avoids pulling/merging and avoids
 *        reacting to non-requirements changes.
 *      - Webhook mode: POST /webhook can be used as an *immediate trigger*
 *        to run the same fetch+diff cycle (useful if you have a central host).
 *
 * In both cases the result is a `REQUIREMENTS_CHANGES.md` written into
 * BOTH deposit/ and display/ so the change is immediately visible in
 * Cursor.
 *
 * Usage:
 *   cd requirements-webhook
 *   npm install
 *   npm run snapshot        # baseline (first time only)
 *   npm start               # starts watcher + webhook server
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

const config = require('./config');
const { extractTextContent } = require('./extractor');
const { computeChanges } = require('./differ');
const { generateMarkdown } = require('./generator');
const { propagateToRepos } = require('./propagator');

// ── Kill any process already using the webhook port ──────────────────

function freePort(port) {
    if (!port || port <= 0) return;
    try {
        // Works on Windows (PowerShell) and is silently skipped on failure
        const result = execSync(
            `powershell -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`,
            { encoding: 'utf-8', timeout: 5000 }
        ).trim();
        if (result) {
            result.split(/\r?\n/).forEach(pid => {
                pid = pid.trim();
                if (pid && pid !== String(process.pid)) {
                    try {
                        execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf-8', timeout: 3000 });
                        console.log(`  [startup] Freed port ${port} (killed PID ${pid})`);
                    } catch { /* already gone */ }
                }
            });
        }
    } catch { /* not Windows or no process on port */ }
}

// ── Helpers ──────────────────────────────────────────────────────────

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function snapshotPathFor(branchName, source = 'local') {
    return path.join(config.snapshotsDir, `${branchName}.requirements.md.${source}.snapshot`);
}

function legacySnapshotPathFor(branchName) {
    return path.join(config.snapshotsDir, `${branchName}.requirements.md.snapshot`);
}

function loadSnapshot(branchName, source = 'local') {
    const sp = snapshotPathFor(branchName, source);
    const legacy = legacySnapshotPathFor(branchName);
    const readPath = fs.existsSync(sp) ? sp : (fs.existsSync(legacy) ? legacy : null);
    if (!readPath) return null;
    try { return JSON.parse(fs.readFileSync(readPath, 'utf-8')); }
    catch { return null; }
}

function saveSnapshot(branchName, content, filePath, source = 'local') {
    ensureDir(config.snapshotsDir);
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : {};
    fs.writeFileSync(snapshotPathFor(branchName, source), JSON.stringify({
        branch: branchName,
        file: 'requirements.md',
        source,
        content,
        mtime: stat.mtimeMs || Date.now(),
        size: stat.size || 0,
        snapshotAt: new Date().toISOString(),
    }, null, 2), 'utf-8');
}

/** Map an absolute file path back to the branch it belongs to (or null). */
function identifyBranch(filePath) {
    const abs = path.resolve(filePath);
    for (const [key, branch] of Object.entries(config.branches)) {
        if (abs === path.resolve(branch.requirementsFile)) return key;
    }
    return null;
}

// ── Git helpers (fetch + read remote file content) ───────────────────

function gitFetch() {
    try {
        const out = execSync(`${config.gitBin} fetch --all --prune`, {
            cwd: config.projectRoot,
            encoding: 'utf-8',
            timeout: 30000,
        });
        const trimmed = out.trim();
        if (trimmed) console.log(`  [git fetch] ${trimmed}`);
        else console.log('  [git fetch] OK');
        return true;
    } catch (err) {
        console.error(`  [git fetch] FAILED: ${err.message}`);
        return false;
    }
}

function gitShowText(ref, relPath) {
    const safePath = relPath.replace(/\\/g, '/');
    return execSync(`${config.gitBin} show ${ref}:${safePath}`, {
        cwd: config.projectRoot,
        encoding: 'utf-8',
        timeout: 15000,
    });
}

// ── Core: process one or more branch changes (LOCAL working tree) ────

async function processChanges(branchNames, trigger) {
    const changeRecords = [];

    for (const branchName of branchNames) {
        const branch = config.branches[branchName];
        if (!branch) continue;

        const filePath = branch.requirementsFile;
        if (!fs.existsSync(filePath)) {
            console.log(`  [skip] ${filePath} does not exist yet.`);
            continue;
        }

        try {
            const newContent = await extractTextContent(filePath);
            const snapshot = loadSnapshot(branchName, 'local');
            const oldContent = snapshot ? snapshot.content : '';

            if (oldContent === newContent) {
                console.log(`  [skip] ${branchName}/requirements.md – no content change.`);
                continue;
            }

            const changes = computeChanges(oldContent, newContent);
            const eventType = snapshot ? 'MODIFIED' : 'ADDED (first seen)';

            changeRecords.push({
                branch: branchName,
                label: branch.label,
                file: 'requirements.md',
                timestamp: new Date().toISOString(),
                eventType,
                trigger,     // 'local' | 'github-webhook'
                changes,
            });

            // Update snapshot
            saveSnapshot(branchName, newContent, filePath, 'local');
            console.log(`  [snapshot] updated for ${branchName}/requirements.md`);
        } catch (err) {
            console.error(`  [error] ${branchName}: ${err.message}`);
        }
    }

    if (changeRecords.length === 0) {
        console.log('  No actionable requirement changes detected.\n');
        return;
    }

    // Build notification and propagate to BOTH branches
    const markdown = generateMarkdown(changeRecords);
    propagateToRepos(markdown);

    console.log(`  ✅  ${changeRecords.length} change(s) propagated to both branches.\n`);
}

// ── Core: process remote changes (TEAM mode: only requirements.md) ───

async function processRemoteChanges(trigger) {
    const changeRecords = [];
    const ref = config.remoteRef;

    const ok = gitFetch();
    if (!ok) return;

    for (const [branchName, branch] of Object.entries(config.branches)) {
        const relPath = `${branch.name}/requirements.md`;
        let remoteContent = '';

        try {
            remoteContent = gitShowText(ref, relPath);
        } catch {
            console.warn(`  [remote] ${ref}:${relPath} not found (skipped).`);
            continue;
        }

        const snapshot = loadSnapshot(branchName, 'remote');
        const oldContent = snapshot ? snapshot.content : '';

        if (oldContent === remoteContent) continue;

        const changes = computeChanges(oldContent, remoteContent);
        const eventType = snapshot ? 'MODIFIED (remote)' : 'ADDED (remote first seen)';

        changeRecords.push({
            branch: branchName,
            label: branch.label,
            file: 'requirements.md',
            timestamp: new Date().toISOString(),
            eventType,
            trigger, // 'remote-poll' | 'github-webhook'
            changes,
        });

        // Store remote content in snapshot (filePath only used for metadata fields)
        saveSnapshot(branchName, remoteContent, branch.requirementsFile, 'remote');
        console.log(`  [snapshot] updated from ${ref} for ${branchName}/requirements.md`);
    }

    if (changeRecords.length === 0) return;

    const markdown = generateMarkdown(changeRecords);
    propagateToRepos(markdown);
    console.log(`  ✅  ${changeRecords.length} remote requirement change(s) propagated to both branches.\n`);
}

// ── Debounced local-change queue ─────────────────────────────────────

let pendingBranches = new Set();
let debounceTimer = null;

function queueLocalChange(filePath) {
    const branchName = identifyBranch(filePath);
    if (!branchName) return;

    pendingBranches.add(branchName);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const branches = [...pendingBranches];
        pendingBranches.clear();

        console.log(`\n${'═'.repeat(60)}`);
        console.log(`  LOCAL CHANGE detected in: ${branches.join(', ')}`);
        console.log(`${'═'.repeat(60)}`);
        await processChanges(branches, 'local');
    }, config.debounceMs);
}

// ── GitHub webhook verification ──────────────────────────────────────

function verifySignature(payload, signature) {
    if (!config.webhookSecret) return true;            // no secret → skip
    if (!signature) return false;
    const hmac = crypto.createHmac('sha256', config.webhookSecret);
    hmac.update(payload);
    const expected = 'sha256=' + hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Start everything ─────────────────────────────────────────────────

function start() {
    ensureDir(config.snapshotsDir);

    // Free the port before trying to listen (avoids EADDRINUSE on restart)
    if (config.webhookPort > 0) freePort(config.webhookPort);

    const branchNames = Object.keys(config.branches);
    const watchPaths = Object.values(config.branches).map(b => b.requirementsFile);

    // ────────────────────────────────────────────────────────────────
    // Banner
    // ────────────────────────────────────────────────────────────────
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   ELDROS Requirements Webhook  (local + GitHub)        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('  Watching files:');
    for (const b of Object.values(config.branches)) {
        console.log(`    • ${b.name}/requirements.md  (${b.label})`);
    }
    console.log('');
    console.log(`  Webhook server : ${config.webhookPort > 0 ? `http://localhost:${config.webhookPort}/webhook` : '(disabled)'}`);
    console.log(`  Remote ref     : ${config.remoteRef}`);
    console.log(`  Polling        : ${config.pollSeconds > 0 ? `every ${config.pollSeconds}s` : 'disabled'}`);
    console.log(`  Change file    : ${config.changeFileName}`);
    console.log(`  Propagate to   : ${branchNames.join(', ')}`);
    console.log('');
    console.log('  Waiting for changes…\n');

    // ────────────────────────────────────────────────────────────────
    // 0. STARTUP CATCH-UP: detect changes that happened while we
    //    were NOT running (e.g. teammate pushed to GitHub yesterday)
    // ────────────────────────────────────────────────────────────────
    (async () => {
        console.log('  Checking for missed changes since last run…');

        // 0a. Check LOCAL files against last snapshot
        const localMissed = [];
        for (const [branchName, branch] of Object.entries(config.branches)) {
            const filePath = branch.requirementsFile;
            if (!fs.existsSync(filePath)) continue;

            try {
                const currentContent = await extractTextContent(filePath);
                const snapshot = loadSnapshot(branchName, 'local');
                const oldContent = snapshot ? snapshot.content : '';
                if (currentContent !== oldContent) {
                    localMissed.push(branchName);
                }
            } catch (err) {
                console.error(`  [startup] error reading ${branchName}: ${err.message}`);
            }
        }

        if (localMissed.length > 0) {
            console.log(`  [startup] LOCAL changes found in: ${localMissed.join(', ')}`);
            console.log(`${'═'.repeat(60)}`);
            console.log(`  STARTUP CATCH-UP (local missed changes)`);
            console.log(`${'═'.repeat(60)}`);
            await processChanges(localMissed, 'startup-catchup (local)');
        }

        // 0b. Check REMOTE (git fetch + compare) for changes pushed
        //     while we were offline — only if a remote ref is configured
        try {
            console.log(`  [startup] Fetching remote to check for missed pushes…`);
            const fetched = gitFetch();
            if (fetched) {
                const remoteMissed = [];
                for (const [branchName, branch] of Object.entries(config.branches)) {
                    const relPath = `${branch.name}/requirements.md`;
                    let remoteContent = '';
                    try {
                        remoteContent = gitShowText(config.remoteRef, relPath);
                    } catch { continue; }

                    const snapshot = loadSnapshot(branchName, 'remote');
                    const oldContent = snapshot ? snapshot.content : '';
                    if (remoteContent !== oldContent) {
                        remoteMissed.push(branchName);
                    }
                }

                if (remoteMissed.length > 0) {
                    console.log(`  [startup] REMOTE changes found in: ${remoteMissed.join(', ')}`);
                    console.log(`${'═'.repeat(60)}`);
                    console.log(`  STARTUP CATCH-UP (remote missed changes)`);
                    console.log(`${'═'.repeat(60)}`);
                    await processRemoteChanges('startup-catchup (remote)');
                }
            }
        } catch (err) {
            console.error(`  [startup] Remote check failed: ${err.message}`);
        }

        if (localMissed.length === 0) {
            console.log('  [startup] No missed changes — you are up to date.\n');
        }
    })();

    // ────────────────────────────────────────────────────────────────
    // 1. Local file watcher (chokidar)
    // ────────────────────────────────────────────────────────────────
    const watcher = chokidar.watch(watchPaths, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
    });

    watcher
        .on('add',    (fp) => queueLocalChange(fp))
        .on('change', (fp) => queueLocalChange(fp))
        .on('unlink', (fp) => {
            const br = identifyBranch(fp);
            if (!br) return;
            console.log(`\n  ⚠  ${br}/requirements.md was DELETED.`);
            // Remove snapshot
            const localSp = snapshotPathFor(br, 'local');
            const remoteSp = snapshotPathFor(br, 'remote');
            if (fs.existsSync(localSp)) fs.unlinkSync(localSp);
            if (fs.existsSync(remoteSp)) fs.unlinkSync(remoteSp);
        })
        .on('error', (err) => console.error('  Watcher error:', err));

    // ────────────────────────────────────────────────────────────────
    // 2. GitHub webhook HTTP server (optional trigger)
    // ────────────────────────────────────────────────────────────────
    const server = http.createServer((req, res) => {
        // Health-check
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', watching: branchNames }));
            return;
        }

        // Only accept POST /webhook
        if (req.method !== 'POST' || req.url !== '/webhook') {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
            // Verify GitHub signature
            const sig = req.headers['x-hub-signature-256'] || '';
            if (!verifySignature(body, sig)) {
                console.warn('  [webhook] ✘ Invalid signature – ignoring.');
                res.writeHead(401);
                res.end('Invalid signature');
                return;
            }

            let payload;
            try { payload = JSON.parse(body); }
            catch { res.writeHead(400); res.end('Bad JSON'); return; }

            const event = req.headers['x-github-event'] || 'unknown';
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`  GITHUB WEBHOOK  event=${event}`);
            console.log(`${'═'.repeat(60)}`);

            // We only care about push events
            if (event !== 'push') {
                console.log(`  [webhook] Ignoring event type: ${event}`);
                res.writeHead(200);
                res.end('OK (ignored)');
                return;
            }

            // IMPORTANT: ignore all non-requirements changes.
            // We only trigger if the push touched either requirements.md.
            const touched = new Set();
            const commits = payload.commits || [];
            for (const commit of commits) {
                const allFiles = [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])];
                for (const f of allFiles) {
                    const norm = String(f).replace(/\\/g, '/');
                    if (norm === 'deposit/requirements.md') touched.add('deposit');
                    if (norm === 'display/requirements.md') touched.add('display');
                }
            }

            if (touched.size === 0) {
                console.log('  [webhook] requirements.md not touched – ignoring push.');
                res.writeHead(200);
                res.end('OK (ignored: no requirements changes)');
                return;
            }

            console.log(`  [webhook] requirements touched: ${[...touched].join(', ')} → triggering remote fetch+diff`);
            await processRemoteChanges('github-webhook');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'processed',
                requirementsTouched: [...touched],
            }));
        });
    });

    if (config.webhookPort > 0) {
        server.on('error', (err) => {
            console.error(`  [webhook server] FAILED to start: ${err.message}`);
            console.error('  Tip: set WEBHOOK_PORT=0 to run polling-only, or choose a different WEBHOOK_PORT.');
        });
        server.listen(config.webhookPort, () => {
            console.log(`  🌐 Webhook server listening on port ${config.webhookPort}\n`);
        });
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Poll remote periodically (team default)
    // ────────────────────────────────────────────────────────────────
    if (config.pollSeconds > 0) {
        setInterval(() => {
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`  REMOTE POLL  ref=${config.remoteRef}`);
            console.log(`${'═'.repeat(60)}`);
            processRemoteChanges('remote-poll').catch((e) => {
                console.error(`  [remote poll] error: ${e.message}`);
            });
        }, config.pollSeconds * 1000);
    }

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n  Shutting down…');
        watcher.close();
        if (config.webhookPort > 0) server.close();
        process.exit(0);
    });
}

start();
