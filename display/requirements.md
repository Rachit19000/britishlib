# Display (Readers) — CDP Prototype (3 files)

This folder contains a **minimal runnable prototype** for the **Content Display Portal (CDP)** described in:

- `requitrements/PROJECT_SUMMARY.md`
- `requitrements/TECH_STACK_ARCHITECTURE.md` (see “Content Display Flow” and “Concurrency Control Service”)

It is intentionally implemented as **only 3 files**:

- `frontend.html` — single-file UI for search + view + turnaway demo
- `backend.js` — single-file Node.js API server (in-memory data)
- `requirements.md` — this file

## What’s implemented (mapped to requirements)

- **IP-based access control**
  - CDP endpoints are restricted to allowlisted IPs (prototype uses exact match)
  - Default allowlist permits localhost only
- **Search**
  - Metadata search across title / ISBN / publisher
  - Filter by content type
- **View + concurrency control (turnaway)**
  - “One person per library location can view each content item at a time”
  - Lock key = `contentId + locationId`
  - Lock TTL + heartbeat extension
- **Analytics (prototype)**
  - Tracks search / view_start / view_end / turnaway counts

## Run locally (Windows / PowerShell)

### 1) Start the backend

From the repo root:

```powershell
node .\display\backend.js
```

It listens on `http://localhost:7002`.

### 2) Open the frontend

Open this file in a browser:

- `display/frontend.html`

If your browser blocks cross-origin requests from `file://`, use a simple local static server:

```powershell
python -m http.server 5173
```

Then open:

- `http://localhost:5173/display/frontend.html`

## IP allowlisting (prototype)

By default, the backend allows only:

- `127.0.0.1`
- `::1`

To set an allowlist:

```powershell
$env:CDP_ALLOWED_IPS="127.0.0.1,::1"
node .\display\backend.js
```

## Concurrency / turnaway demo

1. Open `display/frontend.html` in **two** windows.
2. Keep the same **Library location ID** in both windows (e.g., `reading-room-a`).
3. Click **Start viewing** for the same **Content ID** in window 1.
4. Try **Start viewing** in window 2 → you should get a **turnaway** response.

## Notes / next steps

- Real implementation uses **Redis locks** for concurrency and **signed URLs** to stream PDF/ePub from object storage.
- Real search uses **Elasticsearch/Solr** with metadata + full text indexing.
- Personalization features (bookmarks, saved searches) are out-of-scope for this 3-file prototype.

