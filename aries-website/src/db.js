import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../database/aries.db");
const SCHEMA_PATH = path.resolve(__dirname, "../../database/schema.sql");

export function openDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.warn(`[aries-api] Missing ${DB_PATH} — creating empty DB. Run npm run db:seed from repo root.`);
    const db = new Database(DB_PATH);
    db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
    return db;
  }
  return new Database(DB_PATH);
}

export const db = openDb();
