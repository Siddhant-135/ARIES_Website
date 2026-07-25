# ARIES database

SQLite store shared by the Express API (`aries-website/`) and optionally the Next.js frontend.

| File | Role |
| --- | --- |
| `schema.sql` | Tables |
| `seed.mjs` | Build `aries.db` from `content/` + `legacy-merge.json` |
| `legacy-merge.json` | Extra people/events/projects from the old site |
| `aries.db` | Runtime DB (generated, gitignored) |

```bash
# from repo root (after npm install)
npm run db:seed
```

Default password for OC / coordinator logins: `aries-dev` (override with `SEED_PASSWORD`).
