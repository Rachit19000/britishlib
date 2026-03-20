# Deposit Portal (PSP) — Coding Guidelines

> **Publisher Submissions Portal** — where publishers register, log in, and submit content for library staff to review and approve.
>
> This folder contains exactly **3 code files**. All changes must go into one of them.

---

## File Map — Where to Write What

### `deposit/backend.js`
**Node.js API server — port `7001`**

Write code here for anything that runs **server-side**:

| Task | Where exactly in the file |
|------|--------------------------|
| New API endpoint (route) | Inside the `router(req, res)` function — add a new `if` block matching `req.method` + `req.url` |
| New in-memory data store | Inside the `db` object near the top of the file |
| Business logic (hashing, validation, workflow rules) | Add a named helper function above `router()` |
| MFA / TOTP changes | Edit `generateMfaChallenge()` and `verifyMfaChallenge()` helpers |
| Registration workflow | Edit the `/register` and `/admin/registrations/:id/approve` + `/reject` route blocks |
| Content submission rules (SHA-256, versioning, duplicates) | Edit the `POST /content` route block |
| Staff review workflow (approve/reject tasks) | Edit the `/workflow/tasks/:id/approve` and `/reject` route blocks |
| Authentication (login, JWT, token validation) | Edit `POST /login`, `verifyToken()` helper, and `authenticate()` middleware |
| Embargo logic | Edit the `POST /content` route where `embargoUntil` is set |
| Publisher trusted-flag logic | Edit `POST /admin/publishers/:id/trust` route |
| Port / environment config | Edit constants at the very top (`PORT`, `JWT_SECRET`, `TOKEN_TTL_SECONDS`) |

---

### `deposit/frontend.html`
**Single-file browser UI — served via `http://localhost:5173/deposit/frontend.html`**

Write code here for anything the **publisher or staff sees in the browser**:

| Task | Where exactly in the file |
|------|--------------------------|
| New UI panel / screen | Add a new `<section id="...">` block inside `<main>` |
| Show/hide screens | Edit the `showSection(id)` JavaScript function |
| New form (input fields, submit button) | Add inside the relevant `<section>` |
| Styling (colours, layout, spacing) | Edit the `<style>` block in `<head>` — use existing CSS variables (`--accent`, `--danger`, `--ok`, etc.) |
| Calling a backend API | Add a `fetch('http://localhost:7001/...')` call inside the relevant JS function |
| Registration flow UI | Edit the `#section-register` section and its JS submit handler |
| Login + MFA UI | Edit `#section-login` section and `handleLoginResponse()` JS function |
| Content submission form | Edit `#section-submit` section and its JS submit handler |
| Staff review panel | Edit `#section-review` section and `loadPendingTasks()` JS function |
| Error / success toast messages | Edit the `showToast(msg, type)` JS function |
| Auth token storage | Edit `localStorage.setItem('token', ...)` usages in the login handler |

---

### `deposit/requirements.md`
**Requirements documentation only — NOT code**

Write here when:
- A requirement changes (new feature, rule change, scope update)
- A new section needs describing for the PSP

> ⚠️ Editing this file triggers the **requirements webhook** — `REQUIREMENTS_CHANGES.md` will be auto-updated in both `deposit/` and `display/` folders.

---

### `deposit/REQUIREMENTS_CHANGES.md`
**Auto-generated — DO NOT edit manually**

This file is overwritten automatically by `requirements-webhook/watcher.js` every time `deposit/requirements.md` or `display/requirements.md` changes. It shows the diff of what changed.

---

## Running the Deposit Portal

```powershell
# 1. Start backend (from repo root)
node .\deposit\backend.js
# Listens on http://localhost:7001

# 2. Open frontend in browser
# Open deposit/frontend.html directly, or serve via:
python -m http.server 5173
# Then go to: http://localhost:5173/deposit/frontend.html
```

<!-- AUTO_REQUIREMENTS_DIGEST_START -->
## Requirements Change Digest (auto-updated)

This section is automatically refreshed by `requirements-webhook/` whenever `deposit/requirements.md` or `display/requirements.md` changes in GitHub.

<!-- AUTO_REQUIREMENTS_DIGEST_END -->
