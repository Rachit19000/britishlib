# Display Portal (CDP) — Coding Guidelines

> **Content Display Portal** — where library visitors (on approved terminals) search and view approved content, subject to IP allowlisting and per-location concurrency locks.
>
> This folder contains exactly **3 code files**. All changes must go into one of them.

---

## File Map — Where to Write What

### `display/backend.js`
**Node.js API server — port `7002`**

Write code here for anything that runs **server-side**:

| Task | Where exactly in the file |
|------|--------------------------|
| New API endpoint (route) | Inside the `router(req, res)` function — add a new `if` block matching `req.method` + `req.url` |
| New in-memory data store | Inside the `db` object near the top (`db.content`, `db.locks`, `db.analytics`) |
| IP allowlisting rules | Edit the `ALLOWED_IPS` constant at the top and the `isAllowedIp(ip)` helper function |
| Concurrency / turnaway logic | Edit `acquireLock()`, `releaseLock()`, and `cleanExpiredLocks()` helper functions |
| Lock TTL / timeout changes | Edit `LOCK_TTL_SECONDS` constant at the top |
| Content search (fields, ranking, filters) | Edit the `GET /search` route block and its filtering/scoring logic |
| Content view (fetch content body) | Edit the `GET /content/:id/view` route block |
| Analytics event capture | Edit the `logAnalytic(type, data)` helper and call sites inside route handlers |
| Adding new content to the catalog | Edit the seed data block where `db.content` is populated at startup |
| Environment config (IPs, port, TTL) | Edit constants at the very top (`PORT`, `ALLOWED_IPS`, `LOCK_TTL_SECONDS`) |

---

### `display/frontend.html`
**Single-file browser UI — served via `http://localhost:5173/display/frontend.html`**

Write code here for anything the **library visitor sees in the browser**:

| Task | Where exactly in the file |
|------|--------------------------|
| New UI panel / screen | Add a new `<section id="...">` block inside `<main>` |
| Show/hide screens | Edit the `showSection(id)` JavaScript function |
| New form (search box, filters) | Add inside the relevant `<section>` |
| Styling (colours, layout, spacing) | Edit the `<style>` block in `<head>` — use existing CSS variables (`--accent`, `--danger`, `--border`, etc.) |
| Calling a backend API | Add a `fetch('http://localhost:7002/...')` call inside the relevant JS function |
| Search UI and results display | Edit `#section-search` section and `handleSearch()` JS function |
| Content detail / viewer UI | Edit `#section-view` section and `loadContent(id)` JS function |
| Turnaway / access denied screen | Edit `#section-turnaway` section and the JS block that handles `423` / `403` responses |
| IP denied / not-allowed screen | Edit the JS block that handles `403` responses from the `/ip-check` or `/search` endpoints |
| Analytics display (if shown to staff) | Edit `#section-analytics` section and `loadAnalytics()` JS function |
| Location ID input (library terminal ID) | Edit the `locationId` input field and where it is read in JS fetch calls |

---

### `display/requirements.md`
**Requirements documentation only — NOT code**

Write here when:
- A requirement changes (IP rules, concurrency limits, search behaviour, analytics events)
- A new section needs describing for the CDP

> ⚠️ Editing this file triggers the **requirements webhook** — `REQUIREMENTS_CHANGES.md` will be auto-updated in both `deposit/` and `display/` folders.

---

### `display/REQUIREMENTS_CHANGES.md`
**Auto-generated — DO NOT edit manually**

This file is overwritten automatically by `requirements-webhook/watcher.js` every time `deposit/requirements.md` or `display/requirements.md` changes. It shows the diff of what changed.

---

## Running the Display Portal

```powershell
# 1. Start backend (from repo root)
node .\display\backend.js
# Listens on http://localhost:7002

# 2. Open frontend in browser
# Open display/frontend.html directly, or serve via:
python -m http.server 5173
# Then go to: http://localhost:5173/display/frontend.html
```

---

## Key Rules for This Portal

- **Never** call `deposit/backend.js` routes from here — the two portals are independent.
- IP allowlisting is enforced **server-side** in `backend.js`; do not duplicate it in the frontend.
- Concurrency locks are **per `locationId`** — always pass `locationId` in view requests.
- Analytics must be logged **server-side** (`logAnalytic()`) — not in the browser.

<!-- AUTO_REQUIREMENTS_DIGEST_START -->
## Requirements Change Digest (auto-updated)

This section is automatically refreshed by `requirements-webhook/` whenever `deposit/requirements.md` or `display/requirements.md` changes in GitHub.

<!-- AUTO_REQUIREMENTS_DIGEST_END -->
