# atproto-agent-context

> Portable AI agent context, stored on the AT Protocol.

Your AI agents learn things about you that will be increasingly valuable — preferences, projects, decisions, relationships. Today that context is locked inside proprietary systems (OpenAI, Anthropic, whatever enterprise AI your company buys next year).

This project defines an open lexicon spec and MCP server for storing AI agent context on a user's AT Protocol Personal Data Server (PDS) — so your agent memory travels with *you*, not with the platform.

## The Idea

The [AT Protocol](https://atproto.com) (the open infrastructure behind [Bluesky](https://bsky.app)) gives every user a Personal Data Server — a portable, user-controlled data store. Apps read from and write to your PDS with your permission.

This project adds one new thing: an `agent.context` lexicon — a structured record type for AI agent memory that any agent or app can read/write with user authorization.

**What that enables:**
- Switch AI providers without losing your agent's knowledge of you
- See exactly what your agents know about you
- Edit or revoke agent memory at any time
- Any app can request access to your context — you control who gets it

## Quickstart

### 1. Install dependencies

```bash
bun install
```

### 2. Set environment variables

Copy the template and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `ATPROTO_HANDLE` | Your Bluesky handle (e.g. `yourname.bsky.social`) |
| `ATPROTO_APP_PASSWORD` | An [app password](https://bsky.app/settings/app-passwords) (not your account password) |
| `ATPROTO_PDS_URL` | PDS URL (default: `https://bsky.social`) |

### 3. Run the server

```bash
bun run mcp-server/index.ts
```

### 4. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atproto-agent-context": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/mcp-server/index.ts"],
      "env": {
        "ATPROTO_HANDLE": "yourname.bsky.social",
        "ATPROTO_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx",
        "ATPROTO_PDS_URL": "https://bsky.social"
      }
    }
  }
}
```

### 5. Configure in Cursor / other MCP clients

Add to your `.cursor/mcp.json` (or equivalent):

```json
{
  "mcpServers": {
    "atproto-agent-context": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/mcp-server/index.ts"],
      "env": {
        "ATPROTO_HANDLE": "yourname.bsky.social",
        "ATPROTO_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx",
        "ATPROTO_PDS_URL": "https://bsky.social"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|---|---|
| `append_context` | Write a new context record to the PDS (immutable append-only log entry) |
| `get_context` | Read recent context records filtered by `contextId` |
| `list_contexts` | List all unique `contextId` values stored on the PDS |

## Status

🚧 Early — defining the spec. Contributions and discussion welcome.

## Structure

```
/lexicon          # atproto lexicon definitions (agent.context schema)
/mcp-server       # MCP server (Bun + TypeScript + fastmcp)
/docs             # Spec, design decisions, prior art
/examples         # Example agent context records
```

## Roadmap

- [x] Define minimal `agent.context` lexicon v0
- [x] Build MCP server (TypeScript, atproto SDK)
- [ ] Prototype: agent using atproto PDS as memory store
- [ ] Permission model — how agents request/scope access
- [ ] Short-form video content on atproto (related: TikTok-on-atproto)

## Prior Art & Related Work

- [AT Protocol docs](https://atproto.com/docs)
- [Bluesky Lexicon reference](https://atproto.com/specs/lexicon)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — Anthropic's standard for agent tool access
- [W3C DIDs + Verifiable Credentials for AI Agents](https://arxiv.org/abs/2511.02841) — agent identity on decentralized infrastructure
- [New America OTI — AI Agent Memory & Privacy](https://www.newamerica.org/oti/briefs/ai-agents-and-memory/) — policy framing

## Contributing

Open an issue to discuss the lexicon spec. This is early and the design decisions are not settled.

## License

MIT
