import crypto from "node:crypto";
import { db } from "./db.js";

const SESSION_DAYS = 7;

/** Temporary hard-coded admin until member login JSON arrives. */
const BOOTSTRAP_ADMIN = {
  entryNumber: "admin",
  password: "testpwd",
  memberSlug: "admin",
  level: "oc",
  name: "ARIES Admin",
  email: "team.ariesiitd@gmail.com",
};

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(password, salt, 64).toString("hex");
  if (hash.length !== next.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
}

export function createSession(memberSlug) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare(`INSERT INTO sessions (token, member_slug, expires_at) VALUES (?, ?, ?)`).run(
    token,
    memberSlug,
    expires,
  );
  return { token, expiresAt: expires };
}

export function destroySession(token) {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function getSession(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT s.token, s.member_slug, s.expires_at, m.data, m.email, m.level
       FROM sessions s
       LEFT JOIN members m ON m.slug = s.member_slug
       WHERE s.token = ?`,
    )
    .get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    destroySession(token);
    return null;
  }

  // Bootstrap admin session (no member row required)
  if (row.member_slug === BOOTSTRAP_ADMIN.memberSlug) {
    return {
      token: row.token,
      memberSlug: BOOTSTRAP_ADMIN.memberSlug,
      level: BOOTSTRAP_ADMIN.level,
      name: BOOTSTRAP_ADMIN.name,
      email: BOOTSTRAP_ADMIN.email,
      role: "admin",
    };
  }

  if (!row.data) return null;
  const member = JSON.parse(row.data);
  return {
    token: row.token,
    memberSlug: row.member_slug,
    level: row.level,
    name: member.name,
    email: row.email,
    role: levelToRole(row.level),
  };
}

export function levelToRole(level) {
  if (level === "oc") return "admin";
  if (level === "coordinator") return "coordinator";
  if (["executive", "member"].includes(level)) return "member";
  return "viewer";
}

export function tryBootstrapLogin(entryNumber, password) {
  const id = String(entryNumber || "").trim().toLowerCase();
  if (id === BOOTSTRAP_ADMIN.entryNumber && password === BOOTSTRAP_ADMIN.password) {
    // Ensure a sessions row can reference admin slug
    const existing = db.prepare(`SELECT slug FROM members WHERE slug = ?`).get(BOOTSTRAP_ADMIN.memberSlug);
    if (!existing) {
      db.prepare(
        `INSERT INTO members (slug, data, email, level, password_hash)
         VALUES (?, ?, ?, ?, NULL)`,
      ).run(
        BOOTSTRAP_ADMIN.memberSlug,
        JSON.stringify({
          slug: BOOTSTRAP_ADMIN.memberSlug,
          name: BOOTSTRAP_ADMIN.name,
          role: "Admin",
          tagline: "",
          socials: [],
          blocks: [],
        }),
        BOOTSTRAP_ADMIN.email,
        BOOTSTRAP_ADMIN.level,
      );
    }
    const { token } = createSession(BOOTSTRAP_ADMIN.memberSlug);
    return {
      token,
      memberSlug: BOOTSTRAP_ADMIN.memberSlug,
      level: BOOTSTRAP_ADMIN.level,
      name: BOOTSTRAP_ADMIN.name,
      email: BOOTSTRAP_ADMIN.email,
      role: "admin",
    };
  }
  return null;
}

export function bearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export function requireAuth(req, res, next) {
  const session = getSession(bearer(req));
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.session = session;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!["oc", "coordinator"].includes(req.session.level) && req.session.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  });
}
