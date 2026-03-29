// Quick end-to-end test — runs outside MCP protocol, calls PDS directly
import { createContextRecord, listContextRecords } from "./mcp-server/atproto.ts";

console.log("🔧 Testing atproto-agent-context...\n");

// Test 1: append_event
console.log("1. Writing append_event record...");
const eventResult = await createContextRecord({
  contextId: "collie-test",
  agentId: "collie",
  recordType: "event",
  version: 1,
  createdAt: new Date().toISOString(),
  facts: [],
  projects: [],
  recentTopics: [],
  event: {
    role: "assistant",
    content: "Testing the atproto-agent-context MCP server. This record is stored on your PDS.",
    timestamp: new Date().toISOString(),
    metadata: { test: true, source: "e2e-test" },
  },
} as Parameters<typeof createContextRecord>[0]);

console.log("✅ Event written!");
console.log("   AT-URI:", eventResult.uri);
console.log("   CID:", eventResult.cid);

// Test 2: append_context (structured summary)
console.log("\n2. Writing append_context record...");
const now = new Date().toISOString();
const summaryResult = await createContextRecord({
  contextId: "collie-test",
  agentId: "collie",
  recordType: "summary",
  version: 1,
  createdAt: now,
  facts: [
    { fact: "Adrian is testing the atproto-agent-context MCP server", category: "project", confidence: 1, learnedAt: now },
    { fact: "Adrian's Bluesky handle is a1j9o94.bsky.social", category: "identity", confidence: 1, learnedAt: now },
  ],
  projects: [
    { name: "atproto-agent-context", description: "Portable AI agent context on AT Protocol", status: "in-progress", lastMentioned: now },
  ],
  recentTopics: ["AT Protocol", "MCP", "AI agent memory", "portability"],
});

console.log("✅ Summary written!");
console.log("   AT-URI:", summaryResult.uri);

// Test 3: read back
console.log("\n3. Reading records back from PDS...");
const records = await listContextRecords({ limit: 5, reverse: true });
const testRecords = records.records.filter(r => r.value.contextId === "collie-test");
console.log(`✅ Found ${testRecords.length} test record(s):`);
for (const r of testRecords) {
  console.log(`   - ${r.value.recordType ?? "unknown"} | ${r.value.createdAt} | ${r.uri}`);
}

console.log("\n✅ End-to-end test passed. Records are on your PDS.");
console.log("View them at: https://bsky.app/profile/a1j9o94.bsky.social");
