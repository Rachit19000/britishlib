# Project Tasks

## PSP (Deposit / Publisher Submissions Portal)
1. Finalize publisher registration workflow and approval states.
2. Confirm MFA/TOTP requirements (issuer, recovery flow, verification timing).
3. Define content submission schema (metadata fields, file upload rules, limits).
4. Lock down SHA-256 hashing + duplicate/versioning rules (publisher-scoped vs global).
5. Define staff review workflow (approve/reject, required status transitions, audit notes).

## CDP (Display / Content Display Portal)
1. Finalize IP allowlisting rules and error UX (deny vs allow).
2. Implement per-location concurrency "turnaway" behavior and release timing.
3. Define search indexing expectations (fields, ranking, filters).
4. Confirm analytics events to capture (view, denied, turnaway, query).

## Requirements Webhook (requirements-webhook/)
1. Ensure GitHub webhook only triggers on `deposit/requirements.md` and `display/requirements.md`.
2. Keep startup catch-up working (detect missed pushes when the watcher was offline).
3. Prevent port conflicts automatically (port 9000).
4. Verify `REQUIREMENTS_CHANGES.md` propagation to both `deposit/` and `display/` on every change.
5. Decide whether to use webhook push (ngrok) or polling-only mode for the team.

## Documentation / Housekeeping
1. Add a short README in `requirements-webhook/` describing team startup steps.
2. Add a short README in `requitrements/` explaining how to keep requirements docs updated.
3. Review naming consistency: `requirements` vs `requitrements` (typo) across the repo.

