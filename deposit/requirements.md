# Deposit (Publishers) — PSP Prototype (3 files)

This folder contains a **minimal runnable prototype** for the **Publisher Submissions Portal (PSP)** described in `requitrements/PROJECT_SUMMARY.md` and `requitrements/TECH_STACK_ARCHITECTURE.md`.

It is intentionally implemented as **only 3 files**:

- `frontend.html` — single-file UI for registration, login (MFA), submission, staff review
- `backend.js` — single-file Node.js API server (in-memory data)
- `requirements.md` — this file

## What’s implemented (mapped to requirements)

- **Registration workflow**
  - Guest creates registration request
  - Library staff approves (creates publisher + user) or rejects
  - Publisher can be marked **Trusted** (auto-approves submissions)
- **Authentication**
  - Password login
  - **MFA/TOTP** support (prototype-friendly)
- **Content submission**
  - Submit content type + metadata + file bytes
  - SHA-256 hashing for duplicate/version behavior
  - Version increment when re-submitting the same ISBN (publisher-scoped)
- **Workflow**
  - Non-trusted publishers create a staff review task
  - Staff can approve/reject

## Run locally (Windows / PowerShell)

### 1) Start the backend

From the repo root:

```powershell
node .\deposit\backend.js
```

It listens on `http://localhost:7001`.

### 2) Open the frontend

Open this file in a browser:

- `deposit/frontend.html`

If your browser blocks cross-origin requests from `file://`, use a simple local static server:

```powershell
python -m http.server 5173
```

Then open:

- `http://localhost:5173/deposit/frontend.html`

## Demo accounts

Backend seeds a demo staff user:

- **email**: `staff@bl.uk`
- **password**: `staff-password`
- **TOTP secret (Base32)**: `JBSWY3DPEHPK3PXP`

The UI also shows the backend-provided `demoTotpNow` during login for convenience.

## API quick reference

- `POST /api/register`
- `GET /api/staff/registration-requests` (staff)
- `POST /api/staff/registration-requests/decide` (staff)
- `POST /api/auth/login`
- `POST /api/auth/mfa`
- `POST /api/submissions` (publisher/staff)
- `GET /api/submissions` (publisher/staff)
- `GET /api/staff/workflow-tasks` (staff)
- `POST /api/staff/workflow-tasks/decide` (staff)

## Notes / next steps

- Storage is in-memory (restart resets data). For the real stack, swap in **Spring Boot + PostgreSQL + Redis** as per the architecture doc.
- File storage is represented by uploaded bytes + hash; real solution would stream to object storage (S3/MinIO) and store URLs.
- Virus scanning, ONIX→MARC conversion, and staff email notifications are out-of-scope for this 3-file prototype.

