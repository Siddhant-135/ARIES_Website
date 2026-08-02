/**
 * Import member login credentials from a Google Form CSV.
 * Expected columns (header names flexible): entry_number, username, password, slug
 *
 * Usage:
 *   npm run auth:import-credentials -- path/to/responses.csv
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

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npm run auth:import-credentials -- <file.csv>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function pick(row, ...keys) {
  for (const k of keys) {
    const found = Object.entries(row).find(([h]) => h === k || h.includes(k));
    if (found?.[1]) return found[1];
  }
  return "";
}

async function main() {
  const rows = parseCsv(fs.readFileSync(path.resolve(csvPath), "utf8"));
  console.log(`Importing ${rows.length} credential rows…`);

  for (const row of rows) {
    const slug = pick(row, "slug", "member slug");
    const entry = pick(row, "entry_number", "entry number", "entryno", "entry no");
    const username = pick(row, "username", "user name", "login");
    const password = pick(row, "password", "pwd");
    const loginId = (entry || username || "").toLowerCase();
    if (!slug || !loginId || !password) {
      console.warn("Skipping incomplete row", row);
      continue;
    }

    const email = `${loginId}@ariesiitd.com`;
    const { data: member, error: mErr } = await sb
      .from("members")
      .select("slug, level, auth_user_id")
      .eq("slug", slug)
      .maybeSingle();
    if (mErr || !member) {
      console.warn(`No member for slug=${slug}`);
      continue;
    }

    let userId = member.auth_user_id;
    if (!userId) {
      const { data, error } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { level: member.level, member_slug: slug },
      });
      if (error) {
        console.error(`Auth create failed for ${slug}:`, error.message);
        continue;
      }
      userId = data.user.id;
    } else {
      const { error } = await sb.auth.admin.updateUserById(userId, {
        password,
        email,
        app_metadata: { level: member.level, member_slug: slug },
      });
      if (error) {
        console.error(`Auth update failed for ${slug}:`, error.message);
        continue;
      }
    }

    const { error: uErr } = await sb
      .from("members")
      .update({
        entry_number: entry || null,
        username: username || null,
        email,
        auth_user_id: userId,
      })
      .eq("slug", slug);
    if (uErr) console.error(`Member update failed for ${slug}:`, uErr.message);
    else console.log(`OK ${slug} ← ${loginId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
