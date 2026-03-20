/**
 * config.js
 * ----------
 * All settings are read from .env (dotenv) so nobody needs to
 * type $env: commands in PowerShell.  Just edit .env once.
 *
 * Watched files:
 *   • deposit/requirements.md   (Publisher Submissions Portal – PSP)
 *   • display/requirements.md   (Content Display Portal – CDP)
 *
 * When either file changes (via GitHub push webhook OR local edit),
 * a diff-based REQUIREMENTS_CHANGES.md is written into BOTH branches.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..');

module.exports = {
    projectRoot: PROJECT_ROOT,

    // ── The two branches we track ──────────────────────────────────
    branches: {
        deposit: {
            name: 'deposit',
            label: 'Publisher Submissions Portal (PSP)',
            dir: path.join(PROJECT_ROOT, 'deposit'),
            requirementsFile: path.join(PROJECT_ROOT, 'deposit', 'requirements.md'),
        },
        display: {
            name: 'display',
            label: 'Content Display Portal (CDP)',
            dir: path.join(PROJECT_ROOT, 'display'),
            requirementsFile: path.join(PROJECT_ROOT, 'display', 'requirements.md'),
        },
    },

    // ── Snapshot storage ───────────────────────────────────────────
    snapshotsDir: path.join(__dirname, '.snapshots'),

    // ── Change notification file written into each branch ──────────
    changeFileName: 'REQUIREMENTS_CHANGES.md',

    // ── GitHub Webhook ─────────────────────────────────────────────
    // Port the HTTP server listens on.  Set to 0 to disable (polling-only).
    webhookPort: parseInt(process.env.WEBHOOK_PORT, 10) || 9000,

    // Must match the "Secret" entered in GitHub → Settings → Webhooks.
    webhookSecret: process.env.WEBHOOK_SECRET || '',

    // ── Git ────────────────────────────────────────────────────────
    gitBin: process.env.GIT_PATH || 'git',

    // Remote ref used as the source of truth (no git pull needed).
    remoteRef: process.env.REMOTE_REF || 'origin/main',

    // ── Polling (fallback) ─────────────────────────────────────────
    // Seconds between remote checks.  0 = disabled (rely on webhook).
    pollSeconds: parseInt(process.env.POLL_SECONDS, 10) || 0,

    // ── Local watcher ──────────────────────────────────────────────
    debounceMs: 2000,
    watchExtensions: ['.md'],
};
