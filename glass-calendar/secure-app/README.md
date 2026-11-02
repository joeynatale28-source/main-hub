# Daylight — account setup (owner only)

Daylight uses **Supabase Auth** for email/password authentication. There is no account registration UI, custom username, PIN, claim flow, or custom password table.

Owner setup:
1. In the Supabase dashboard for project `qrqemjgpzoqhtmsowmqv`, open **Authentication → Providers → Email** and **turn off “Allow new users to sign up.”** This must be enforced in Supabase's Auth configuration, not merely by hiding a button.
2. Open **Authentication → Users → Add user** and create the account with a real email and password. Add optional `first_name` and `last_name` in the user's metadata. The app derives a display name from the email until metadata is filled in.
3. Under **Authentication → URL Configuration**, configure the deployed GitHub Pages URL as an allowed redirect for password recovery: `https://joeynatale28-source.github.io/main-hub/glass-calendar/`.
4. Apply `supabase/migrations/20261102090000_supabase_auth_clean_cutover.sql` **once** during the live cutover, after confirming the old data wipe. This migration permanently deletes the old Daylight calendar/account rows and rekeys Daylight tables to `auth.users`.
5. Deploy the `daylight-release` Edge Function from this branch with `verify_jwt:false` only because the function itself verifies the bearer with `db.auth.getUser(jwt)` on every request. Keep the service-role key server-only.

MCP API tokens are generated inside Settings → AI access, bound to the authenticated user's `auth.uid()`, and deleted on revoke. Revoke immediately makes the token unusable. The MCP server validates its token against the database for every call.

**Important:** Do not merge/deploy Prompt 1 until the migration, Edge Function, and GitHub Pages frontend can be cut over together. The frontend and backend are incompatible with the removed legacy sessions. Desktop only; Prompt 2 handles UI refinements.
