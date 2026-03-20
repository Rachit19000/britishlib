# 🔔 Requirements Change Notification

> **Auto-generated** by the ELDROS requirements webhook.
> **Generated at**: 2026-03-20T06:15:12.736Z

---

## Branch Changed: `deposit/`  –  Publisher Submissions Portal (PSP)

| Field | Value |
|-------|-------|
| **File** | `deposit/requirements.md` |
| **Change type** | MODIFIED (remote) |
| **Trigger** | 🌐 GitHub push webhook |
| **Detected at** | 2026-03-20T06:15:12.582Z |
| **Summary** | 141 line(s) added, 14 line(s) removed. |

### ➕ Added

```diff
+ # Deposit (Publishers) — PSP Requirements + Prototype Notes
```

```diff
+ This folder contains a **minimal runnable prototype** for the **Publisher Submissions Portal (PSP)** described in:
+ - `requitrements/PROJECT_SUMMARY.md`
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
```

```diff
+ It is intentionally implemented as **only 3 files**:
+ - `frontend.html` — single-file UI for registration, login (MFA), submission, staff review
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file
```

```diff
+ ## Actors & Roles
```

```diff
+ - **Guest publisher**: requests access (registration).
+ - **Publisher (standard)**: submits content; submissions go through staff review.
+ - **Publisher (trusted)**: trusted publisher flag allows submissions to skip the staff review workflow.
+ - **Library staff**: reviews registration requests and content submissions; approves/rejects.
```

```diff
+ ## Content Types
```

```diff
+ The PSP must support these content types (modeled in `PROJECT_SUMMARY.md`):
+ - Books
+ - Journals
+ - Music
+ - Other material
```

```diff
+ In the real system, a submission contains:
+ - Metadata (MARC21/ONIX converted to MARC21)
+ - One or more content files (e.g., PDF/ePub; format rules per content type)
```

```diff
+ ## Requirements — End-to-End Workflows
```

```diff
+ ### 1) Registration Workflow
```

```diff
+ 1. A guest submits a registration request (publisher name, contact, required info).
+ 2. The request is queued for library staff.
+ 3. Staff actions:
+    - Approve: create publisher + allow account creation / activation.
+    - Reject: deny access with an explanation for next steps.
+ 4. A publisher can be marked **Trusted**.
+    - Trusted publishers skip submission approval workflow (they can submit directly to publish pipeline).
```

```diff
+ Prototype notes (`deposit/backend.js`):
+ - The prototype models registration requests and publisher/user status in-memory.
+ - MFA (TOTP) is part of publisher authentication (below).
```

```diff
+ ### 2) Authentication & MFA/TOTP
```

```diff
+ The PSP must implement:
+ - Password login
+ - MFA challenge via TOTP (prototype-friendly)
+ - Token/session expiry rules
```

```diff
+ Prototype notes:
+ - MFA/TOTP is implemented as a prototype flow.
+ - Storage is in-memory only (not production-grade).
```

```diff
+ ### 3) Content Submission Workflow
```

```diff
+ Inputs (high level):
+ - Content type (book/journal/music/other)
+ - Metadata
+ - Content files
```

```diff
+ Core rules:
+ 1. Submission is received.
+ 2. System performs **duplicate detection** (see below).
+ 3. Content enters a workflow:
+    - If publisher is **trusted**: staff review can be bypassed.
+    - Otherwise: create a staff review task.
+ 4. Staff can approve/reject:
+    - Approve: content becomes publishable and should be visible to CDP.
+    - Reject: content remains unpublished and can be revised/resubmitted.
```

```diff
+ Submission methods (from `PROJECT_SUMMARY.md`):
+ - Manual browser upload
+ - Bulk upload (up to 50 files at once)
+ - Automated SFTP feed (for library/staff bulk operations)
```

```diff
+ Prototype notes:
+ - The current 3-file prototype focuses on the core submission rules and review workflow.
+ - Bulk upload and SFTP feed are **next steps** in this prototype.
```

```diff
+ ### 4) Duplicate Detection & Versioning
```

```diff
+ Duplicate detection must use:
+ - **ISBN matching** (primary identifier)
+ - Hashing as an additional safety net (SHA-256)
```

```diff
+ If a duplicate submission is detected:
+ - Create a **new version** instead of a full duplicate entry.
+ - Versioning rules:
+   - Publishers can update content; this increments version number.
+   - Old versions are retained for approximately **6 months**, then removed.
+   - Only the latest version is visible to end users.
```

```diff
+ Prototype notes:
+ - SHA-256 hashing and publisher-scoped versioning are implemented in-memory.
```

```diff
+ ### 5) Embargo Support
```

```diff
+ Embargo requirements:
+ - Library staff can set embargoes to delay visibility.
+ - Embargo can be set at:
+   - **Publisher level**
+   - **Content level**
+ - Content must not be visible to CDP until embargo end time.
+ 
+ Prototype notes:
+ - The prototype models embargo fields and can enforce visibility rules at approval/publish time (next steps may be needed depending on how you wire CDP visibility).
+ 
+ ### 6) Security, Audit & Data Protection
+ 
+ Production expectations from `PROJECT_SUMMARY.md`:
+ - Encrypt data in transit and at rest
+ - Secure authentication with MFA
+ - Audit trail for workflow decisions
+ 
+ Prototype notes:
+ - This prototype does not include a full audit trail or persistent storage.
+ 
+ ## What is implemented in the current PSP prototype (3 files)
+ 
+ - Registration request + staff approve/reject
+ - Trusted publisher flag (skips staff review workflow)
+ - Password login + MFA/TOTP prototype flow
+ - Content submission flow with SHA-256 hashing
+ - Duplicate/version handling based on ISBN (publisher-scoped)
+ - Staff workflow approve/reject for non-trusted publishers
+ 
+ ## What is NOT implemented yet (next steps)
+ 
+ From `PROJECT_SUMMARY.md`, typical next steps include:
+ - Persistent DB layer (PostgreSQL) + real user/publisher storage
+ - Redis/RabbitMQ for workflow + concurrency services
+ - Full duplicate rules and retention jobs for old versions
+ - Real search indexing integration (CDP-side search backplane)
+ - SFTP ingest pipeline + bulk upload support
+ - Full audit trail and downstream reporting/export
+ - Production crypto + key management
+ 
+ ## Run locally (Windows / PowerShell)
+ 
+ ### 1) Start the backend
+ 
+ From the repo root:
+ 
+ ```powershell
+ node .\deposit\backend.js
+ ```
+ 
+ It listens on `http://localhost:7001`.
+ 
+ ### 2) Open the frontend
+ 
+ Open `deposit/frontend.html` in a browser, or serve via:
+ 
+ ```powershell
+ python -m http.server 5173
+ ```
+ 
+ Then navigate to `http://localhost:5173/deposit/frontend.html`.
+ 
+ ## Notes
+ 
+ - This is a minimal prototype; production will use Spring Boot + React + PostgreSQL.
```

### ➖ Removed

```diff
- 1. Introduction
- Purpose
```

```diff
- The OSMS is developed to digitize and automate HR operations including employee data management, attendance monitoring, payroll processing, and leave tracking.
```

```diff
- Scope
```

```diff
- The system supports:
```

```diff
- Employee lifecycle management
```

```diff
- Attendance and time tracking
```

```diff
- Payroll automation
```

```diff
- Role-based access control
```

```diff
- Reporting and analytics
```

```diff
- 2. System Overview
- Product Perspective
```

```diff
- A scalable application that integrates HR processes into a single system.
```

```diff
- Functions
```

### ✏️ Modified (Before → After)

**Before:**
```diff
- 1. Introduction
- Purpose
```
**After:**
```diff
+ # Deposit (Publishers) — PSP Requirements + Prototype Notes
```

**Before:**
```diff
- The OSMS is developed to digitize and automate HR operations including employee data management, attendance monitoring, payroll processing, and leave tracking.
```
**After:**
```diff
+ This folder contains a **minimal runnable prototype** for the **Publisher Submissions Portal (PSP)** described in:
+ - `requitrements/PROJECT_SUMMARY.md`
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
```

**Before:**
```diff
- Scope
```
**After:**
```diff
+ It is intentionally implemented as **only 3 files**:
+ - `frontend.html` — single-file UI for registration, login (MFA), submission, staff review
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file
```

**Before:**
```diff
- The system supports:
```
**After:**
```diff
+ ## Actors & Roles
```

**Before:**
```diff
- Employee lifecycle management
```
**After:**
```diff
+ - **Guest publisher**: requests access (registration).
+ - **Publisher (standard)**: submits content; submissions go through staff review.
+ - **Publisher (trusted)**: trusted publisher flag allows submissions to skip the staff review workflow.
+ - **Library staff**: reviews registration requests and content submissions; approves/rejects.
```

**Before:**
```diff
- Attendance and time tracking
```
**After:**
```diff
+ ## Content Types
```

**Before:**
```diff
- Payroll automation
```
**After:**
```diff
+ The PSP must support these content types (modeled in `PROJECT_SUMMARY.md`):
+ - Books
+ - Journals
+ - Music
+ - Other material
```

**Before:**
```diff
- Role-based access control
```
**After:**
```diff
+ In the real system, a submission contains:
+ - Metadata (MARC21/ONIX converted to MARC21)
+ - One or more content files (e.g., PDF/ePub; format rules per content type)
```

**Before:**
```diff
- Reporting and analytics
```
**After:**
```diff
+ ## Requirements — End-to-End Workflows
```

**Before:**
```diff
- 2. System Overview
- Product Perspective
```
**After:**
```diff
+ ### 1) Registration Workflow
```

**Before:**
```diff
- A scalable application that integrates HR processes into a single system.
```
**After:**
```diff
+ 1. A guest submits a registration request (publisher name, contact, required info).
+ 2. The request is queued for library staff.
+ 3. Staff actions:
+    - Approve: create publisher + allow account creation / activation.
+    - Reject: deny access with an explanation for next steps.
+ 4. A publisher can be marked **Trusted**.
+    - Trusted publishers skip submission approval workflow (they can submit directly to publish pipeline).
```

**Before:**
```diff
- Functions
```
**After:**
```diff
+ Prototype notes (`deposit/backend.js`):
+ - The prototype models registration requests and publisher/user status in-memory.
+ - MFA (TOTP) is part of publisher authentication (below).
```

---

## Branch Changed: `display/`  –  Content Display Portal (CDP)

| Field | Value |
|-------|-------|
| **File** | `display/requirements.md` |
| **Change type** | MODIFIED (remote) |
| **Trigger** | 🌐 GitHub push webhook |
| **Detected at** | 2026-03-20T06:15:12.722Z |
| **Summary** | 116 line(s) added, 3 line(s) removed. |

### ➕ Added

```diff
+ # Display (Readers) — CDP Requirements + Prototype Notes
```

```diff
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
```

```diff
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file (this doc)
```

```diff
+ ## Actors & Access Rules
```

```diff
+ - **Library visitor (guest)**:
+   - May access CDP only from **approved library terminals**.
+   - Access control is **IP-based** (prototype uses exact IP match).
+ - **Logged-in users** (future):
+   - May use personalization features (bookmarks, saved searches).
+   - Not implemented in the 3-file prototype.
+ - **Library staff / catalog staff** (future):
+   - May view content without concurrency restrictions.
+   - Not implemented in the prototype.
```

```diff
+ ## Content Display Requirements
```

```diff
+ ### 1) IP-based Access Control
```

```diff
+ CDP endpoints must be restricted to allowlisted IPs.
+ - Default: allow `127.0.0.1` and `::1` in the prototype.
+ - Real system: allowlist can include CIDRs and should log access denials.
```

```diff
+ Prototype notes:
+ - Implemented in `display/backend.js` via `ALLOWED_IPS` and an IP check function.
```

```diff
+ ### 2) Content Search
```

```diff
+ CDP must provide metadata search across the catalog:
+ - Search across fields (prototype models: title / ISBN / publisher).
+ - Filter by content type (books / journals / music / other material).
+ 
+ Prototype notes:
+ - In the current prototype, search is in-memory and returns seeded catalog entries.
+ 
+ ### 3) View + Concurrency Control ("Turnaway")
+ 
+ Requirement:
+ - Only **one person per library location** can view the same **content item** at a time.
+ 
+ Rules:
+ - Lock key must include both:
+   - `contentId`
+   - `locationId` (library terminal / reading room identifier)
+ - When a second viewer tries to acquire the lock:
+   - return a **turnaway** response
+ 
+ Prototype notes:
+ - Implemented in-memory with a lock TTL.
+ - The prototype includes a simple turnaway UI flow.
+ 
+ ### 4) Analytics / Reporting Signals
+ 
+ CDP must capture usage signals:
+ - Search events
+ - View start / view end
+ - Turnaway counts
+ 
+ Prototype notes:
+ - Implemented in-memory analytics array with route-level event logging.
+ 
+ ## Content Catalog & Formats
+ 
+ Real system expectations:
+ - Content can be stored as PDF/ePub and streamed/served to the browser.
+ - Searches are backed by a proper search index (Elasticsearch/Solr).
+ 
+ Prototype notes:
+ - The prototype does not stream real files; it demonstrates view/search/concurrency with placeholder content.
+ 
+ ## Run locally (Windows / PowerShell)
+ 
+ ### 1) Start the backend
+ 
+ From the repo root:
+ 
+ ```powershell
+ node .\display\backend.js
+ ```
+ 
+ It listens on `http://localhost:7002`.
+ 
+ ### 2) Open the frontend
+ 
+ Open this file in a browser:
+ - `display/frontend.html`
+ 
+ If your browser blocks cross-origin requests from `file://`, use a simple local static server:
+ 
+ ```powershell
+ python -m http.server 5173
+ ```
+ 
+ Then open:
+ - `http://localhost:5173/display/frontend.html`
+ 
+ ## IP allowlisting (prototype)
+ 
+ By default, the backend allows only:
+ - `127.0.0.1`
+ - `::1`
+ 
+ To set an allowlist:
+ 
+ ```powershell
+ $env:CDP_ALLOWED_IPS="127.0.0.1,::1"
+ node .\display\backend.js
+ ```
+ 
+ ## Concurrency / turnaway demo
+ 
+ 1. Open `display/frontend.html` in **two** windows.
+ 2. Keep the same **Library location ID** in both windows (e.g., `reading-room-a`).
+ 3. Click **Start viewing** for the same **Content ID** in window 1.
+ 4. Try **Start viewing** in window 2 → you should get a **turnaway** response.
+ 
+ ## Notes / next steps
+ 
+ - Real implementation uses **Redis locks** for concurrency and signed URLs to stream PDF/ePub from object storage.
+ - Real search uses **Elasticsearch/Solr** with metadata + full-text indexing.
+ - Personalization features are out-of-scope for this 3-file prototype.
```

### ➖ Removed

```diff
- # Display (Readers) — CDP Prototype (3 files)
```

```diff
- - `requitrements/TECH_STACK_ARCHITECTURE.md` (see “Content Display Flow” and “Concurrency Control Service”)
```

```diff
- - # this is display implmentation
```

### ✏️ Modified (Before → After)

**Before:**
```diff
- # Display (Readers) — CDP Prototype (3 files)
```
**After:**
```diff
+ # Display (Readers) — CDP Requirements + Prototype Notes
```

**Before:**
```diff
- - `requitrements/TECH_STACK_ARCHITECTURE.md` (see “Content Display Flow” and “Concurrency Control Service”)
```
**After:**
```diff
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
```

**Before:**
```diff
- - # this is display implmentation
```
**After:**
```diff
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file (this doc)
```

---

## 📋 Action Required

- **Deposit (PSP)** requirements changed — review your backend API contracts, submission workflow, and publisher registration logic.
- **Display (CDP)** requirements changed — review your content display rules, search behaviour, concurrency / turnaway logic, and analytics events.

> This file is **overwritten** on every change. Check git history for the full change trail.
