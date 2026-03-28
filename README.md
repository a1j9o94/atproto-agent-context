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

## Status

🚧 Early — defining the spec. Contributions and discussion welcome.

## Structure

```
/lexicon          # atproto lexicon definitions (agent.context schema)
/mcp-server       # MCP server that reads/writes agent context to atproto PDS
/docs             # Spec, design decisions, prior art
/examples         # Example agent context records
```

## Roadmap

- [ ] Define minimal `agent.context` lexicon v0
- [ ] Build MCP server (TypeScript, atproto SDK)
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
