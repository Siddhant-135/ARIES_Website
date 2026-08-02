/**
 * Build SQL to set entry_number/username/email from excel-kerberos.json
 * matched to content/members by name. Amey override included in JSON file
 * after we patch it.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const excel = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/excel-kerberos.json"), "utf8"),
);

// Apply Amey override
for (const row of excel) {
  if (/amey\s+chaudhari/i.test(row.name)) {
    row.kerberos = "mt1251690";
    row.iitdEmail = "mt1251690@maths.iitd.ac.in";
  }
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const memberFiles = fs
  .readdirSync(path.join(ROOT, "content/members"))
  .filter((f) => f.endsWith(".json"));

const members = memberFiles.map((f) => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "content/members", f), "utf8"));
  return { slug: data.slug, name: data.name, norm: norm(data.name) };
});

const stmts = [];
let matched = 0;
for (const row of excel) {
  if (!row.kerberos) continue;
  const n = norm(row.name);
  let m =
    members.find((x) => x.norm === n) ||
    members.find((x) => x.norm.startsWith(n.split(" ")[0]) && n.split(" ").length === 1) ||
    members.find((x) => x.norm.includes(n) || n.includes(x.norm));
  // first-name unique match
  if (!m && n.split(" ").length === 1) {
    const hits = members.filter((x) => x.norm.split(" ")[0] === n);
    if (hits.length === 1) m = hits[0];
  }
  if (!m) {
    console.warn("no match", row.name, row.kerberos);
    continue;
  }
  matched++;
  const email = row.iitdEmail.replace(/'/g, "''");
  const k = row.kerberos.replace(/'/g, "''");
  stmts.push(
    `update public.members set entry_number='${k}', username='${k}', email='${email}' where slug='${m.slug}';`,
  );
}

fs.writeFileSync(path.join(ROOT, "scripts/kerberos-updates.sql"), stmts.join("\n") + "\n");
console.log("matched", matched, "statements", stmts.length);
