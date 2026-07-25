# ARIES Website — agent map

Next.js (App Router) + TypeScript + Tailwind v4. Content is JSON; UI is small
single-purpose components. Find the file, make the change, done.

## To change X, edit Y

| Change | File(s) |
| --- | --- |
| Brand colors (hex source of truth) | `src/config/colors.ts` — then mirror CSS vars in `src/app/globals.css` |
| Shadows, radii, glow/ring utility classes | `src/app/globals.css` |
| Nav links (sidebar, top navbar, footer columns) | `src/config/nav.ts` |
| Club socials / email / address | `src/config/socials.ts` |
| A member's profile content | `content/members/<slug>.json` (blocks array = section order; `span: full\|half`) |
| A project | `content/projects/<slug>.json` |
| An event | `content/events/<slug>.json` (date decides upcoming vs past) |
| Resources list | `content/resources.json` |
| Team rosters / years / alumni | `content/team.json` |
| Content schemas (add a field) | `src/lib/types.ts`, readers in `src/lib/content.ts` |
| Left sidebar (collapse, mobile drawer, art) | `src/components/layout/Sidebar.tsx` |
| Landing top navbar | `src/components/layout/TopNav.tsx` |
| Landing footer (mountain + copyright) | `src/components/sections/landing/FaqAndFooter.tsx` (also `SiteFooter.tsx`) |
| Sticky landing header | `src/components/layout/TopNav.tsx` |
| Landing sections | `src/components/sections/landing/*` |
| Events page UI / filters | `src/components/sections/events/EventsExplorer.tsx`, card: `src/components/cards/EventCard.tsx` |
| Projects page UI / search | `src/components/sections/projects/ProjectsExplorer.tsx`, card: `src/components/cards/ProjectCard.tsx` |
| Team page UI | `src/components/sections/team/*`, card: `src/components/cards/PersonCard.tsx` |
| Resources page UI | `src/components/sections/resources/ResourcesExplorer.tsx` |
| Contact page | `src/app/(site)/contact/page.tsx`, form: `src/components/sections/contact/ContactForm.tsx` |
| Club email / LinkedIn | `src/config/socials.ts` |
| Member login | `/admin` (nav link); temporary creds `admin` / `testpwd` via API |
| Profile page layout / hero / back-button logic | `src/app/[slug]/page.tsx` |
| How a profile section renders | `src/components/profile/blocks.tsx` (one renderer per block type) |
| Profile 2-column packing | `src/components/profile/BlockGrid.tsx` |
| Admin login (stub) | `src/app/admin/page.tsx` |
| Admin editor (drag-drop blocks, project/event forms) | `src/components/admin/*` |
| Content write API | `src/app/api/admin/save/route.ts` (also mirrors into SQLite) |
| Express backend (CRUD + auth) | `aries-website/` → `http://localhost:4000` |
| SQLite schema / seed | `database/` (`npm run db:seed`) |
| Import members from Excel + Drive photos | `npm run import:excel -- <file.xlsx>` → `scripts/import-from-excel.mjs` |

## Routing

- `/` landing (own top navbar, no sidebar)
- `/(site)/...` = events, projects, team, resources, contact + detail pages — all share the collapsible sidebar via `src/app/(site)/layout.tsx`
- `/<member-slug>` member profile at the root (short URLs). Static routes win over the dynamic slug. `?from=team` or `?from=project:<slug>` renders the "Back to X" button.
- `/admin` stub login → `/admin/editor`

## Conventions

- Public pages read via `src/lib/content.ts` (JSON under `content/`).
- Live CRUD/auth: Express API in `aries-website/` backed by `database/aries.db`.
- After content changes offline: `npm run db:seed`. Run API with `npm run dev:api`.
- Images live in `public/images/{brand,landing,sidebar,projects}`.
- Category chip colors: `src/components/ui/CategoryBadge.tsx`.
- Icons: `lucide-react` (no brand icons — use monogram tiles like Contact page).
- Run: `npm run dev`. Content saves from the admin editor only persist in dev.
