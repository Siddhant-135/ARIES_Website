#!/usr/bin/env node
/**
 * Seed database/aries.db from content/ JSON (+ optional legacy merge).
 * Usage: node database/seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const DB_PATH = path.join(__dirname, "aries.db");
const SCHEMA = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function readDir(dir) {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(full, f)));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function inferLevel(role = "") {
  const r = role.toLowerCase();
  if (r.includes("alumni")) return "alumni";
  if ((/\boc\b/.test(r) || r.includes("overall coordinator")) && !r.includes("ex-oc") && !r.includes("co-"))
    return "oc";
  if (r.includes("co-oc") || r.includes("co-overall") || r.includes("overall")) return "oc";
  if (r.includes("research lead") || r.includes("panelist")) return "oc";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  return "member";
}

if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.exec(SCHEMA);

const insertMember = db.prepare(`
  INSERT INTO members (slug, data, email, level, password_hash, group_name)
  VALUES (@slug, @data, @email, @level, @password_hash, @group_name)
`);
const insertProject = db.prepare(`INSERT INTO projects (slug, data, section, featured) VALUES (?, ?, ?, ?)`);
const insertEvent = db.prepare(`INSERT INTO events (slug, data, date) VALUES (?, ?, ?)`);

const members = readDir("members");
const projects = readDir("projects");
const events = readDir("events");
const resources = readJson(path.join(CONTENT, "resources.json"));
const team = readJson(path.join(CONTENT, "team.json"));

// Optional legacy enrichments written by merge script
const legacyPath = path.join(__dirname, "legacy-merge.json");
const legacy = fs.existsSync(legacyPath) ? readJson(legacyPath) : null;

const defaultPassword = process.env.SEED_PASSWORD || "aries-dev";
const defaultHash = hashPassword(defaultPassword);

const memberBySlug = new Map(members.map((m) => [m.slug, m]));

if (legacy?.people) {
  for (const p of legacy.people) {
    const existing = memberBySlug.get(p.slug);
    if (existing) {
      if (!existing.tagline && p.bio) existing.tagline = p.bio.slice(0, 120);
      if ((!existing.blocks || existing.blocks.length === 0) && (p.publications?.length || p.news?.length || p.bio)) {
        existing.blocks = [];
        if (p.bio) {
          existing.blocks.push({
            id: "about",
            type: "text",
            span: "full",
            title: "About",
            data: p.bio, // text/research blocks expect a plain string
          });
        }
        if (p.publications?.length) {
          const pubText = p.publications
            .map((pub) => `${pub.title}\n${pub.venue}${pub.date ? ` (${pub.date.slice(0, 4)})` : ""}`)
            .join("\n\n");
          existing.blocks.push({
            id: "research",
            type: "research",
            span: "full",
            title: "Publications",
            data: pubText,
          });
        }
      }
      if (!existing.name?.includes(" ") && p.name) existing.name = p.name;
      if (p.email) existing._email = p.email;
      if (p.tags) existing._tags = p.tags;
      memberBySlug.set(p.slug, existing);
    } else {
      memberBySlug.set(p.slug, {
        slug: p.slug,
        name: p.name,
        role: p.role,
        tagline: p.bio?.slice(0, 120) ?? "",
        location: "IIT Delhi",
        socials: [],
        blocks: p.bio
          ? [{ id: "about", type: "text", span: "full", title: "About", data: p.bio }]
          : [],
        _email: p.email,
        _tags: p.tags,
        _level: "oc",
      });
    }
  }
}

const seedTxn = db.transaction(() => {
  for (const m of memberBySlug.values()) {
    const email = m._email || `${m.slug}@aries-iitd.in`;
    const level = m._level || inferLevel(m.role);
    const { _email, _tags, _level, ...data } = m;
    insertMember.run({
      slug: m.slug,
      data: JSON.stringify(data),
      email,
      level,
      password_hash: ["oc", "coordinator"].includes(level) ? defaultHash : null,
      group_name: null,
    });
    // Keep content/ in sync with enriched member profiles
    fs.writeFileSync(
      path.join(CONTENT, "members", `${m.slug}.json`),
      JSON.stringify(data, null, 2) + "\n",
    );
  }

  // Attach executive group from team.json
  for (const year of team.years ?? []) {
    for (const g of year.executives ?? []) {
      for (const mem of g.members ?? []) {
        if (!mem.slug) continue;
        db.prepare(`UPDATE members SET group_name = ? WHERE slug = ?`).run(g.group, mem.slug);
      }
    }
  }

  for (const p of projects) {
    insertProject.run(p.slug, JSON.stringify(p), p.category ?? null, p.featured ? 1 : 0);
  }

  if (legacy?.projects) {
    for (const p of legacy.projects) {
      const exists = db.prepare(`SELECT 1 FROM projects WHERE slug = ?`).get(p.slug);
      if (exists) continue;
      insertProject.run(p.slug, JSON.stringify(p), p.category ?? p.section ?? null, p.featured ? 1 : 0);
      const projectFile = path.join(CONTENT, "projects", `${p.slug}.json`);
      if (!fs.existsSync(projectFile)) {
        fs.writeFileSync(projectFile, JSON.stringify(p, null, 2) + "\n");
      }
    }
  }

  for (const e of events) {
    insertEvent.run(e.slug, JSON.stringify(e), e.date ?? null);
  }

  if (legacy?.events) {
    for (const e of legacy.events) {
      const exists = db.prepare(`SELECT 1 FROM events WHERE slug = ?`).get(e.slug);
      if (exists) continue;
      insertEvent.run(e.slug, JSON.stringify(e), e.date ?? null);
      const eventFile = path.join(CONTENT, "events", `${e.slug}.json`);
      if (!fs.existsSync(eventFile)) {
        fs.writeFileSync(eventFile, JSON.stringify(e, null, 2) + "\n");
      }
    }
  }

  db.prepare(`INSERT INTO resources (id, data) VALUES (1, ?)`).run(JSON.stringify(resources));
  db.prepare(`INSERT INTO team (id, data) VALUES (1, ?)`).run(JSON.stringify(team));

  if (legacy?.problems) {
    const ins = db.prepare(`INSERT INTO problems (slug, data) VALUES (?, ?)`);
    for (const p of legacy.problems) ins.run(p.slug, JSON.stringify(p));
  }
});

seedTxn();

const counts = {
  members: db.prepare(`SELECT COUNT(*) AS c FROM members`).get().c,
  projects: db.prepare(`SELECT COUNT(*) AS c FROM projects`).get().c,
  events: db.prepare(`SELECT COUNT(*) AS c FROM events`).get().c,
};

db.close();

console.log(`Seeded ${DB_PATH}`);
console.log(counts);
console.log(`Default login password for OC/coordinators: ${defaultPassword}`);
