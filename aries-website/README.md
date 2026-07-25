# ARIES API (backend)

Express + SQLite backend extracted from the old `aries-website` app’s API contract (`localhost:4000`).

The database lives one level up in [`../database`](../database).

## Run

```bash
# from repo root
npm install
npm run db:seed

# backend
cd aries-website
npm install
npm run dev          # http://localhost:4000
```

## Auth

OC / coordinator accounts seeded from `content/` get password `aries-dev` (or `SEED_PASSWORD`).

Login with slug or email, e.g.:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"entryNumber":"sanidhya","password":"aries-dev"}'
```

## Routes

Matches the old client: `/members`, `/projects`, `/events`, `/problems`, `/admin/*`, `/auth/*`, plus `/team` and `/resources`.
