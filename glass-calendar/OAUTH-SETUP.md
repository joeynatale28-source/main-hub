# Daylight account + MCP OAuth deployment

## Production entry point (user-authored UI retained)

- GitHub Pages: https://joeynatale28-source.github.io/main-hub/glass-calendar/
- Calendar UI: original `index.html`, `style.css`, `js/app.js`, `js/store.js`
- Only added auth stylesheet: `auth-screen.css`
- Account bootstrap: `js/auth-boot.js` (Supabase Auth, sessions, signup, recovery, workspace sync)
- Separate OAuth consent page: `oauth/consent/index.html`
- MCP resource endpoint: https://qrqemjgpzoqhtmsowmqv.supabase.co/functions/v1/daylight-mcp
- OAuth authorization server: https://qrqemjgpzoqhtmsowmqv.supabase.co/auth/v1
- Protected resource metadata: https://qrqemjgpzoqhtmsowmqv.supabase.co/functions/v1/daylight-mcp/.well-known/oauth-protected-resource

## Required dashboard settings (cannot be set by a database migration)

Open [Supabase Authentication settings](https://supabase.com/dashboard/project/qrqemjgpzoqhtmsowmqv/auth/providers).

1. Under **Authentication > Providers > Email**, enable email/password sign-in and **Allow new users to sign up**. If email confirmation is enabled, the user must confirm via the email link before signing in. Configure SMTP/email delivery for real users. This does **not** reset or change any existing passwords.
2. Under **Authentication > URL Configuration**, set **Site URL** to:
   `https://joeynatale28-source.github.io`
   Add **Redirect URLs**:
   `https://joeynatale28-source.github.io/main-hub/glass-calendar/**`
   Emails (confirmation/reset) explicitly redirect to the calendar root.
3. Under **Authentication > OAuth Server**, **enable OAuth 2.1 server** and set Authorization Path to:
   `/main-hub/glass-calendar/oauth/consent/`
   This is an absolute origin-relative path because GitHub Pages hosts the app inside `/main-hub/glass-calendar/`, not at the domain root.
4. Enable **Dynamic Client Registration** only if you intend external MCP clients to self-register. Clients can register themselves, but **a user still sees Daylight's approval screen and can deny access**. Review client registrations in the Auth dashboard.
5. Use an asymmetric JWT signing key (ES256 / RS256) for OAuth OIDC support; it may require configuration under **Authentication > JWT Signing Keys**.
6. Consider enabling **Leaked Password Protection** under Authentication > Security.

> The client-side code and Edge Function have been deployed, but there is no available management integration to toggle Auth-level OAuth Server or signup settings. Until these dashboard switches are enabled, those flows will correctly report a Supabase configuration error instead of simulating approval.

## MCP OAuth security

1. MCP client connects to the Daylight Edge Function.
2. The server returns an HTTP 401 Bearer challenge pointing to protected-resource metadata.
3. Discovery identifies Supabase Auth as the authorization server. The client starts OAuth Authorization Code + PKCE, with dynamic registration if enabled.
4. Supabase redirects the user to the Daylight consent route with `authorization_id`.
5. User signs in, sees **verified client name/scopes and separate read/write/delete choices**, and explicitly approves or denies.
6. `getAuthorizationDetails`, `approveAuthorization` and `denyAuthorization` are Supabase Auth methods; Daylight never mints an OAuth authorization code itself.
7. Supabase issues/rotates OAuth tokens. The MCP server validates each bearer token with Supabase Auth `getUser`, extracts the verified `client_id`, checks user-owned `oauth_mcp_grants`, and enforces permissions on **every tool call**.
8. Revoking a grant in **Settings > AI access** immediately blocks MCP calls in the database; it also calls Supabase's OAuth grant revocation to invalidate refresh tokens.
9. Deletion requires **two choices**: the client was approved for delete, AND the account-wide **Allow AI deletes** toggle is enabled.
10. OAuth JWTs are blocked by restrictive RLS from directly querying calendar tables via the REST Data API, bypassing the consent-scoped MCP endpoint.

## Storage

- `workspace_snapshots(user_id, payload, revision)`: existing user-owned table, RLS enforced.
- `daylight_save_snapshot(expected_revision, document)`: atomic compare-and-swap writes for the current authenticated account.
- `oauth_mcp_grants(user_id, client_id)`: client permission approvals and immediate revocation.
- `mcp_tokens`: optional manually generated PAT tokens; only the SHA-256 digest is stored, and the plaintext is shown once.
- `mcp_workspace_audit`: server-only audit of successful/failed MCP writes.
- The original Daylight calendar renders the same objects as before. Its Store is preloaded from the current account's Supabase data before any calendar script executes. A new account never loads another person's previous localStorage data.
- Changes use a debounced, revision-checked cloud write; concurrent overwrite errors do not silently overwrite another session.
- Polling observes newer cloud snapshots; refresh/apply occurs only if no unsaved local writes are pending.

## Verification

- GitHub Actions: `.github/workflows/daylight-ui.yml` and `tests/daylight-auth.spec.js` verify login/signup design, responsive layout, account gating, recovery form and the OAuth consent route.
- SQL: test `daylight_save_snapshot` under `authenticated` in a rollback transaction, and verify second-user RLS cannot see first-user records.
- End-to-end OAuth requires an enabled Auth OAuth server and a registered/test client. A live account session is needed for the full approval/token-exchange/revocation test.
- The Data API's existing `events`/ `calendars` tables are legacy; the **current user-authored calendar** is powered by `workspace_snapshots` and the MCP server reads that same source.
