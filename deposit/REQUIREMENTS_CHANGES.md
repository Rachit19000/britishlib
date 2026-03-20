# 🔔 Requirements Change Notification

> **Auto-generated** by the ELDROS requirements webhook.
> **Generated at**: 2026-03-20T05:51:59.268Z

---

## Branch Changed: `display/`  –  Content Display Portal (CDP)

| Field | Value |
|-------|-------|
| **File** | `display/requirements.md` |
| **Change type** | MODIFIED |
| **Trigger** | 📂 Local file change |
| **Detected at** | 2026-03-20T05:51:59.249Z |
| **Summary** | 130 line(s) added, 23 line(s) removed. |

### ➕ Added

```diff
+ # Display (Readers) — CDP Requirements + Prototype Notes
+ 
+ This folder contains a **minimal runnable prototype** for the **Content Display Portal (CDP)** described in:
+ - `requitrements/PROJECT_SUMMARY.md`
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
+ 
+ It is intentionally implemented as **only 3 files**:
+ - `frontend.html` — single-file UI for search + view + turnaway demo
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file (this doc)
+ 
+ ## Actors & Access Rules
+ 
+ - **Library visitor (guest)**:
+   - May access CDP only from **approved library terminals**.
+   - Access control is **IP-based** (prototype uses exact IP match).
+ - **Logged-in users** (future):
+   - May use personalization features (bookmarks, saved searches).
+   - Not implemented in the 3-file prototype.
+ - **Library staff / catalog staff** (future):
+   - May view content without concurrency restrictions.
+   - Not implemented in the prototype.
+ 
+ ## Content Display Requirements
+ 
+ ### 1) IP-based Access Control
+ 
+ CDP endpoints must be restricted to allowlisted IPs.
+ - Default: allow `127.0.0.1` and `::1` in the prototype.
+ - Real system: allowlist can include CIDRs and should log access denials.
+ 
+ Prototype notes:
+ - Implemented in `display/backend.js` via `ALLOWED_IPS` and an IP check function.
+ 
+ ### 2) Content Search
+ 
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
- 
- This folder contains a **minimal runnable prototype** for the **Content Display Portal (CDP)** described in:
- 
- - `requitrements/PROJECT_SUMMARY.md`
- - `requitrements/TECH_STACK_ARCHITECTURE.md` (see “Content Display Flow” and “Concurrency Control Service”)
- 
- It is intentionally implemented as **only 3 files**:
- 
- - `frontend.html` — single-file UI for search + view + turnaway demo
- - `backend.js` — single-file Node.js API server (in-memory data)
- - `requirements.md` — this file
- 
- ## What’s implemented (mapped to requirements)
- 
- - **IP-based access control**
```

### ✏️ Modified (Before → After)

**Before:**
```diff
- # Display (Readers) — CDP Prototype (3 files)
- 
- This folder contains a **minimal runnable prototype** for the **Content Display Portal (CDP)** described in:
- 
- - `requitrements/PROJECT_SUMMARY.md`
- - `requitrements/TECH_STACK_ARCHITECTURE.md` (see “Content Display Flow” and “Concurrency Control Service”)
- 
- It is intentionally implemented as **only 3 files**:
- 
- - `frontend.html` — single-file UI for search + view + turnaway demo
- - `backend.js` — single-file Node.js API server (in-memory data)
- - `requirements.md` — this file
- 
- ## What’s implemented (mapped to requirements)
- 
- - **IP-based access control**
```
**After:**
```diff
+ # Display (Readers) — CDP Requirements + Prototype Notes
+ 
+ This folder contains a **minimal runnable prototype** for the **Content Display Portal (CDP)** described in:
+ - `requitrements/PROJECT_SUMMARY.md`
+ - `requitrements/TECH_STACK_ARCHITECTURE.md`
+ 
+ It is intentionally implemented as **only 3 files**:
+ - `frontend.html` — single-file UI for search + view + turnaway demo
+ - `backend.js` — single-file Node.js API server (in-memory data)
+ - `requirements.md` — this file (this doc)
+ 
+ ## Actors & Access Rules
+ 
+ - **Library visitor (guest)**:
+   - May access CDP only from **approved library terminals**.
+   - Access control is **IP-based** (prototype uses exact IP match).
+ - **Logged-in users** (future):
+   - May use personalization features (bookmarks, saved searches).
+   - Not implemented in the 3-file prototype.
+ - **Library staff / catalog staff** (future):
+   - May view content without concurrency restrictions.
+   - Not implemented in the prototype.
+ 
+ ## Content Display Requirements
+ 
+ ### 1) IP-based Access Control
+ 
+ CDP endpoints must be restricted to allowlisted IPs.
+ - Default: allow `127.0.0.1` and `::1` in the prototype.
+ - Real system: allowlist can include CIDRs and should log access denials.
+ 
+ Prototype notes:
+ - Implemented in `display/backend.js` via `ALLOWED_IPS` and an IP check function.
+ 
+ ### 2) Content Search
+ 
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

---

## 📋 Action Required

- **Display (CDP)** requirements changed — review your content display rules, search behaviour, concurrency / turnaway logic, and analytics events.

> ℹ️  This notification was also written to **deposit/** so both branches stay informed.

> This file is **overwritten** on every change. Check git history for the full change trail.
