# BeeBoo MCP Server

Model Context Protocol (MCP) server for [BeeBoo](https://beeboo.ai) — Human-in-the-Loop Infrastructure for AI Agents.

This server enables AI agents like Claude, Cursor, and Windsurf to natively interact with BeeBoo's capabilities:
- **Knowledge Base** — Search, add, and list knowledge entries
- **Approvals** — Request and check human approval status
- **Work Requests** — Create and track work requests

## Quick Start

### 1. Get your API Key

Get your BeeBoo API key from [beeboo.ai/settings/api-keys](https://beeboo.ai/settings/api-keys).

Your key will look like: `bb_sk_xxxxxxxxxxxx`

### 2. Install & Configure

Choose your AI tool:

#### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "beeboo": {
      "command": "npx",
      "args": ["-y", "@beeboo/mcp-server"],
      "env": {
        "BEEBOO_API_KEY": "bb_sk_your_key_here"
      }
    }
  }
}
```

Then restart Claude Desktop.

#### Cursor

Add to your Cursor settings (`~/.cursor/mcp.json` or via Settings > MCP):

```json
{
  "mcpServers": {
    "beeboo": {
      "command": "npx",
      "args": ["-y", "@beeboo/mcp-server"],
      "env": {
        "BEEBOO_API_KEY": "bb_sk_your_key_here"
      }
    }
  }
}
```

#### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "beeboo": {
      "command": "npx",
      "args": ["-y", "@beeboo/mcp-server"],
      "env": {
        "BEEBOO_API_KEY": "bb_sk_your_key_here"
      }
    }
  }
}
```

#### Alternative: Local Install

```bash
npm install -g @beeboo/mcp-server
```

Then use `beeboo-mcp-server` instead of `npx @beeboo/mcp-server`.

## Available Tools

| Tool | Description |
|------|-------------|
| `beeboo_knowledge_search` | Search the knowledge base using semantic search |
| `beeboo_knowledge_add` | Add a new entry to the knowledge base |
| `beeboo_knowledge_list` | List all knowledge base entries |
| `beeboo_approval_request` | Request human approval for an action |
| `beeboo_approval_check` | Check status of an approval request |
| `beeboo_approvals_list` | List all approval requests (with optional filter) |
| `beeboo_request_create` | Create a work request for the team |
| `beeboo_requests_list` | List all work requests (with optional filter) |

## Usage Examples

Once configured, you can ask your AI assistant:

**Knowledge Base:**
- "Search the knowledge base for deployment procedures"
- "Add to the knowledge base: our AWS account ID is 123456789"
- "List all knowledge entries"

**Approvals:**
- "I need approval to delete the staging database"
- "Check if approval abc123 has been approved"
- "Show me all pending approvals"

**Work Requests:**
- "Create a high-priority request to update the SSL certificate"
- "List all open work requests"

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BEEBOO_API_KEY` | Yes | — | Your BeeBoo API key |
| `BEEBOO_API_URL` | No | `https://beeboo-api-625726065149.us-central1.run.app` | API endpoint |

## Testing

Test the server locally:

```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | BEEBOO_API_KEY=your_key node index.js

# Test a tool call
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"beeboo_knowledge_list","arguments":{}}}' | BEEBOO_API_KEY=your_key node index.js
```

## Troubleshooting

### "BEEBOO_API_KEY environment variable is required"
Make sure you've set the `BEEBOO_API_KEY` in your MCP configuration.

### Server not appearing in tools list
1. Restart your AI tool (Claude Desktop, Cursor, etc.)
2. Check the configuration file path is correct
3. Verify the JSON syntax is valid

### API errors
1. Check your API key is valid
2. Ensure you have network connectivity
3. Check the BeeBoo status at [status.beeboo.ai](https://status.beeboo.ai)

## Development

```bash
# Clone the repo
git clone https://github.com/beeboo-ai/beeboo.git
cd beeboo/mcp-server

# Install dependencies
npm install

# Run locally
BEEBOO_API_KEY=your_key npm start
```

## License

MIT
