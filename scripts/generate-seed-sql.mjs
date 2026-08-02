/**
 * Generate SQL upserts from content/*.json for MCP / dashboard apply
 * when service role is not yet available. Does not create auth users.
 */
import fs from "node:fs";
import path from "node:path";

const CONTENT = path.join(process.cwd(), "content");
const OUT = path.join(process.cwd(), "scripts", "generated-seed.sql");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readDir(dir) {
  const full = path.join(CONTENT, dir);
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(full, f)));
}

function sqlLiteral(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function mapTeamRoleToLevel(role) {
  const r = String(role || "")
    .trim()
    .toLowerCase();
  if (r === "oc") return "oc";
  if (r === "co-overall coordinator" || r === "co overall coordinator") {
    return "co_overall_coordinator";
  }
  if (r === "research lead") return "research_lead";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  if (r.includes("alumni") || r.includes("alumn")) return "alumni";
  return null;
}

function buildLevelMap(team) {
  const levels = new Map();
  const year = team.years?.[0];
  if (!year) return levels;
  for (const m of year.coreTeam ?? []) {
    const lvl = mapTeamRoleToLevel(m.role);
    if (m.slug && lvl) levels.set(m.slug, lvl);
  }
  for (const m of year.coordinators ?? []) {
    if (m.slug) levels.set(m.slug, mapTeamRoleToLevel(m.role) || "coordinator");
  }
  for (const g of year.executives ?? []) {
    for (const m of g.members ?? []) {
      if (m.slug) levels.set(m.slug, "executive");
    }
  }
  for (const m of team.alumni ?? []) {
    if (m.slug) levels.set(m.slug, levels.get(m.slug) || "alumni");
  }
  return levels;
}

const team = readJson(path.join(CONTENT, "team.json"));
const levels = buildLevelMap(team);
const members = readDir("members");
const projects = readDir("projects");
const events = readDir("events");
const resources = readJson(path.join(CONTENT, "resources.json"));

const parts = ["begin;"];

for (const m of members) {
  const level = levels.get(m.slug) || "member";
  parts.push(
    `insert into public.members (slug, data, level) values ('${m.slug}', ${sqlLiteral(m)}, '${level}') on conflict (slug) do update set data = excluded.data, level = excluded.level, updated_at = now();`,
  );
}

for (const p of projects) {
  parts.push(
    `insert into public.projects (slug, data, featured) values ('${p.slug}', ${sqlLiteral(p)}, ${p.featured ? "true" : "false"}) on conflict (slug) do update set data = excluded.data, featured = excluded.featured, updated_at = now();`,
  );
}

for (const e of events) {
  const date = e.date ? `'${e.date}'::date` : "null";
  parts.push(
    `insert into public.events (slug, data, date) values ('${e.slug}', ${sqlLiteral(e)}, ${date}) on conflict (slug) do update set data = excluded.data, date = excluded.date, updated_at = now();`,
  );
}

parts.push(
  `insert into public.resources (id, data) values (1, ${sqlLiteral(resources)}) on conflict (id) do update set data = excluded.data, updated_at = now();`,
);
parts.push(
  `insert into public.team (id, data) values (1, ${sqlLiteral(team)}) on conflict (id) do update set data = excluded.data, updated_at = now();`,
);
parts.push("commit;");

fs.writeFileSync(OUT, parts.join("\n") + "\n");
console.log(`Wrote ${OUT} (${members.length} members, ${projects.length} projects, ${events.length} events)`);
