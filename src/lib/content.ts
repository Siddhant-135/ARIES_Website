/**
 * Content readers. All pages get data through these functions.
 * Source of truth for public pages: content/*.json
 * (kept in sync with database/aries.db by the Express API + admin save).
 * Seed/merge: npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import type {
  AriesEvent,
  Member,
  Project,
  Resource,
  TeamData,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson<T>(...segments: string[]): T {
  const file = path.join(CONTENT_DIR, ...segments);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function readDir<T>(dir: string): T[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<T>(dir, f));
}

/* Members */
export function getMembers(): Member[] {
  return readDir<Member>("members");
}
export function getMember(slug: string): Member | undefined {
  return getMembers().find((m) => m.slug === slug);
}

/* Projects */
export function getProjects(): Project[] {
  return readDir<Project>("projects");
}
export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

/* Events */
export function getEvents(): AriesEvent[] {
  return readDir<AriesEvent>("events").sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}
export function getEvent(slug: string): AriesEvent | undefined {
  return getEvents().find((e) => e.slug === slug);
}
export function splitEvents(now = new Date()) {
  const all = getEvents();
  const today = now.toISOString().slice(0, 10);
  return {
    upcoming: all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: all.filter((e) => e.date < today),
  };
}

/* Resources */
export function getResources(): Resource[] {
  return readJson<Resource[]>("resources.json");
}

/* Team */
export function getTeam(): TeamData {
  return readJson<TeamData>("team.json");
}
