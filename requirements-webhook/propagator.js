/**
 * propagator.js
 * --------------
 * Writes the REQUIREMENTS_CHANGES.md notification into BOTH branch
 * folders (deposit/ and display/) so the change is immediately
 * visible inside Cursor regardless of which branch you're looking at.
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const digestStart = '<!-- AUTO_REQUIREMENTS_DIGEST_START -->';
const digestEnd = '<!-- AUTO_REQUIREMENTS_DIGEST_END -->';

function normalizeNotificationForGuidelines(markdownContent) {
    // Move top-level headers (starting with "# ") one level down so it
    // renders nicely inside the guidelines file.
    return String(markdownContent).replace(/^# /gm, '## ');
}

function ensureGuidelinesBaseFile(guidelinesPath) {
    if (fs.existsSync(guidelinesPath)) return;
    const title = `# ${path.basename(path.dirname(guidelinesPath)).toUpperCase()} — Coding Guidelines`;
    fs.writeFileSync(
        guidelinesPath,
        `${title}\n\n${digestStart}\n## Requirements Change Digest (auto-updated)\n\n<!-- No updates yet -->\n\n${digestEnd}\n`,
        'utf-8'
    );
}

function upsertGuidelinesDigest(guidelinesPath, markdownContent) {
    ensureGuidelinesBaseFile(guidelinesPath);

    const raw = fs.readFileSync(guidelinesPath, 'utf-8');
    const nextDigestBody = `\n${digestStart}\n## Requirements Change Digest (auto-updated)\n\n_Last updated from ` +
        `requirements-webhook/ notifications._\n\n${normalizeNotificationForGuidelines(markdownContent)}\n\n${digestEnd}\n`;

    const startIdx = raw.indexOf(digestStart);
    const endIdx = raw.indexOf(digestEnd);

    // If markers exist, replace exactly between them (inclusive markers).
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const before = raw.slice(0, startIdx);
        const after = raw.slice(endIdx + digestEnd.length);
        fs.writeFileSync(guidelinesPath, `${before}${nextDigestBody}${after}`, 'utf-8');
        return;
    }

    // Otherwise, append at the end.
    const sep = raw.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(guidelinesPath, `${raw}${sep}${nextDigestBody}`, 'utf-8');
}

/**
 * Write the markdown notification into every branch folder.
 *
 * @param {string} markdownContent  Full markdown text
 */
function propagateToRepos(markdownContent) {
    for (const [branchName, branch] of Object.entries(config.branches)) {
        const targetDir = branch.dir;
        const targetPath = path.join(targetDir, config.changeFileName);
        const guidelinesPath = path.join(targetDir, 'guidelines.md');

        try {
            if (!fs.existsSync(targetDir)) {
                console.warn(`  [propagate] Branch folder does not exist: ${targetDir}`);
                continue;
            }

            fs.writeFileSync(targetPath, markdownContent, 'utf-8');
            console.log(`  [propagate] ✔  ${branchName}/${config.changeFileName}`);

            // Also refresh guidelines digest section so teammates can see
            // requirements changes without opening REQUIREMENTS_CHANGES.md.
            upsertGuidelinesDigest(guidelinesPath, markdownContent);
            console.log(`  [propagate] ✔  ${branchName}/guidelines.md digest`);
        } catch (err) {
            console.error(`  [propagate] ✘  Failed to write to ${targetDir}: ${err.message}`);
        }
    }
}

module.exports = { propagateToRepos };
