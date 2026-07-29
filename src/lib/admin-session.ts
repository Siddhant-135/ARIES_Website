import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminSession = {
  token: string;
  memberSlug: string;
  level: string;
  name: string;
  email: string;
  role: string;
};

const BOOTSTRAP = {
  entryNumber: "admin",
  password: "testpwd",
  memberSlug: "admin",
  level: "oc",
  name: "ARIES Admin",
  email: "team.ariesiitd@gmail.com",
  role: "admin",
};

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "aries-dev-auth-secret";
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString(
    "utf8",
  );
}

/** Sign a compact session token (no DB / filesystem needed — works on Vercel). */
export function issueAdminSession(): AdminSession {
  const exp = Date.now() + 7 * 864e5;
  const payload = {
    memberSlug: BOOTSTRAP.memberSlug,
    level: BOOTSTRAP.level,
    name: BOOTSTRAP.name,
    email: BOOTSTRAP.email,
    role: BOOTSTRAP.role,
    exp,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return { token: `${body}.${sig}`, ...payload };
}

export function verifyAdminToken(token: string | null | undefined): AdminSession | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(fromB64url(body)) as {
      memberSlug: string;
      level: string;
      name: string;
      email: string;
      role: string;
      exp: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return {
      token,
      memberSlug: payload.memberSlug,
      level: payload.level,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function tryBootstrapCredentials(entryNumber: string, password: string): boolean {
  const user = (process.env.ADMIN_USER || BOOTSTRAP.entryNumber).trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD || BOOTSTRAP.password;
  const id = String(entryNumber || "")
    .trim()
    .toLowerCase();
  return id === user && password === pass;
}
