import XLSX from "xlsx";
import fs from "node:fs";

const path = "d:/Downlod/ARIES '26-27.xlsx";
const wb = XLSX.readFile(path);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Team Details"], { defval: "" });

const out = [];
for (const row of rows) {
  const name = String(row["Name"] || "").trim();
  const iitd = String(row["IITD Email"] || "").trim();
  if (!name) continue;
  const hasIitd = /@[\w.-]*iitd\.ac\.in$/i.test(iitd);
  out.push({
    name,
    post: String(row["Post"] || "").trim(),
    iitdEmail: hasIitd ? iitd.toLowerCase() : "",
    kerberos: hasIitd ? iitd.split("@")[0].toLowerCase() : "",
  });
}

fs.writeFileSync("scripts/excel-kerberos.json", JSON.stringify(out, null, 2));
const ready = out.filter((r) => r.kerberos);
console.log("total", out.length, "with iitd mail", ready.length);
console.log(ready.map((r) => `${r.name} | ${r.kerberos} | ${r.iitdEmail} | ${r.post}`).join("\n"));
const amey = out.find((r) => /amey/i.test(r.name));
console.log("\namey row:", amey);
