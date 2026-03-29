/** TypeScript types matching the ai.agent.context lexicon */

export interface Fact {
  fact: string;
  category?: string;
  confidence?: number;
  learnedAt: string;
}

export interface Project {
  name: string;
  description?: string;
  status?: string;
  lastMentioned?: string;
}

export interface Relationship {
  name: string;
  relationship?: string;
  notes?: string;
}

export interface CustomPreference {
  key: string;
  value: string;
}

export interface Preferences {
  communicationStyle?: string;
  responseLength?: string;
  custom?: CustomPreference[];
}

export interface EventPayload {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContextRecord {
  $type: "ai.agent.context";
  contextId: string;
  recordType?: "summary" | "event";  // "summary" for append_context, "event" for append_event
  createdAt: string;
  updatedAt?: string;
  agentId: string;
  version: number;
  preferences?: Preferences;
  facts?: Fact[];
  projects?: Project[];
  relationships?: Relationship[];
  recentTopics?: string[];
  event?: EventPayload;  // only present on recordType: "event"
}

export interface StoredRecord {
  uri: string;
  cid: string;
  value: AgentContextRecord;
}
