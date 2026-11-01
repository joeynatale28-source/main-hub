# daylight. MCP (local stdio server)

This server connects an AI agent to the calendar belonging to a single manually created daylight. user. It does not expose Supabase Auth or public accounts. It checks the hashed Daylight MCP token **on every call**, filters **every** data query by that token's `user_id`, and refuses deletions unless that user enables AI deletes. Deletions use the database's atomic audit RPC.

## Setup

```sh
npm install
npm run build
node dist/index.js
```

Copy `.env.example` variable names into your agent configuration; use your real Supabase URL and **server-side-only** service role secret. Generate `DAYLIGHT_MCP_TOKEN` in Daylight → Settings → AI access, and store it securely.

Example local MCP host configuration (replace placeholders in the host, never commit real values):

```json
{
  "mcpServers": {
    "daylight": {
      "command": "node",
      "args": ["/absolute/path/to/daylight-v2/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "SET_SERVER_SECRET_LOCALLY",
        "DAYLIGHT_MCP_TOKEN": "PASTE_ONE_TIME_TOKEN"
      }
    }
  }
}
```

Never use the service role key in the web app. The `mcp_allow_delete` flag defaults to false. `delete_event` and `delete_task` refuse to run until the owner explicitly enables it.
