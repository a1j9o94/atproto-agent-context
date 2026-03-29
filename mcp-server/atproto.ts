import { AtpAgent } from "@atproto/api";
import type { AgentContextRecord, StoredRecord } from "./types.js";

const COLLECTION = "ai.agent.context";

let agent: AtpAgent | null = null;

function getEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export async function getAgent(): Promise<AtpAgent> {
  if (agent) return agent;

  const service = getEnv("ATPROTO_PDS_URL", "https://bsky.social");
  agent = new AtpAgent({ service });

  try {
    await agent.login({
      identifier: getEnv("ATPROTO_HANDLE"),
      password: getEnv("ATPROTO_APP_PASSWORD"),
    });
  } catch (err) {
    agent = null;
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`AT Protocol auth failed: ${msg}. Check ATPROTO_HANDLE and ATPROTO_APP_PASSWORD.`);
  }

  return agent;
}

export async function createContextRecord(
  record: Omit<AgentContextRecord, "$type">
): Promise<{ uri: string; cid: string }> {
  const atpAgent = await getAgent();
  const did = atpAgent.session?.did;
  if (!did) throw new Error("Not authenticated — no session DID");

  const res = await atpAgent.com.atproto.repo.createRecord({
    repo: did,
    collection: COLLECTION,
    record: {
      $type: COLLECTION,
      ...record,
    },
  });

  return { uri: res.data.uri, cid: res.data.cid };
}

export async function listContextRecords(opts?: {
  limit?: number;
  cursor?: string;
  reverse?: boolean;
}): Promise<{ records: StoredRecord[]; cursor?: string }> {
  const atpAgent = await getAgent();
  const did = atpAgent.session?.did;
  if (!did) throw new Error("Not authenticated — no session DID");

  const res = await atpAgent.com.atproto.repo.listRecords({
    repo: did,
    collection: COLLECTION,
    limit: opts?.limit ?? 100,
    cursor: opts?.cursor,
    reverse: opts?.reverse,
  });

  const records = res.data.records.map((r) => ({
    uri: r.uri,
    cid: r.cid,
    value: r.value as unknown as AgentContextRecord,
  }));

  return { records, cursor: res.data.cursor };
}

/** Fetch all records, paginating through the full collection. */
export async function listAllContextRecords(): Promise<StoredRecord[]> {
  const all: StoredRecord[] = [];
  let cursor: string | undefined;

  do {
    const page = await listContextRecords({ limit: 100, cursor });
    all.push(...page.records);
    cursor = page.cursor;
  } while (cursor);

  return all;
}
