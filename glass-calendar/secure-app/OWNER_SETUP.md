# Daylight owner setup — Supabase Auth

Daylight uses Supabase Auth email/password accounts only. There is no public registration or custom username/password table.

1. Open the Supabase project dashboard, then **Authentication → Providers → Email** and enable email/password authentication.
2. In **Authentication → Settings → User Signups**, **disable public sign-ups**. This is essential: removing the signup button alone does not prevent someone calling the Auth signup endpoint.
3. Create each account yourself in **Authentication → Users → Add user** and enter its email and initial password. Do not store passwords in the repository or send them through chat.
4. Under **Authentication → URL Configuration** set **Site URL** to `https://joeynatale28-source.github.io/main-hub/glass-calendar/` (including the trailing slash). Add that **exact same URL** to **Redirect URLs**. Do not use `http://localhost:3000` as the production Site URL. This project has a static GitHub Pages route: it accepts Supabase callbacks at `/main-hub/glass-calendar/?code=...` and implicit callbacks at `/main-hub/glass-calendar/#access_token=...`, then clears them from browser history.
5. Publish the public Supabase URL and publishable/anon key as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never publish the service-role key.
6. The first authenticated load creates an empty user settings record and four starting calendars.
7. A user can select **Forgot password?** to request the Supabase reset email. An emailed link does not create a new account.

Data reset: the 2026-11-02 migration intentionally deleted all previous Daylight custom accounts, sessions, settings, calendars, events, subscriptions and MCP tokens. Existing custom-account passwords and login credentials cannot be reused.

MCP uses a hashed token tied to each Supabase Auth user. Revoke deletes the token record on the server; a revoked token fails future MCP requests.

Deployment: GitHub Pages only. The frontend is static, the backend is a Supabase Edge Function. Do not deploy to Vercel.

The Email + Password login calls Supabase Auth directly and does **not** use an HTTP redirect; the callback applies to email confirmation, invitations, OAuth, and recovery links. A server-side `invalid_credentials` response is a credential verification error, not a callback/URL allowlist error. User creation is owner-only; do not add a public signup button.
