import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const KINDS = new Set(["members", "projects", "events", "team", "misc"]);
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Upload an image into public/images/<kind>/.
 * multipart form: file, kind?
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "misc");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 8MB)" }, { status: 400 });
  }

  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  if (!allowed.has(ext)) {
    return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "images", kind);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buf);

  const url = `/images/${kind}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
