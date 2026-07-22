import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * Dev-mode content writer for the admin editor.
 * POST { kind: "members"|"projects"|"events", slug, data }
 * Writes content/<kind>/<slug>.json. Replace with real auth + DB later.
 */

const ALLOWED = new Set(["members", "projects", "events"]);
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export async function POST(req: Request) {
  const { kind, slug, data } = await req.json();

  if (!ALLOWED.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "content", kind);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${slug}.json`),
    JSON.stringify({ ...data, slug }, null, 2) + "\n",
  );

  return NextResponse.json({ ok: true });
}
