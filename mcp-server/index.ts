import { FastMCP } from "fastmcp";
import { z } from "zod";
import { createContextRecord, listContextRecords, listAllContextRecords } from "./atproto.js";

const server = new FastMCP({
  name: "atproto-agent-context",
  version: "0.1.0",
});

// ── append_context ──────────────────────────────────────────────────────────

server.addTool({
  name: "append_context",
  description:
    "Write a new context record to the user's AT Protocol PDS. Each call appends an immutable log entry.",
  parameters: z.object({
    contextId: z.string().describe("Unique identifier grouping related context entries"),
    agentId: z.string().describe("Identifier for the AI agent writing this context"),
    facts: z
      .array(
        z.object({
          fact: z.string(),
          category: z.string().optional(),
          confidence: z.number().min(0).max(1).optional(),
        })
      )
      .default([])
      .describe("Key facts learned about the user"),
    projects: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .default([])
      .describe("Active projects or topics"),
    recentTopics: z.array(z.string()).default([]).describe("Recent conversation topics"),
    preferences: z
      .object({
        communicationStyle: z.string().optional(),
        responseLength: z.string().optional(),
        custom: z
          .array(z.object({ key: z.string(), value: z.string() }))
          .optional(),
      })
      .optional()
      .describe("User preferences the agent has learned"),
  }),
  execute: async (args) => {
    const now = new Date().toISOString();
    const result = await createContextRecord({
      contextId: args.contextId,
      agentId: args.agentId,
      version: 1,
      createdAt: now,
      facts: args.facts.map((f) => ({ ...f, learnedAt: now })),
      projects: args.projects.map((p) => ({ ...p, lastMentioned: now })),
      recentTopics: args.recentTopics,
      preferences: args.preferences,
    });
    return JSON.stringify(result, null, 2);
  },
});

// ── get_context ─────────────────────────────────────────────────────────────

server.addTool({
  name: "get_context",
  description:
    "Read recent context records from the user's PDS, filtered by contextId.",
  parameters: z.object({
    contextId: z.string().describe("The contextId to filter by"),
    limit: z.number().min(1).max(100).default(10).describe("Max records to return"),
  }),
  execute: async (args) => {
    // Fetch records in reverse (newest first) and filter by contextId
    const allRecords: Awaited<ReturnType<typeof listContextRecords>>["records"] = [];
    let cursor: string | undefined;

    outer: do {
      const page = await listContextRecords({ limit: 100, cursor, reverse: true });
      for (const rec of page.records) {
        if (rec.value.contextId === args.contextId) {
          allRecords.push(rec);
          if (allRecords.length >= args.limit) break outer;
        }
      }
      cursor = page.cursor;
    } while (cursor);

    return JSON.stringify(allRecords, null, 2);
  },
});

// ── list_contexts ───────────────────────────────────────────────────────────

server.addTool({
  name: "list_contexts",
  description:
    "List all unique contextIds the user has stored on their PDS.",
  parameters: z.object({}),
  execute: async () => {
    const all = await listAllContextRecords();
    const ids = [...new Set(all.map((r) => r.value.contextId))];
    return JSON.stringify(ids, null, 2);
  },
});

// ── Start ───────────────────────────────────────────────────────────────────

server.start({ transportType: "stdio" });
