import XLSX from "xlsx";
import fs from "node:fs";

const path = "d:/Downlod/ARIES '26-27.xlsx";
const wb = XLSX.readFile(path);
console.log("sheets", wb.SheetNames);
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
  console.log("\n===", name, "rows", rows.length);
  if (rows[0]) console.log("keys", Object.keys(rows[0]));
  // find mail-like columns
  for (const row of rows.slice(0, 5)) {
    const entries = Object.entries(row).filter(
      ([k, v]) =>
        /mail|email|iitd|name|kerberos/i.test(k) ||
        String(v).includes("@") ||
        String(v).includes("iitd"),
    );
    console.log(entries);
  }
}

// dump only name + iitd mail candidates for all sheets
const out = [];
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
  for (const row of rows) {
    const keys = Object.keys(row);
    const nameKey = keys.find((k) => /^name$/i.test(k.trim()) || /full.?name/i.test(k));
    const mailKey = keys.find(
      (k) => /iitd.*mail|mail.*iitd|email|e-?mail/i.test(k) || /kerberos/i.test(k),
    );
    // also scan values for @iitd
    let mail = mailKey ? String(row[mailKey]).trim() : "";
    let person = nameKey ? String(row[nameKey]).trim() : "";
    if (!mail) {
      for (const v of Object.values(row)) {
        const s = String(v);
        if (/@[\w.-]*iitd\.ac\.in/i.test(s)) {
          mail = s.trim();
          break;
        }
      }
    }
    if (person || mail) out.push({ sheet: name, name: person, mail });
  }
}
fs.writeFileSync("scripts/excel-mail-name.json", JSON.stringify(out, null, 2));
console.log("\nwrote", out.length, "rows to scripts/excel-mail-name.json");
console.log(
  "with mail",
  out.filter((r) => r.mail && r.mail.includes("@")).length,
);
