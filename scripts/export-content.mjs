/**
 * Export live Supabase content back into content/*.json (backup refresh).
 * Requires SUPABASE_SERVICE_ROLE_KEY or anon key with select access.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || m[1].startsWith("#")) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL/key");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const { data: members, error: mErr } = await sb
    .from("members")
    .select("slug, data")
    .neq("slug", "admin");
  if (mErr) throw mErr;

  for (const row of members ?? []) {
    writeJson(path.join(CONTENT, "members", `${row.slug}.json`), row.data);
  }

  const { data: projects, error: pErr } = await sb.from("projects").select("slug, data");
  if (pErr) throw pErr;
  for (const row of projects ?? []) {
    writeJson(path.join(CONTENT, "projects", `${row.slug}.json`), row.data);
  }

  const { data: events, error: eErr } = await sb.from("events").select("slug, data");
  if (eErr) throw eErr;
  for (const row of events ?? []) {
    writeJson(path.join(CONTENT, "events", `${row.slug}.json`), row.data);
  }

  const { data: resources, error: rErr } = await sb
    .from("resources")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (rErr) throw rErr;
  writeJson(path.join(CONTENT, "resources.json"), resources?.data ?? []);

  const { data: team, error: tErr } = await sb.from("team").select("data").eq("id", 1).maybeSingle();
  if (tErr) throw tErr;
  writeJson(path.join(CONTENT, "team.json"), team?.data ?? { years: [], alumni: [] });

  console.log(
    `Exported ${(members ?? []).length} members, ${(projects ?? []).length} projects, ${(events ?? []).length} events.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
