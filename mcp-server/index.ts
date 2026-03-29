import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createContextRecord, listContextRecords, listAllContextRecords } from "./atproto.js";

const server = new Server(
  { name: "atproto-agent-context", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "append_context",
    description: "Write a structured context summary to the user's AT Protocol PDS. Each call appends an immutable log entry.",
    inputSchema: {
      type: "object",
      properties: {
        contextId: { type: "string", description: "Unique identifier grouping related context entries (e.g. 'personal', 'work')" },
        agentId: { type: "string", description: "Identifier for the AI agent writing this context" },
        facts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fact: { type: "string" },
              category: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["fact"],
          },
          default: [],
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              status: { type: "string" },
            },
            required: ["name"],
          },
          default: [],
        },
        recentTopics: { type: "array", items: { type: "string" }, default: [] },
        preferences: {
          type: "object",
          properties: {
            communicationStyle: { type: "string" },
            responseLength: { type: "string" },
          },
        },
      },
      required: ["contextId", "agentId"],
    },
  },
  {
    name: "append_event",
    description: "Write a lightweight per-message event to the user's PDS. Call this after every exchange to build a real-time conversation log.",
    inputSchema: {
      type: "object",
      properties: {
        contextId: { type: "string", description: "The context this event belongs to" },
        agentId: { type: "string", description: "Identifier for the AI agent" },
        role: { type: "string", enum: ["user", "assistant"] },
        content: { type: "string", description: "The message content to log" },
        metadata: { type: "object", description: "Optional additional key-value metadata" },
      },
      required: ["contextId", "agentId", "role", "content"],
    },
  },
  {
    name: "get_context",
    description: "Read recent context records from the user's PDS, filtered by contextId.",
    inputSchema: {
      type: "object",
      properties: {
        contextId: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100, default: 10 },
      },
      required: ["contextId"],
    },
  },
  {
    name: "list_contexts",
    description: "List all unique contextIds the user has stored on their PDS.",
    inputSchema: { type: "object", properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

// ── Tool execution ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const now = new Date().toISOString();

  try {
    if (name === "append_context") {
      const parsed = z.object({
        contextId: z.string(),
        agentId: z.string(),
        facts: z.array(z.object({ fact: z.string(), category: z.string().optional(), confidence: z.number().optional() })).default([]),
        projects: z.array(z.object({ name: z.string(), description: z.string().optional(), status: z.string().optional() })).default([]),
        recentTopics: z.array(z.string()).default([]),
        preferences: z.object({ communicationStyle: z.string().optional(), responseLength: z.string().optional() }).optional(),
      }).parse(args);

      const result = await createContextRecord({
        contextId: parsed.contextId,
        agentId: parsed.agentId,
        recordType: "summary",
        version: 1,
        createdAt: now,
        facts: parsed.facts.map(f => ({ ...f, learnedAt: now })),
        projects: parsed.projects.map(p => ({ ...p, lastMentioned: now })),
        recentTopics: parsed.recentTopics,
        preferences: parsed.preferences,
      } as Parameters<typeof createContextRecord>[0]);

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "append_event") {
      const parsed = z.object({
        contextId: z.string(),
        agentId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        metadata: z.record(z.unknown()).optional(),
      }).parse(args);

      const result = await createContextRecord({
        contextId: parsed.contextId,
        agentId: parsed.agentId,
        recordType: "event",
        version: 1,
        createdAt: now,
        facts: [],
        projects: [],
        recentTopics: [],
        event: { role: parsed.role, content: parsed.content, timestamp: now, metadata: parsed.metadata },
      } as Parameters<typeof createContextRecord>[0]);

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "get_context") {
      const parsed = z.object({ contextId: z.string(), limit: z.number().default(10) }).parse(args);
      const allRecords: Awaited<ReturnType<typeof listContextRecords>>["records"] = [];
      let cursor: string | undefined;

      outer: do {
        const page = await listContextRecords({ limit: 100, cursor, reverse: true });
        for (const rec of page.records) {
          if (rec.value.contextId === parsed.contextId) {
            allRecords.push(rec);
            if (allRecords.length >= parsed.limit) break outer;
          }
        }
        cursor = page.cursor;
      } while (cursor);

      return { content: [{ type: "text", text: JSON.stringify(allRecords, null, 2) }] };
    }

    if (name === "list_contexts") {
      const all = await listAllContextRecords();
      const ids = [...new Set(all.map(r => r.value.contextId))];
      return { content: [{ type: "text", text: JSON.stringify(ids, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
