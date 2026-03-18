/**
 * ELDROS - Publisher Submissions Portal (PSP) - Minimal single-file backend
 * Node.js 18+ (no external deps)
 *
 * Implements a lightweight subset of requirements:
 * - Registration request + staff approval + trusted publisher flag
 * - Login with password + optional TOTP (MFA) challenge
 * - Content submission with SHA-256 hashing + duplicate/version detection
 * - Staff workflow approve/reject
 *
 * NOTE: This is a prototype skeleton to match requirements; storage is in-memory.
 */

const http = require("http");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 7001);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 30; // 30 min

/** -----------------------------
 * In-memory "DB"
 * ----------------------------- */
const db = {
  publishers: new Map(), // publisherId -> { id, name, status, trusted, createdAt }
  users: new Map(), // userId -> { id, email, passwordHash, publisherId, role, mfaEnabled, mfaSecretBase32, status }
  registrationRequests: new Map(), // reqId -> { id, publisherName, email, status, createdAt }
  contentItems: new Map(), // contentId -> { id, isbn, title, contentType, publisherId, status, embargoUntil, versionNumber, parentVersionId, fileHash, fileSize, metadata, createdAt, approvedAt }
  workflowTasks: new Map(), // taskId -> { id, contentId, status, createdAt, completedAt, comments }
  mfaChallenges: new Map(), // userId -> { code, expiresAt }
};

function nowIso() {
  return new Date().toISOString();
}

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
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

function unauthorized(res, message = "unauthorized") {
  json(res, 401, { error: "unauthorized", message });
}

function forbidden(res, message = "forbidden") {
  json(res, 403, { error: "forbidden", message });
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

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function base32ToBuffer(base32) {
  // Minimal Base32 decoder (RFC 4648) for TOTP secrets
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = (base32 || "").toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const ch of cleaned) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpCode(secretBase32, stepSeconds = 30, digits = 6, t = Date.now()) {
  // Standard TOTP: HOTP(K, T) where T = floor(time/step)
  const key = base32ToBuffer(secretBase32);
  const counter = Math.floor(t / 1000 / stepSeconds);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(binCode).padStart(digits, "0");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body = { ...payload, exp };

  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const part1 = enc(header);
  const part2 = enc(body);
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${part1}.${part2}`).digest("base64url");
  return `${part1}.${part2}.${sig}`;
}

function verifyJwt(token) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function authFromReq(req) {
  const raw = req.headers.authorization || "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifyJwt(m[1]);
}

function requireRole(res, auth, roles) {
  if (!auth) {
    unauthorized(res);
    return false;
  }
  if (!roles.includes(auth.role)) {
    forbidden(res, `requires role: ${roles.join(", ")}`);
    return false;
  }
  return true;
}

/** -----------------------------
 * Seed demo data
 * ----------------------------- */
function seed() {
  const staffPublisherId = randomId("pub");
  db.publishers.set(staffPublisherId, {
    id: staffPublisherId,
    name: "British Library (Internal)",
    status: "approved",
    trusted: true,
    createdAt: nowIso(),
  });

  const staffUserId = randomId("usr");
  db.users.set(staffUserId, {
    id: staffUserId,
    email: "staff@bl.uk",
    passwordHash: sha256Hex("staff-password"),
    publisherId: staffPublisherId,
    role: "library_staff",
    mfaEnabled: true,
    // demo secret = "JBSWY3DPEHPK3PXP" (Google Authenticator friendly)
    mfaSecretBase32: "JBSWY3DPEHPK3PXP",
    status: "active",
  });
}
seed();

/** -----------------------------
 * Routing
 * ----------------------------- */
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;
  const auth = authFromReq(req);

  // Health
  if (method === "GET" && path === "/health") {
    return json(res, 200, { ok: true, service: "psp-backend", time: nowIso() });
  }

  // --- Registration request (guest) ---
  if (method === "POST" && path === "/api/register") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { publisherName, email } = body;
    if (!publisherName || !email) return badRequest(res, "publisherName and email are required");

    const reqId = randomId("reg");
    db.registrationRequests.set(reqId, {
      id: reqId,
      publisherName,
      email: String(email).toLowerCase(),
      status: "pending",
      createdAt: nowIso(),
    });
    return json(res, 201, { id: reqId, status: "pending" });
  }

  // --- Staff: list registration requests ---
  if (method === "GET" && path === "/api/staff/registration-requests") {
    if (!requireRole(res, auth, ["library_staff"])) return;
    const items = Array.from(db.registrationRequests.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json(res, 200, { items });
  }

  // --- Staff: approve/reject registration request ---
  if (method === "POST" && path === "/api/staff/registration-requests/decide") {
    if (!requireRole(res, auth, ["library_staff"])) return;
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { requestId, approve, trusted } = body;
    const rr = db.registrationRequests.get(requestId);
    if (!rr) return badRequest(res, "Unknown requestId");
    if (rr.status !== "pending") return badRequest(res, "Request already decided");

    rr.status = approve ? "approved" : "rejected";

    if (!approve) {
      return json(res, 200, { requestId, status: rr.status });
    }

    const publisherId = randomId("pub");
    db.publishers.set(publisherId, {
      id: publisherId,
      name: rr.publisherName,
      status: "approved",
      trusted: Boolean(trusted),
      createdAt: nowIso(),
    });

    const userId = randomId("usr");
    const tempPassword = `Temp-${crypto.randomBytes(4).toString("hex")}`;
    const mfaSecret = crypto.randomBytes(10).toString("base64").replace(/[^A-Z2-7]/gi, "A").slice(0, 16);
    db.users.set(userId, {
      id: userId,
      email: rr.email,
      passwordHash: sha256Hex(tempPassword),
      publisherId,
      role: "publisher",
      mfaEnabled: true,
      mfaSecretBase32: mfaSecret,
      status: "active",
    });

    return json(res, 200, {
      requestId,
      status: rr.status,
      createdUser: {
        email: rr.email,
        tempPassword,
        mfaSecretBase32: mfaSecret,
      },
      publisher: db.publishers.get(publisherId),
    });
  }

  // --- Auth: login step 1 ---
  if (method === "POST" && path === "/api/auth/login") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return badRequest(res, "email and password are required");

    const user = Array.from(db.users.values()).find((u) => u.email === email);
    if (!user || user.status !== "active") return unauthorized(res, "Invalid credentials");
    if (sha256Hex(password) !== user.passwordHash) return unauthorized(res, "Invalid credentials");

    if (user.mfaEnabled) {
      const code = totpCode(user.mfaSecretBase32);
      db.mfaChallenges.set(user.id, { code, expiresAt: Date.now() + 2 * 60 * 1000 });
      return json(res, 200, { mfaRequired: true, message: "Use /api/auth/mfa with the current TOTP code.", demoTotpNow: code });
    }

    const token = signJwt({ sub: user.id, role: user.role, publisherId: user.publisherId, email: user.email });
    return json(res, 200, { token });
  }

  // --- Auth: MFA step ---
  if (method === "POST" && path === "/api/auth/mfa") {
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const email = String(body.email || "").toLowerCase();
    const code = String(body.code || "");
    if (!email || !code) return badRequest(res, "email and code are required");

    const user = Array.from(db.users.values()).find((u) => u.email === email);
    if (!user || user.status !== "active") return unauthorized(res, "Invalid credentials");
    if (!user.mfaEnabled) return badRequest(res, "MFA not enabled for this user");

    const expected = totpCode(user.mfaSecretBase32);
    const challenge = db.mfaChallenges.get(user.id);
    const ok = (challenge && challenge.expiresAt > Date.now() && challenge.code === code) || code === expected;
    if (!ok) return unauthorized(res, "Invalid MFA code");
    db.mfaChallenges.delete(user.id);

    const token = signJwt({ sub: user.id, role: user.role, publisherId: user.publisherId, email: user.email });
    return json(res, 200, { token });
  }

  // --- Publisher: create submission ---
  if (method === "POST" && path === "/api/submissions") {
    if (!requireRole(res, auth, ["publisher", "library_staff"])) return;
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { isbn, title, contentType, metadata, fileName, fileBytesBase64 } = body;
    if (!isbn || !title || !contentType || !fileBytesBase64) {
      return badRequest(res, "isbn, title, contentType, fileBytesBase64 are required");
    }

    const publisher = db.publishers.get(auth.publisherId);
    if (!publisher) return forbidden(res, "Unknown publisher");

    const fileBytes = Buffer.from(String(fileBytesBase64), "base64");
    const fileHash = sha256Hex(fileBytes);

    // Duplicate detection (same ISBN and same hash) => create new version anyway (like "new version")
    const existing = Array.from(db.contentItems.values()).filter((c) => c.isbn === isbn && c.publisherId === auth.publisherId);
    const latest = existing.sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const versionNumber = latest ? latest.versionNumber + 1 : 1;
    const parentVersionId = latest ? latest.id : null;

    const id = randomId("cnt");
    const trusted = Boolean(publisher.trusted);
    const status = trusted ? "approved" : "submitted";

    const item = {
      id,
      isbn,
      title,
      contentType,
      publisherId: auth.publisherId,
      status,
      embargoUntil: null,
      versionNumber,
      parentVersionId,
      fileHash,
      fileSize: fileBytes.length,
      fileName: fileName || "upload.bin",
      metadata: metadata || {},
      createdAt: nowIso(),
      approvedAt: trusted ? nowIso() : null,
    };
    db.contentItems.set(id, item);

    if (!trusted) {
      const taskId = randomId("tsk");
      db.workflowTasks.set(taskId, { id: taskId, contentId: id, status: "pending_review", createdAt: nowIso(), completedAt: null, comments: "" });
    }

    return json(res, 201, { item });
  }

  // --- Publisher: list my submissions ---
  if (method === "GET" && path === "/api/submissions") {
    if (!requireRole(res, auth, ["publisher", "library_staff"])) return;
    const items = Array.from(db.contentItems.values())
      .filter((c) => c.publisherId === auth.publisherId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json(res, 200, { items });
  }

  // --- Staff: list workflow tasks ---
  if (method === "GET" && path === "/api/staff/workflow-tasks") {
    if (!requireRole(res, auth, ["library_staff"])) return;
    const items = Array.from(db.workflowTasks.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json(res, 200, { items });
  }

  // --- Staff: decide on submission ---
  if (method === "POST" && path === "/api/staff/workflow-tasks/decide") {
    if (!requireRole(res, auth, ["library_staff"])) return;
    const body = await readJson(req).catch(() => null);
    if (!body) return badRequest(res, "Invalid JSON");
    const { taskId, approve, comments } = body;
    const task = db.workflowTasks.get(taskId);
    if (!task) return badRequest(res, "Unknown taskId");
    if (task.status !== "pending_review") return badRequest(res, "Task already decided");

    const item = db.contentItems.get(task.contentId);
    if (!item) return badRequest(res, "Task content missing");

    task.status = approve ? "approved" : "rejected";
    task.completedAt = nowIso();
    task.comments = comments || "";

    item.status = approve ? "approved" : "rejected";
    item.approvedAt = approve ? nowIso() : null;

    return json(res, 200, { task, item });
  }

  // Debug endpoint (dev only): view seed secrets
  if (method === "GET" && path === "/api/dev/demo") {
    return json(res, 200, {
      staffLogin: { email: "staff@bl.uk", password: "staff-password", totpSecretBase32: "JBSWY3DPEHPK3PXP" },
      note: "This endpoint exists only for prototype convenience.",
    });
  }

  return notFound(res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[psp-backend] listening on http://localhost:${PORT}`);
});

