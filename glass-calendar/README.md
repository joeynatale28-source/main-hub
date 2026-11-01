# daylight. v2 — Manual account calendar

Deployed as the `glass-calendar/` app inside `joeynatale28-source/main-hub` on GitHub Pages.
The public site is at `https://joeynatale28-source.github.io/main-hub/glass-calendar/` when the repository Pages source is deployed from `main`.

## Frontend

The production static files are `index.html`, `main.js`, and `style.css` in this directory. The editable Vite source is in `web/`. Use `npm install && npm run build`; then copy `dist/` contents over the production files when releasing.

Public configuration is compiled into the frontend. Never put password, claim code, PIN, MCP token, session token or service role key in the frontend source or GitHub.

## Backend and security

The web app talks only to the deployed Supabase `daylight-api` Edge Function. Manual accounts are stored in `public.users`, with owner `joeyn028` initially unclaimed. The old Supabase Auth-based `v2-*.js` sources are kept in the repository as historical source, but the new `index.html` does not load them.

**Initial owner claim:** You must enter the one-time owner invitation code from the separately provided private setup file. Do not commit that file. Setup generates a new password and PIN through the application.

New workspace data is stored in RLS-locked `dl_*` tables, separately from older Auth-based tables. The Edge Function uses a server-side service-role key; access is checked per-session and owner-scoped.

## Features and limitations

The new app includes day/week/month/agenda navigation, calendar and task editing, preferences, theme, manual admin users, owner invitations, PIN lock, onboarding, and AI access. It is a new standalone implementation replacing the old UI entry point. Two-way CalDAV/Google/Apple synchronization and automatic ICS feed refresh are not implemented yet. See `QA.md` for tests and remaining limitations.

## CI / GitHub Pages

`main-hub/.github/workflows/daylight-pages.yml` builds a Pages artifact containing the existing hub homepage plus the new calendar, preserving the rest of the hub site. GitHub Pages must have its **Source: GitHub Actions** enabled for that workflow to publish.
