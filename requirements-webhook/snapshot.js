/**
 * snapshot.js
 * -----------
 * Takes a baseline snapshot of deposit/requirements.md and
 * display/requirements.md so the watcher has something to diff against.
 *
 * Run once before starting the watcher:
 *   npm run snapshot
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { extractTextContent } = require('./extractor');

async function takeSnapshot() {
    // Ensure snapshots dir
    if (!fs.existsSync(config.snapshotsDir)) {
        fs.mkdirSync(config.snapshotsDir, { recursive: true });
    }

    console.log('Taking baseline snapshots…\n');

    for (const [branchName, branch] of Object.entries(config.branches)) {
        const filePath = branch.requirementsFile;

        if (!fs.existsSync(filePath)) {
            console.warn(`  [snapshot] ✘  ${branchName}/requirements.md does not exist – skipped.`);
            continue;
        }

        try {
            const content = await extractTextContent(filePath);
            const stat = fs.statSync(filePath);
            const snapshotPath = path.join(
                config.snapshotsDir,
                `${branchName}.requirements.md.snapshot`,
            );

            fs.writeFileSync(snapshotPath, JSON.stringify({
                branch: branchName,
                file: 'requirements.md',
                content,
                mtime: stat.mtimeMs,
                size: stat.size,
                snapshotAt: new Date().toISOString(),
            }, null, 2), 'utf-8');

            console.log(`  [snapshot] ✔  ${branchName}/requirements.md  (${stat.size} bytes)`);
        } catch (err) {
            console.error(`  [snapshot] ✘  ${branchName}: ${err.message}`);
        }
    }

    console.log('\nBaseline snapshot complete.');
}

takeSnapshot();
