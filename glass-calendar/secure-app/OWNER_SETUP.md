# Daylight owner setup — Supabase Auth

Daylight uses Supabase Auth email/password accounts only. There is no public registration or custom username/password table.

1. Open the Supabase project dashboard, then **Authentication → Providers → Email** and enable email/password authentication.
2. In **Authentication → Settings → User Signups**, **disable public sign-ups**. This is essential: removing the signup button alone does not prevent someone calling the Auth signup endpoint.
3. Create each account yourself in **Authentication → Users → Add user** and enter its email and initial password. Do not store passwords in the repository or send them through chat.
4. Visit **Authentication → URL Configuration** and configure the Site URL and allowed redirect URL for `https://joeynatale28-source.github.io/main-hub/glass-calendar/` so password-reset links open Daylight.
5. Publish the public Supabase URL and publishable/anon key as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never publish the service-role key.
6. The first authenticated load creates an empty user settings record and four starting calendars.
7. A user can select **Forgot password?** to request the Supabase reset email. An emailed link does not create a new account.

Data reset: the 2026-11-02 migration intentionally deleted all previous Daylight custom accounts, sessions, settings, calendars, events, subscriptions and MCP tokens. Existing custom-account passwords and login credentials cannot be reused.

MCP uses a hashed token tied to each Supabase Auth user. Revoke deletes the token record on the server; a revoked token fails future MCP requests.

Deployment: GitHub Pages only. The frontend is static, the backend is a Supabase Edge Function. Do not deploy to Vercel.
