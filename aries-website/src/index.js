import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { db } from "./db.js";
import {
  bearer,
  createSession,
  destroySession,
  getSession,
  requireAdmin,
  requireAuth,
  tryBootstrapLogin,
  verifyPassword,
} from "./auth.js";
import {
  deleteEventJson,
  deleteMemberJson,
  deleteProjectJson,
  writeEventJson,
  writeMemberJson,
  writeProjectJson,
  writeResourcesJson,
  writeTeamJson,
} from "./sync-content.js";

const PORT = Number(process.env.PORT || 4000);
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

function parseRow(row) {
  return row ? JSON.parse(row.data) : null;
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post("/auth/login", (req, res) => {
  const { entryNumber, password, email } = req.body ?? {};
  const id = String(entryNumber || email || "")
    .trim()
    .toLowerCase();
  if (!id || !password) return res.status(400).json({ error: "Missing credentials" });

  // Temporary: only bootstrap admin works. Member JSON logins come later.
  const bootstrap = tryBootstrapLogin(id, password);
  if (bootstrap) return res.json(bootstrap);

  // Keep password verification plumbing for future member JSON — reject for now.
  const row =
    db.prepare(`SELECT * FROM members WHERE lower(email) = ? OR lower(slug) = ?`).get(id, id) ||
    db.prepare(`SELECT * FROM members WHERE lower(email) LIKE ?`).get(`${id}@%`);

  if (row?.password_hash && verifyPassword(password, row.password_hash)) {
    // Intentionally blocked until member login list is provided.
    return res.status(401).json({ error: "You're not a member" });
  }

  return res.status(401).json({ error: "You're not a member" });
});

app.get("/auth/me", (req, res) => {
  const session = getSession(bearer(req));
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  res.json(session);
});

app.post("/auth/logout", (req, res) => {
  const token = bearer(req);
  if (token) destroySession(token);
  res.json({ ok: true });
});

// ── Members ──────────────────────────────────────────────────────────────────
app.get("/members", (_req, res) => {
  const rows = db.prepare(`SELECT data, email, level, group_name FROM members ORDER BY slug`).all();
  res.json(
    rows.map((r) => {
      const m = JSON.parse(r.data);
      return {
        ...m,
        email: r.email,
        level: r.level,
        group: r.group_name ?? undefined,
        tags: m.tags ?? [],
        bio: m.tagline ?? "",
        news: m.news ?? [],
        publications: m.publications ?? [],
        year: m.year ?? "",
      };
    }),
  );
});

app.get("/members/:slug", (req, res) => {
  const row = db.prepare(`SELECT data, email, level, group_name FROM members WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const m = JSON.parse(row.data);
  res.json({
    ...m,
    email: row.email,
    level: row.level,
    group: row.group_name ?? undefined,
    tags: m.tags ?? [],
    bio: m.tagline ?? "",
    news: m.news ?? [],
    publications: m.publications ?? [],
    year: m.year ?? "",
  });
});

app.post("/members", requireAdmin, (req, res) => {
  const data = { ...req.body };
  const slug = data.slug || slugify(data.name);
  if (!slug) return res.status(400).json({ error: "slug required" });
  data.slug = slug;
  if (!data.socials) data.socials = [];
  if (!data.blocks) data.blocks = [];
  db.prepare(
    `INSERT INTO members (slug, data, email, level, group_name) VALUES (?, ?, ?, ?, ?)`,
  ).run(slug, JSON.stringify(data), data.email ?? `${slug}@aries-iitd.in`, data.level ?? "member", data.group ?? null);
  writeMemberJson(slug, data);
  res.status(201).json(data);
});

app.patch("/members/:slug", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT * FROM members WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const prev = JSON.parse(row.data);
  const data = { ...prev, ...req.body, slug: req.params.slug };
  db.prepare(
    `UPDATE members SET data = ?, email = COALESCE(?, email), level = COALESCE(?, level),
     group_name = COALESCE(?, group_name), updated_at = datetime('now') WHERE slug = ?`,
  ).run(
    JSON.stringify(data),
    req.body.email ?? null,
    req.body.level ?? null,
    req.body.group ?? null,
    req.params.slug,
  );
  writeMemberJson(req.params.slug, data);
  res.json(data);
});

app.delete("/members/:slug", requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM members WHERE slug = ?`).run(req.params.slug);
  deleteMemberJson(req.params.slug);
  res.json({ ok: true });
});

// ── Projects ─────────────────────────────────────────────────────────────────
app.get("/projects", (_req, res) => {
  const rows = db.prepare(`SELECT data, section FROM projects ORDER BY slug`).all();
  const grouped = {};
  for (const r of rows) {
    const p = JSON.parse(r.data);
    const section = r.section || p.category || "Projects";
    // API shape expected by old client: Record<section, Project[]>
    const apiProject = {
      _id: p.slug,
      slug: p.slug,
      title: p.name,
      tag: p.tags?.[0] ?? p.category ?? "",
      section,
      blurb: p.tagline ?? p.description ?? "",
      description: p.about ?? p.description,
      status: p.featured ? "ongoing" : "past",
      people: (p.contributors ?? []).map((slug) => ({ name: slug, memberSlug: slug })),
      venue: undefined,
      links: p.links ?? [],
      stages: p.stages ?? [],
      coverImage: p.image,
      featured: !!p.featured,
      isPublic: true,
      // keep frontend shape too
      ...p,
    };
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(apiProject);
  }
  res.json(grouped);
});

app.get("/projects/:slug", (req, res) => {
  const row = db.prepare(`SELECT data, section FROM projects WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const p = JSON.parse(row.data);
  res.json({ ...p, section: row.section });
});

app.post("/projects", requireAdmin, (req, res) => {
  const body = req.body ?? {};
  const slug = body.slug || slugify(body.name || body.title);
  const data = {
    slug,
    name: body.name || body.title || slug,
    tagline: body.tagline || body.blurb || "",
    description: body.description || body.blurb || "",
    category: body.category || body.section || "Project",
    tags: body.tags || (body.tag ? [body.tag] : []),
    techStack: body.techStack || [],
    highlights: body.highlights || [],
    features: body.features || [],
    screenshots: body.screenshots || [],
    links: body.links || [],
    contributors: body.contributors || [],
    featured: !!body.featured,
    stages: body.stages || [],
    ...body,
    slug,
  };
  db.prepare(`INSERT INTO projects (slug, data, section, featured) VALUES (?, ?, ?, ?)`).run(
    slug,
    JSON.stringify(data),
    data.category,
    data.featured ? 1 : 0,
  );
  writeProjectJson(slug, data);
  res.status(201).json(data);
});

app.patch("/projects/:slug", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT * FROM projects WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const prev = JSON.parse(row.data);
  const data = { ...prev, ...req.body, slug: req.params.slug };
  db.prepare(
    `UPDATE projects SET data = ?, section = COALESCE(?, section), featured = ?, updated_at = datetime('now') WHERE slug = ?`,
  ).run(JSON.stringify(data), data.category ?? null, data.featured ? 1 : 0, req.params.slug);
  writeProjectJson(req.params.slug, data);
  res.json(data);
});

app.delete("/projects/:slug", requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM projects WHERE slug = ?`).run(req.params.slug);
  deleteProjectJson(req.params.slug);
  res.json({ ok: true });
});

// Project stages (stored inside project JSON)
app.post("/projects/:slug/stages", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM projects WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = JSON.parse(row.data);
  const stage = { _id: crypto.randomBytes(8).toString("hex"), ...req.body };
  data.stages = [...(data.stages || []), stage];
  db.prepare(`UPDATE projects SET data = ?, updated_at = datetime('now') WHERE slug = ?`).run(
    JSON.stringify(data),
    req.params.slug,
  );
  writeProjectJson(req.params.slug, data);
  res.json(data);
});

app.patch("/projects/:slug/stages/:stageId", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM projects WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = JSON.parse(row.data);
  data.stages = (data.stages || []).map((s) =>
    s._id === req.params.stageId ? { ...s, ...req.body, _id: s._id } : s,
  );
  db.prepare(`UPDATE projects SET data = ?, updated_at = datetime('now') WHERE slug = ?`).run(
    JSON.stringify(data),
    req.params.slug,
  );
  writeProjectJson(req.params.slug, data);
  res.json(data);
});

app.delete("/projects/:slug/stages/:stageId", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM projects WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = JSON.parse(row.data);
  data.stages = (data.stages || []).filter((s) => s._id !== req.params.stageId);
  db.prepare(`UPDATE projects SET data = ?, updated_at = datetime('now') WHERE slug = ?`).run(
    JSON.stringify(data),
    req.params.slug,
  );
  writeProjectJson(req.params.slug, data);
  res.json(data);
});

// ── Events ───────────────────────────────────────────────────────────────────
app.get("/events", (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`SELECT data, date FROM events ORDER BY date DESC`).all();
  res.json(
    rows.map((r) => {
      const e = JSON.parse(r.data);
      const type = (e.type || "External").toLowerCase();
      const category =
        type.includes("hack") ? "hackathon" :
        type.includes("work") ? "workshop" :
        type.includes("talk") || type.includes("seminar") ? "seminar" :
        "external";
      return {
        _id: e.slug,
        slug: e.slug,
        title: e.title,
        blurb: e.description,
        description: e.body || e.description,
        date: e.date,
        dateLabel: e.date,
        category,
        status: e.date >= today ? "upcoming" : "past",
        featured: false,
        registrationUrl: e.links?.[0]?.url,
        image: e.image,
        ...e,
      };
    }),
  );
});

app.get("/events/:slug", (req, res) => {
  const row = db.prepare(`SELECT data FROM events WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(parseRow(row));
});

app.post("/events", requireAdmin, (req, res) => {
  const body = req.body ?? {};
  const slug = body.slug || slugify(body.title);
  const data = {
    slug,
    title: body.title,
    type: body.type || "External",
    date: body.date,
    description: body.description || body.blurb || "",
    body: body.body || body.description || "",
    links: body.links || [],
    ...body,
    slug,
  };
  db.prepare(`INSERT INTO events (slug, data, date) VALUES (?, ?, ?)`).run(slug, JSON.stringify(data), data.date);
  writeEventJson(slug, data);
  res.status(201).json(data);
});

app.patch("/events/:slug", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM events WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = { ...JSON.parse(row.data), ...req.body, slug: req.params.slug };
  db.prepare(`UPDATE events SET data = ?, date = ?, updated_at = datetime('now') WHERE slug = ?`).run(
    JSON.stringify(data),
    data.date,
    req.params.slug,
  );
  writeEventJson(req.params.slug, data);
  res.json(data);
});

app.delete("/events/:slug", requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM events WHERE slug = ?`).run(req.params.slug);
  deleteEventJson(req.params.slug);
  res.json({ ok: true });
});

// ── Problems ─────────────────────────────────────────────────────────────────
app.get("/problems", (_req, res) => {
  res.json(db.prepare(`SELECT data FROM problems`).all().map(parseRow));
});

app.get("/problems/:slug", (req, res) => {
  const row = db.prepare(`SELECT data FROM problems WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(parseRow(row));
});

app.get("/problems/:slug/leaderboard", (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM submissions WHERE problem_slug = ? ORDER BY score DESC, created_at ASC LIMIT 50`,
    )
    .all(req.params.slug);
  res.json(
    rows.map((r, i) => ({
      _id: String(r.id),
      problemSlug: r.problem_slug,
      memberSlug: r.member_slug,
      memberName: r.member_name,
      score: r.score,
      notes: r.notes,
      rank: i + 1,
      createdAt: r.created_at,
    })),
  );
});

app.post("/problems/:slug/submit", requireAuth, (req, res) => {
  const { score, notes, memberName } = req.body ?? {};
  const info = db
    .prepare(
      `INSERT INTO submissions (problem_slug, member_slug, member_name, score, notes)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      req.params.slug,
      req.session.memberSlug,
      memberName || req.session.name,
      Number(score) || 0,
      notes ?? null,
    );
  res.status(201).json({
    _id: String(info.lastInsertRowid),
    problemSlug: req.params.slug,
    memberSlug: req.session.memberSlug,
    memberName: memberName || req.session.name,
    score: Number(score) || 0,
    notes,
    createdAt: new Date().toISOString(),
  });
});

app.post("/problems", requireAdmin, (req, res) => {
  const slug = req.body.slug || slugify(req.body.title);
  const data = { ...req.body, slug };
  db.prepare(`INSERT INTO problems (slug, data) VALUES (?, ?)`).run(slug, JSON.stringify(data));
  res.status(201).json(data);
});

app.patch("/problems/:slug", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM problems WHERE slug = ?`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = { ...JSON.parse(row.data), ...req.body, slug: req.params.slug };
  db.prepare(`UPDATE problems SET data = ?, updated_at = datetime('now') WHERE slug = ?`).run(
    JSON.stringify(data),
    req.params.slug,
  );
  res.json(data);
});

app.delete("/problems/:slug", requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM problems WHERE slug = ?`).run(req.params.slug);
  res.json({ ok: true });
});

// ── Team / resources (frontend helpers) ──────────────────────────────────────
app.get("/team", (_req, res) => {
  const row = db.prepare(`SELECT data FROM team WHERE id = 1`).get();
  res.json(row ? JSON.parse(row.data) : { years: [], alumni: [] });
});

app.put("/team", requireAdmin, (req, res) => {
  db.prepare(`INSERT INTO team (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(
    JSON.stringify(req.body),
  );
  writeTeamJson(req.body);
  res.json(req.body);
});

app.get("/resources", (_req, res) => {
  const row = db.prepare(`SELECT data FROM resources WHERE id = 1`).get();
  res.json(row ? JSON.parse(row.data) : []);
});

app.put("/resources", requireAdmin, (req, res) => {
  db.prepare(
    `INSERT INTO resources (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
  ).run(JSON.stringify(req.body));
  writeResourcesJson(req.body);
  res.json(req.body);
});

// ── Admin ────────────────────────────────────────────────────────────────────
app.get("/admin/stats", requireAdmin, (_req, res) => {
  res.json({
    members: db.prepare(`SELECT COUNT(*) AS c FROM members`).get().c,
    projects: db.prepare(`SELECT COUNT(*) AS c FROM projects`).get().c,
    events: db.prepare(`SELECT COUNT(*) AS c FROM events`).get().c,
    problems: db.prepare(`SELECT COUNT(*) AS c FROM problems`).get().c,
  });
});

app.get("/admin/invoices", requireAdmin, (_req, res) => {
  res.json(db.prepare(`SELECT data FROM invoices ORDER BY created_at DESC`).all().map(parseRow));
});

app.get("/admin/invoices/summary", requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT data FROM invoices`).all().map(parseRow);
  let income = 0;
  let expense = 0;
  for (const inv of rows) {
    if (inv.type === "income") income += Number(inv.amount) || 0;
    else expense += Number(inv.amount) || 0;
  }
  res.json({ income, expense, balance: income - expense });
});

app.post("/admin/invoices", requireAdmin, (req, res) => {
  const id = crypto.randomBytes(8).toString("hex");
  const data = { _id: id, ...req.body };
  db.prepare(`INSERT INTO invoices (id, data) VALUES (?, ?)`).run(id, JSON.stringify(data));
  res.status(201).json(data);
});

app.patch("/admin/invoices/:id", requireAdmin, (req, res) => {
  const row = db.prepare(`SELECT data FROM invoices WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  const data = { ...JSON.parse(row.data), ...req.body, _id: req.params.id };
  db.prepare(`UPDATE invoices SET data = ? WHERE id = ?`).run(JSON.stringify(data), req.params.id);
  res.json(data);
});

app.delete("/admin/invoices/:id", requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM invoices WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "aries-api" }));

app.listen(PORT, () => {
  console.log(`ARIES API listening on http://localhost:${PORT}`);
});
