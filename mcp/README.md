# Daylight MCP server

A local stdio MCP server for Daylight v2. It uses Supabase's official JavaScript client and the MCP TypeScript SDK.

## Start

```bash
cd mcp
npm install
npm run build
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DAYLIGHT_MCP_TOKEN=... node dist/index.js
```

Copy `.env.example` for environment variable names. Never commit a real service-role key or a raw MCP token. The service role bypasses RLS, so **every tool is explicitly scoped** to the user ID resolved from the stored SHA-256 token hash.

## Example stdio client configuration

```json
{
  "mcpServers": {
    "daylight": {
      "command": "node",
      "args": ["/absolute/path/to/main-hub/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT_REF.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "SET_THIS_SECRET_LOCALLY",
        "DAYLIGHT_MCP_TOKEN": "PASTE_ONCE_FROM_DAYLIGHT_SETTINGS"
      }
    }
  }
}
```

Generate a token from Daylight → Settings → AI access. The original token is shown once, then only its hash is stored. By default, AI delete operations are rejected. The owner must explicitly enable them in Daylight Settings, and each successful delete is written to the audit log.

This is a **local process**, not a publicly hosted HTTP MCP endpoint. Keep the service-role key on a trusted local machine. Running this with untrusted AI code or sharing its environment variables would compromise the account database.

## Security and testing

Tests should verify: unknown/revoked tokens fail; no operation accesses another user's rows; delete is blocked by default; enabling deletes permits a single-ID deletion and creates an audit log. No public test password is stored here.
