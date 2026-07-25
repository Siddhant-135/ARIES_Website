/**
 * Mirror DB writes back to content/ JSON so the Next frontend stays in sync.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(__dirname, "../../content");

export function writeMemberJson(slug, data) {
  const dir = path.join(CONTENT, "members");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(data, null, 2) + "\n");
}

export function deleteMemberJson(slug) {
  const file = path.join(CONTENT, "members", `${slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function writeProjectJson(slug, data) {
  const dir = path.join(CONTENT, "projects");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(data, null, 2) + "\n");
}

export function deleteProjectJson(slug) {
  const file = path.join(CONTENT, "projects", `${slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function writeEventJson(slug, data) {
  const dir = path.join(CONTENT, "events");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(data, null, 2) + "\n");
}

export function deleteEventJson(slug) {
  const file = path.join(CONTENT, "events", `${slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function writeTeamJson(data) {
  fs.writeFileSync(path.join(CONTENT, "team.json"), JSON.stringify(data, null, 2) + "\n");
}

export function writeResourcesJson(data) {
  fs.writeFileSync(path.join(CONTENT, "resources.json"), JSON.stringify(data, null, 2) + "\n");
}
