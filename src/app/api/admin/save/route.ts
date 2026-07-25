import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const ALLOWED = new Set(["members", "projects", "events", "team"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function mirrorToDb(kind: string, slug: string, data: Record<string, unknown>) {
  const dbPath = path.join(process.cwd(), "database", "aries.db");
  if (!fs.existsSync(dbPath)) return;
  const db = new Database(dbPath);
  try {
    const payload = JSON.stringify({ ...data, slug: kind === "team" ? undefined : slug });
    if (kind === "members") {
      db.prepare(
        `INSERT INTO members (slug, data, email, level) VALUES (?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
      ).run(slug, JSON.stringify({ ...data, slug }), `${slug}@aries-iitd.in`, "member");
    } else if (kind === "projects") {
      db.prepare(
        `INSERT INTO projects (slug, data, section, featured) VALUES (?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET data = excluded.data, featured = excluded.featured, updated_at = datetime('now')`,
      ).run(slug, JSON.stringify({ ...data, slug }), (data.category as string) ?? null, data.featured ? 1 : 0);
    } else if (kind === "events") {
      db.prepare(
        `INSERT INTO events (slug, data, date) VALUES (?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET data = excluded.data, date = excluded.date, updated_at = datetime('now')`,
      ).run(slug, JSON.stringify({ ...data, slug }), (data.date as string) ?? null);
    } else if (kind === "team") {
      db.prepare(
        `INSERT INTO team (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      ).run(JSON.stringify(data));
    }
  } finally {
    db.close();
  }
}

export async function POST(req: Request) {
  const { kind, slug, data } = await req.json();

  if (!ALLOWED.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (kind !== "team" && (typeof slug !== "string" || !SLUG_RE.test(slug))) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (kind === "team") {
    fs.writeFileSync(
      path.join(process.cwd(), "content", "team.json"),
      JSON.stringify(data, null, 2) + "\n",
    );
  } else {
    const dir = path.join(process.cwd(), "content", kind);
    fs.mkdirSync(dir, { recursive: true });
    const payload = { ...data, slug };
    fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(payload, null, 2) + "\n");
  }

  try {
    mirrorToDb(kind, slug ?? "team", data as Record<string, unknown>);
  } catch (err) {
    console.warn("[admin/save] DB mirror failed:", err);
  }

  return NextResponse.json({ ok: true });
}
