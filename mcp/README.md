# Daylight MCP

Stdio MCP server for a Daylight account. The token is generated inside **Daylight → Settings → AI access**. Token hashes only are stored on Supabase.

## Install

```sh
cd mcp
npm install
npm run check
npm start
```

Supply three environment variables on your own machine: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DAYLIGHT_MCP_TOKEN`. **Do not commit these values.** The service role is for this trusted local server process only; never put it in GitHub Pages or browser code.

## Example MCP client configuration

```json
{"mcpServers":{"daylight":{"command":"npx","args":["tsx","/absolute/path/to/main-hub/mcp/src/index.ts"],"env":{"SUPABASE_URL":"https://YOUR_PROJECT.supabase.co","SUPABASE_SERVICE_ROLE_KEY":"<PRIVATE_SERVER_KEY>","DAYLIGHT_MCP_TOKEN":"<TOKEN_SHOWN_ONCE>"}}}}
```

## Smoke test

Run `npm run smoke` with the same three variables after creating a token and having at least one writable calendar. The script connects over stdio and checks list_calendars, create_event, list_events, create_task, complete_task, and the refusal to delete an event while AI deletes are disabled.

Expected ending output: `PASS: list/create/list/task/complete/delete-disabled`.

The server must filter **every** service-role query by the validated token's `user_id` because the service role bypasses row-level security. Revoked tokens are rejected. To test enabled deletes and auditing, toggle AI deletes in Settings, call `delete_event`, and verify a matching `dl_mcp_audit_log` record.
