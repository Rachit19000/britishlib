/**
 * differ.js
 * ----------
 * Compares old snapshot content with current file content and
 * returns a structured change object ready for markdown rendering.
 */
const Diff = require('diff');

/**
 * Build a human-readable list of changes between two text blobs.
 *
 * @param {string} oldText   Previous snapshot text
 * @param {string} newText   Current file text
 * @returns {{ added: string[], removed: string[], changed: {before: string, after: string}[], summary: string }}
 */
function computeChanges(oldText, newText) {
    const result = {
        added: [],
        removed: [],
        changed: [],
        summary: '',
    };

    if (oldText === newText) {
        result.summary = 'No content changes detected (metadata only).';
        return result;
    }

    const diffs = Diff.diffLines(oldText, newText);

    let addedCount = 0;
    let removedCount = 0;

    for (const part of diffs) {
        const trimmed = part.value.trim();
        if (!trimmed) continue;

        if (part.added) {
            addedCount += part.count || 1;
            result.added.push(trimmed);
        } else if (part.removed) {
            removedCount += part.count || 1;
            result.removed.push(trimmed);
        }
    }

    // Build structured changed pairs (removed → added in sequence)
    const pairCount = Math.min(result.removed.length, result.added.length);
    for (let i = 0; i < pairCount; i++) {
        result.changed.push({
            before: result.removed[i],
            after: result.added[i],
        });
    }

    result.summary = `${addedCount} line(s) added, ${removedCount} line(s) removed.`;
    return result;
}

module.exports = { computeChanges };
