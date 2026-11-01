# daylight. v2.0 — Verification record

## Verified in the connected Supabase project

- The new `public.users` table has one account (`joeyn028`), flagged as an administrator and unclaimed; no password or PIN hash has been set.
- The new `public.sessions` and `public.dl_*` workspace tables have RLS enabled without client policies. Client roles have table privileges revoked; the service role is intended to be the only direct table reader/writer.
- The private delete-and-audit RPC has been installed, and public role execution was revoked.
- `daylight-api` Edge Function deployed and listed ACTIVE. The old `daylight-signup` Edge Function now returns a Gone response.
- The security advisor's remaining informational notices about RLS policies on the new private tables are intentional; previous public SECURITY DEFINER execution warnings were cleared.

## Static/simulated checks completed

- `node --check` of the built static JavaScript: passed.
- TypeScript transpilation parse of the MCP server: passed. Dependencies were not installed here, so typechecking/resolution and runtime behavior remain unverified.
- Headless Chromium, using an inline HTML mock because local network navigation was blocked: passed login, first-time welcome tour, six-digit PIN setup+confirmation, calendar rendering, Settings, Default Calendar View value, month date-number Day drill-in+Back, wizard Discard regression, and collapsed/expanded sidebar. No uncaught JS page errors in those mocked checks.

## Still unverified or incomplete

- A live HTTP end-to-end claim/login/PIN operation, database cross-user isolation test through the deployed Edge Function, and real multi-browser persistence.
- SDK installation and actual MCP client tool invocation, including revoke and delete gating.
- Automatic CalDAV/Google/Apple two-way synchronization and ICS subscription refreshing. Saved subscription URLs work, but their event feeds are not automatically fetched.
- Full UI accessibility (all keyboard, focus, screen reader), all tooltip/animation acceptance cases, responsive mobile review, and production performance/security penetration testing.
- No deployment to the prior GitHub Pages repo (the connected GitHub account did not expose a daylight. repository).

The full user acceptance checklist must be executed against a hosted build before release to other people.
