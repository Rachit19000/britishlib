/**
 * ELDROS - Content Display Portal (CDP) - Minimal single-file backend
 * Node.js 18+ (no external deps)
 *
 * Implements a lightweight subset of requirements:
 * - IP-based access gate (library terminals)
 * - Metadata search (in-memory)
 * - Content "view" with concurrency control per library location (turnaway)
 * - Analytics events (view, turnaway, search)
 *
 * NOTE: Prototype skeleton; storage is in-memory.
 */

const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 7002);

// Comma-separated allowlist of IPs/CIDRs is out of scope for this prototype.
// Keep it simple: allow exact IP matches.
const ALLOWED_IPS = (process.env.CDP_ALLOWED_IPS || "127.0.0.1,::1").split(",").map((s) => s.trim()).filter(Boolean);

// Concurrency lock TTL (seconds) for viewing sessions
const LOCK_TTL_SECONDS = Number(process.env.CDP_LOCK_TTL_SECONDS || 10 * 60); // 10 min

/** -----------------------------
 * In-memory "DB"
 * ----------------------------- */
const db = {
  // Minimal catalog. In real system, this comes from approved submissions + search index.
  content: new Map(), // id -> { id, title, isbn, contentType, publisher, language, approvedAt, fileType, bodyText }
  locks: new Map(), // key = `${contentId}:${locationId}` -> { contentId, locationId, sessionId, userLabel, lockedAt, expiresAt }
  analytics: [], // { id, type, contentId, locationId, q, at, meta }
};

function nowIso() {
  return new Date().toISOString();
}

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, x-library-location, x-user-label, x-forwarded-for",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  res.end(payload);
}

function notFound(res) {
  json(res, 404, { error: "not_found" });
}

function badRequest(res, message) {
  json(res, 400, { error: "bad_request", message });
}

function forbidden(res, message) {
  json(res, 403, { error: "forbidden", message });
}

function getClientIp(req) {
  // Prototype: use x-forwarded-for first, then remoteAddress.
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ra = req.socket.remoteAddress || "";
  return xff || ra;
}

function requireLibraryIp(req, res) {
  const ip = getClientIp(req);
  const ok = ALLOWED_IPS.includes(ip);
  if (!ok) {
    forbidden(res, `CDP access restricted to library terminals. Your IP (${ip}) is not allowlisted.`);
    return false;
  }
  return true;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => (buf += chunk));
    req.on("end", () => {
      if (!buf) return resolve({});
      try {
        resolve(JSON.parse(buf));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function lockKey(contentId, locationId) {
  return `${contentId}:${locationId}`;
}

function cleanupExpiredLocks() {
  const now = Date.now();
  for (const [k, v] of db.locks.entries()) {
    if (v.expiresAt <= now) db.locks.delete(k);
  }
}

function seed() {
  const items = [
    {
      id: "cnt_demo_1",
      title: "Demo Book: Legal Deposit Overview",
      isbn: "9780000000001",
      contentType: "book",
      publisher: "Demo Publisher",
      language: "en",
      approvedAt: nowIso(),
      fileType: "pdf",
      bodyText:
        "This is a demo content item. In the real system, PDF/ePub would be streamed from object storage using signed URLs.",
    },
    {
      id: "cnt_demo_2",
      title: "Demo Journal Article: Turnaway & Concurrency",
      isbn: "9780000000002",
      contentType: "journal",
      publisher: "Demo Publisher",
      language: "en",
      approvedAt: nowIso(),
      fileType: "epub",
      bodyText:
        "Concurrency rule: one person per library location can view the same content item at a time. Others are turned away.",
    },
  ];
  for (const it of items) db.content.set(it.id, it);
}
seed();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, x-library-location, x-user-label, x-forwarded-for",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    });
    return res.end();
  }

  cleanupExpiredLocks();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  if (method === "GET" && path === "/health") {
    return json(res, 200, {
      ok: true,
      service: "cdp-backend",
      time: nowIso(),
      allowedIps: ALLOWED_IPS,
      lockTtlSeconds: LOCK_TTL_SECONDS,
    });
  }

  // Enforce IP restriction for all /api/* routes
  if (path.startsWith("/api/")) {
    if (!requireLibraryIp(req, res)) return;
  }

  // Search
  if (method === "GET" && path === "/api/search") {
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const type = String(url.searchParams.get("type") || "").trim().toLowerCase();

    const all = Array.from(db.content.values());
    const filtered = all.filter((it) => {
      const matchesQ =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.isbn.toLowerCase().includes(q) ||
        it.publisher.toLowerCase().includes(q);
      const matchesType = !type || it.contentType === type;
      return matchesQ && matchesType;
    });

    db.analytics.push({ id: randomId("an"), type: "search", q, at: nowIso(), meta: { type } });

    return json(res, 200, { q, type: type || null, total: filtered.length, items: filtered });
  }

  // Get content metadata
  if (method === "GET" && path.startsWith("/api/content/")) {
    const id = path.split("/").pop();
    const item = db.content.get(id);
    if (!item) return notFound(res);
    return json(res, 200, { item });
  }

  // Start viewing session (concurrency lock per location)
  if (method === "POST" && path === "/api/view/start") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const contentId = String(body.contentId || "");
    if (!contentId) return badRequest(res, "contentId is required");
    if (!db.content.has(contentId)) return badRequest(res, "Unknown contentId");

    const locationId = String(req.headers["x-library-location"] || body.locationId || "default");
    const userLabel = String(req.headers["x-user-label"] || body.userLabel || "guest");

    const key = lockKey(contentId, locationId);
    const existing = db.locks.get(key);
    const now = Date.now();
    if (existing && existing.expiresAt > now) {
      db.analytics.push({
        id: randomId("an"),
        type: "turnaway",
        contentId,
        locationId,
        at: nowIso(),
        meta: { reason: "locked", lockedBy: existing.userLabel },
      });
      return json(res, 409, {
        error: "turnaway",
        message: "This content is currently being viewed at your location.",
        lockedBy: existing.userLabel,
        retryAfterSeconds: Math.max(1, Math.floor((existing.expiresAt - now) / 1000)),
      });
    }

    const sessionId = randomId("sess");
    const lock = {
      contentId,
      locationId,
      sessionId,
      userLabel,
      lockedAt: nowIso(),
      expiresAt: now + LOCK_TTL_SECONDS * 1000,
    };
    db.locks.set(key, lock);

    db.analytics.push({ id: randomId("an"), type: "view_start", contentId, locationId, at: nowIso(), meta: { userLabel } });

    return json(res, 200, { sessionId, lockTtlSeconds: LOCK_TTL_SECONDS });
  }

  // Heartbeat (extend lock)
  if (method === "POST" && path === "/api/view/heartbeat") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { contentId, sessionId } = body;
    const locationId = String(req.headers["x-library-location"] || body.locationId || "default");
    if (!contentId || !sessionId) return badRequest(res, "contentId and sessionId required");

    const key = lockKey(contentId, locationId);
    const lock = db.locks.get(key);
    if (!lock || lock.sessionId !== sessionId) return forbidden(res, "No active session for this content at this location");

    lock.expiresAt = Date.now() + LOCK_TTL_SECONDS * 1000;
    return json(res, 200, { ok: true, expiresAt: new Date(lock.expiresAt).toISOString() });
  }

  // End viewing session (release lock)
  if (method === "POST" && path === "/api/view/end") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { contentId, sessionId } = body;
    const locationId = String(req.headers["x-library-location"] || body.locationId || "default");
    if (!contentId || !sessionId) return badRequest(res, "contentId and sessionId required");

    const key = lockKey(contentId, locationId);
    const lock = db.locks.get(key);
    if (!lock || lock.sessionId !== sessionId) return forbidden(res, "No active session to end");

    db.locks.delete(key);
    db.analytics.push({ id: randomId("an"), type: "view_end", contentId, locationId, at: nowIso(), meta: {} });
    return json(res, 200, { ok: true });
  }

  // Basic analytics summary (dev convenience)
  if (method === "GET" && path === "/api/analytics/summary") {
    const summary = {};
    for (const e of db.analytics) {
      summary[e.type] = (summary[e.type] || 0) + 1;
    }
    return json(res, 200, { totalEvents: db.analytics.length, byType: summary });
  }

  // Debug: active locks
  if (method === "GET" && path === "/api/dev/locks") {
    return json(res, 200, { locks: Array.from(db.locks.values()) });
  }

  return notFound(res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[cdp-backend] listening on http://localhost:${PORT}`);
});

