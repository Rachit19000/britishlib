/**
 * generator.js
 * -------------
 * Builds the REQUIREMENTS_CHANGES.md notification from one or more
 * branch-level change records.
 *
 * The output clearly shows:
 *   • Which branch(es) changed  (deposit / display)
 *   • What triggered the change (local edit / GitHub push)
 *   • A line-level diff (added / removed / modified)
 *   • Action items for the OTHER branch
 */

/**
 * @param {Array<{
 *   branch: string,
 *   label: string,
 *   file: string,
 *   timestamp: string,
 *   eventType: string,
 *   trigger: string,
 *   changes: { added: string[], removed: string[], changed: {before:string,after:string}[], summary: string }
 * }>} events
 * @returns {string}
 */
function generateMarkdown(events) {
    const L = [];

    L.push('# 🔔 Requirements Change Notification');
    L.push('');
    L.push('> **Auto-generated** by the ELDROS requirements webhook.');
    L.push(`> **Generated at**: ${new Date().toISOString()}`);
    L.push('');
    L.push('---');
    L.push('');

    // ── Per-branch sections ──────────────────────────────────────────
    for (const evt of events) {
        L.push(`## Branch Changed: \`${evt.branch}/\`  –  ${evt.label}`);
        L.push('');
        L.push(`| Field | Value |`);
        L.push(`|-------|-------|`);
        L.push(`| **File** | \`${evt.branch}/${evt.file}\` |`);
        L.push(`| **Change type** | ${evt.eventType} |`);
        L.push(`| **Trigger** | ${evt.trigger === 'github-webhook' ? '🌐 GitHub push webhook' : '📂 Local file change'} |`);
        L.push(`| **Detected at** | ${evt.timestamp} |`);
        L.push(`| **Summary** | ${evt.changes.summary} |`);
        L.push('');

        // Added lines
        if (evt.changes.added.length > 0) {
            L.push('### ➕ Added');
            L.push('');
            for (const a of evt.changes.added) {
                L.push('```diff');
                for (const line of a.split('\n')) L.push(`+ ${line}`);
                L.push('```');
                L.push('');
            }
        }

        // Removed lines
        if (evt.changes.removed.length > 0) {
            L.push('### ➖ Removed');
            L.push('');
            for (const r of evt.changes.removed) {
                L.push('```diff');
                for (const line of r.split('\n')) L.push(`- ${line}`);
                L.push('```');
                L.push('');
            }
        }

        // Changed pairs
        if (evt.changes.changed.length > 0) {
            L.push('### ✏️ Modified (Before → After)');
            L.push('');
            for (const c of evt.changes.changed) {
                L.push('**Before:**');
                L.push('```diff');
                for (const line of c.before.split('\n')) L.push(`- ${line}`);
                L.push('```');
                L.push('**After:**');
                L.push('```diff');
                for (const line of c.after.split('\n')) L.push(`+ ${line}`);
                L.push('```');
                L.push('');
            }
        }

        L.push('---');
        L.push('');
    }

    // ── Cross-branch impact notice ───────────────────────────────────
    const changedBranches = events.map(e => e.branch);
    const otherBranches = Object.keys(require('./config').branches)
        .filter(b => !changedBranches.includes(b));

    L.push('## 📋 Action Required');
    L.push('');
    if (changedBranches.includes('deposit')) {
        L.push('- **Deposit (PSP)** requirements changed — review your backend API contracts, submission workflow, and publisher registration logic.');
    }
    if (changedBranches.includes('display')) {
        L.push('- **Display (CDP)** requirements changed — review your content display rules, search behaviour, concurrency / turnaway logic, and analytics events.');
    }
    if (otherBranches.length > 0) {
        L.push('');
        L.push(`> ℹ️  This notification was also written to **${otherBranches.join(', ')}/** so both branches stay informed.`);
    }
    L.push('');
    L.push('> This file is **overwritten** on every change. Check git history for the full change trail.');
    L.push('');

    return L.join('\n');
}

module.exports = { generateMarkdown };
