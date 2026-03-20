# Deposit (Publishers) — PSP Requirements + Prototype Notes

This folder contains a **minimal runnable prototype** for the **Publisher Submissions Portal (PSP)** described in:
- `requitrements/PROJECT_SUMMARY.md`
- `requitrements/TECH_STACK_ARCHITECTURE.md`

It is intentionally implemented as **only 3 files**:
- `frontend.html` — single-file UI for registration, login (MFA), submission, staff review
- `backend.js` — single-file Node.js API server (in-memory data)
- `requirements.md` — this file

## Actors & Roles

- **Guest publisher**: requests access (registration).
- **Publisher (standard)**: submits content; submissions go through staff review.
- **Publisher (trusted)**: trusted publisher flag allows submissions to skip the staff review workflow.
- **Library staff**: reviews registration requests and content submissions; approves/rejects.

## Content Types

The PSP must support these content types (modeled in `PROJECT_SUMMARY.md`):
- Books
- Journals
- Music
- Other material

In the real system, a submission contains:
- Metadata (MARC21/ONIX converted to MARC21)
- One or more content files (e.g., PDF/ePub; format rules per content type)

## Requirements — End-to-End Workflows

### 1) Registration Workflow

1. A guest submits a registration request (publisher name, contact, required info).
2. The request is queued for library staff.
3. Staff actions:
   - Approve: create publisher + allow account creation / activation.
   - Reject: deny access with an explanation for next steps.
4. A publisher can be marked **Trusted**.
   - Trusted publishers skip submission approval workflow (they can submit directly to publish pipeline).

Prototype notes (`deposit/backend.js`):
- The prototype models registration requests and publisher/user status in-memory.
- MFA (TOTP) is part of publisher authentication (below).

### 2) Authentication & MFA/TOTP

The PSP must implement:
- Password login
- MFA challenge via TOTP (prototype-friendly)
- Token/session expiry rules

Prototype notes:
- MFA/TOTP is implemented as a prototype flow.
- Storage is in-memory only (not production-grade).

### 3) Content Submission Workflow

Inputs (high level):
- Content type (book/journal/music/other)
- Metadata
- Content files

Core rules:
1. Submission is received.
2. System performs **duplicate detection** (see below).
3. Content enters a workflow:
   - If publisher is **trusted**: staff review can be bypassed.
   - Otherwise: create a staff review task.
4. Staff can approve/reject:
   - Approve: content becomes publishable and should be visible to CDP.
   - Reject: content remains unpublished and can be revised/resubmitted.

Submission methods (from `PROJECT_SUMMARY.md`):
- Manual browser upload
- Bulk upload (up to 50 files at once)
- Automated SFTP feed (for library/staff bulk operations)

Prototype notes:
- The current 3-file prototype focuses on the core submission rules and review workflow.
- Bulk upload and SFTP feed are **next steps** in this prototype.

### 4) Duplicate Detection & Versioning

Duplicate detection must use:
- **ISBN matching** (primary identifier)
- Hashing as an additional safety net (SHA-256)

If a duplicate submission is detected:
- Create a **new version** instead of a full duplicate entry.
- Versioning rules:
  - Publishers can update content; this increments version number.
  - Old versions are retained for approximately **6 months**, then removed.
  - Only the latest version is visible to end users.

Prototype notes:
- SHA-256 hashing and publisher-scoped versioning are implemented in-memory.

### 5) Embargo Support

Embargo requirements:
- Library staff can set embargoes to delay visibility.
- Embargo can be set at:
  - **Publisher level**
  - **Content level**
- Content must not be visible to CDP until embargo end time.

Prototype notes:
- The prototype models embargo fields and can enforce visibility rules at approval/publish time (next steps may be needed depending on how you wire CDP visibility).

### 6) Security, Audit & Data Protection

Production expectations from `PROJECT_SUMMARY.md`:
- Encrypt data in transit and at rest
- Secure authentication with MFA
- Audit trail for workflow decisions

Prototype notes:
- This prototype does not include a full audit trail or persistent storage.

## What is implemented in the current PSP prototype (3 files)

- Registration request + staff approve/reject
- Trusted publisher flag (skips staff review workflow)
- Password login + MFA/TOTP prototype flow
- Content submission flow with SHA-256 hashing
- Duplicate/version handling based on ISBN (publisher-scoped)
- Staff workflow approve/reject for non-trusted publishers

## What is NOT implemented yet (next steps)

From `PROJECT_SUMMARY.md`, typical next steps include:
- Persistent DB layer (PostgreSQL) + real user/publisher storage
- Redis/RabbitMQ for workflow + concurrency services
- Full duplicate rules and retention jobs for old versions
- Real search indexing integration (CDP-side search backplane)
- SFTP ingest pipeline + bulk upload support
- Full audit trail and downstream reporting/export
- Production crypto + key management

## Run locally (Windows / PowerShell)

### 1) Start the backend

From the repo root:

```powershell
node .\deposit\backend.js
```

It listens on `http://localhost:7001`.

### 2) Open the frontend

Open `deposit/frontend.html` in a browser, or serve via:

```powershell
python -m http.server 5173
```

Then navigate to `http://localhost:5173/deposit/frontend.html`.

## Notes

- This is a minimal prototype; production will use Spring Boot + React + PostgreSQL.