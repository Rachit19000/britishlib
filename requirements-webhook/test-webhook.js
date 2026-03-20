/**
 * test-webhook.js
 * ----------------
 * Simulates a GitHub push webhook hitting http://localhost:9000/webhook
 * so you can verify the pipeline locally without an actual GitHub push.
 *
 * Usage:
 *   1.  npm start               (in one terminal – starts watcher + webhook server)
 *   2.  npm run test-webhook    (in another terminal – fires a fake push event)
 */
const http = require('http');
const crypto = require('crypto');

const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT, 10) || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// Simulate a push that touches both requirements files
const payload = JSON.stringify({
    ref: 'refs/heads/main',
    commits: [
        {
            id: 'abc123fake',
            message: 'docs: update deposit + display requirements',
            added: [],
            modified: [
                'deposit/requirements.md',
                'display/requirements.md',
            ],
            removed: [],
        },
    ],
});

const headers = {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'push',
};

// Add signature if a secret is configured
if (WEBHOOK_SECRET) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(payload);
    headers['X-Hub-Signature-256'] = 'sha256=' + hmac.digest('hex');
}

const req = http.request(
    {
        hostname: 'localhost',
        port: WEBHOOK_PORT,
        path: '/webhook',
        method: 'POST',
        headers,
    },
    (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
            console.log(`\nResponse: ${res.statusCode}`);
            console.log(body);
        });
    },
);

req.on('error', (err) => {
    console.error(`Could not reach webhook server on port ${WEBHOOK_PORT}: ${err.message}`);
    console.error('Make sure the watcher is running (npm start).');
});

req.write(payload);
req.end();
console.log(`Sending fake GitHub push event to http://localhost:${WEBHOOK_PORT}/webhook …`);
