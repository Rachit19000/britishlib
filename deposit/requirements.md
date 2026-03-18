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


