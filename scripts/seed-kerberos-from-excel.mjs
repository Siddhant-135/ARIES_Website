/**
 * Seed kerberos (entry_number) + IITD email onto members from Excel
 * (Name + IITD Email only). Amey override applied.
 * Uses SUPABASE_SERVICE_ROLE_KEY.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const EXCEL = process.argv[2] || "d:/Downlod/ARIES '26-27.xlsx";

/** User-specified overrides (kerberos / iitd email) */
const OVERRIDES = {
  "amey chaudhari": {
    kerberos: "mt1251690",
    iitdEmail: "mt1251690@maths.iitd.ac.in",
  },
};

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyName(name) {
  return normName(name).replace(/\s+/g, "-");
}

async function main() {
  const wb = XLSX.readFile(EXCEL);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["Team Details"], { defval: "" });

  const { data: members, error } = await sb.from("members").select("slug, data");
  if (error) throw error;

  const byNorm = new Map();
  for (const m of members ?? []) {
    const n = normName(m.data?.name);
    if (n) byNorm.set(n, m);
    byNorm.set(normName(m.slug.replace(/-/g, " ")), m);
  }

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = String(row["Name"] || "").trim();
    if (!name) continue;
    const override = OVERRIDES[normName(name)];
    let iitd = String(row["IITD Email"] || "").trim().toLowerCase();
    let kerberos = "";

    if (override) {
      iitd = override.iitdEmail;
      kerberos = override.kerberos;
    } else if (/@[\w.-]*iitd\.ac\.in$/i.test(iitd)) {
      kerberos = iitd.split("@")[0].toLowerCase();
    } else {
      skipped++;
      continue; // no IITD mail yet — add later
    }

    const match =
      byNorm.get(normName(name)) ||
      byNorm.get(normName(slugifyName(name))) ||
      (members ?? []).find((m) => normName(m.data?.name).includes(normName(name).split(" ")[0]));

    if (!match) {
      console.warn("No member profile for", name, kerberos);
      continue;
    }

    const { error: uErr } = await sb
      .from("members")
      .update({
        entry_number: kerberos,
        email: iitd,
        username: kerberos,
      })
      .eq("slug", match.slug);
    if (uErr) console.error(match.slug, uErr.message);
    else {
      updated++;
      console.log("OK", match.slug, "←", kerberos);
    }
  }

  console.log(`Updated ${updated}, skipped (no iitd mail) ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
