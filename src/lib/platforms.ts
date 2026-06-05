import type {
  PlatformAdapter,
  PlatformId,
  RoutingState,
  UniversalAgent,
  UniversalCall,
  UniversalCustomer,
} from "@/types/call-center";

export const platformCatalog: Array<{
  id: PlatformId;
  name: string;
  color: string;
  api: string;
  fields: Record<string, string>;
  notes: string;
}> = [
  {
    id: "genesys",
    name: "Genesys",
    color: "#ff4f1f",
    api: "Genesys Cloud CX API",
    fields: {
      call_id: "conversationId",
      agent_id: "userId",
      customer: "externalContact",
      transcript: "analytics/conversations/details",
      routing: "routing/queues",
    },
    notes: "Enterprise routing, workforce quality, and open CX APIs.",
  },
  {
    id: "five9",
    name: "Five9",
    color: "#0077b6",
    api: "Five9 Cloud API",
    fields: {
      call_id: "callId",
      agent_id: "agentId",
      customer: "callerData",
      transcript: "recordings/transcript",
      routing: "supervisorWebService",
    },
    notes: "Strong CRM sync, cloud campaigns, and supervisor workflows.",
  },
  {
    id: "nice",
    name: "NICE CXone",
    color: "#6b2d8b",
    api: "NICE CXone API",
    fields: {
      call_id: "contactId",
      agent_id: "agentNo",
      customer: "ani / contactInfo",
      transcript: "contactHistory",
      routing: "skillId / campaignId",
    },
    notes: "Deep WFM, QA optimization, and analytics operations.",
  },
];

export const architectureLayers = [
  {
    id: "platforms",
    label: "Plataformas",
    desc: "Genesys, Five9, NICE, Avaya, Talkdesk, Amazon Connect",
    metric: "6 conectores",
  },
  {
    id: "adapters",
    label: "Adaptadores",
    desc: "Traduccion de APIs nativas al contrato universal",
    metric: "1 esquema",
  },
  {
    id: "schema",
    label: "Datos",
    desc: "Call, Agent, Customer, Transcript, Routing",
    metric: "5 objetos",
  },
  {
    id: "ai",
    label: "Inteligencia",
    desc: "Resumen, sentimiento, cumplimiento y siguiente accion",
    metric: "IA server-side",
  },
  {
    id: "ui",
    label: "Consola",
    desc: "Asistencia en vivo para agentes, supervisores y clientes",
    metric: "Vercel",
  },
];

export const schemaCatalog: Record<string, Record<string, string>> = {
  call: {
    call_id: "string UUID",
    session_id: "string",
    start_time: "ISO 8601 timestamp",
    duration_seconds: "integer",
    direction: "inbound | outbound",
    status: "active | held | ended | transferred",
    transcript: "TranscriptTurn[]",
    sentiment_score: "float -1.0 to 1.0",
    summary: "string",
  },
  agent: {
    agent_id: "string UUID",
    name: "string",
    email: "string",
    status: "available | busy | away | offline",
    skills: "string[]",
    current_call_id: "string | null",
    queue_id: "string",
  },
  customer: {
    customer_id: "string UUID",
    phone_number: "string E.164",
    name: "string | null",
    email: "string | null",
    account_id: "string | null",
    history: "CallSummary[]",
    crm_data: "object",
  },
  transcript: {
    speaker: "agent | customer",
    text: "string",
    timestamp: "ISO 8601 timestamp",
    confidence: "float 0.0 to 1.0",
    language: "BCP-47",
  },
  routing: {
    queue_id: "string",
    queue_name: "string",
    wait_time_seconds: "integer",
    priority: "integer 1-10",
    skills_required: "string[]",
    ivr_path: "string[]",
  },
  aiAssist: {
    suggested_response: "string",
    kb_articles: "Article[]",
    next_best_action: "string",
    escalation_flag: "boolean",
    compliance_alerts: "string[]",
    sentiment_score: "float -1.0 to 1.0",
  },
};

const toStringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toNumberValue = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export class GenesysAdapter implements PlatformAdapter {
  name = "Genesys";
  platform: PlatformId = "genesys";

  normalizeCall(raw: Record<string, unknown>): UniversalCall {
    return {
      call_id: toStringValue(raw.conversationId),
      session_id: toStringValue(raw.sessionId),
      start_time: toStringValue(raw.startTime),
      end_time: toStringValue(raw.endTime) || undefined,
      duration_seconds: toNumberValue(raw.durationSeconds),
      direction: raw.direction === "outbound" ? "outbound" : "inbound",
      status: raw.state === "held" || raw.state === "ended" || raw.state === "transferred" ? raw.state : "active",
      transcript: [],
      sentiment_score: toNumberValue(raw.sentimentScore),
      summary: toStringValue(raw.summary),
    };
  }

  normalizeAgent(raw: Record<string, unknown>): UniversalAgent {
    return {
      agent_id: toStringValue(raw.userId),
      name: toStringValue(raw.name),
      email: toStringValue(raw.email),
      status: raw.status === "available" || raw.status === "away" || raw.status === "offline" ? raw.status : "busy",
      skills: toStringArray(raw.skills),
      current_call_id: toStringValue(raw.currentCallId) || null,
      queue_id: toStringValue(raw.queueId),
    };
  }

  normalizeCustomer(raw: Record<string, unknown>): UniversalCustomer {
    return {
      customer_id: toStringValue(raw.id),
      phone_number: toStringValue(raw.phoneNumber),
      name: toStringValue(raw.name) || null,
      email: toStringValue(raw.email) || null,
      account_id: toStringValue(raw.accountId) || null,
      history: [],
      crm_data: typeof raw.customFields === "object" && raw.customFields !== null ? raw.customFields as Record<string, unknown> : {},
    };
  }
}

export class Five9Adapter extends GenesysAdapter {
  name = "Five9";
  platform: PlatformId = "five9";

  normalizeCall(raw: Record<string, unknown>): UniversalCall {
    return {
      ...super.normalizeCall({
        conversationId: raw.callId,
        sessionId: raw.sessionId,
        startTime: raw.startTimestamp,
        durationSeconds: raw.talkTime,
        direction: raw.type,
        state: raw.status,
        sentimentScore: raw.sentiment,
        summary: raw.notes,
      }),
      transcript: [],
    };
  }

  normalizeAgent(raw: Record<string, unknown>): UniversalAgent {
    return super.normalizeAgent({
      userId: raw.agentId,
      name: raw.agentName,
      email: raw.agentEmail,
      status: raw.agentState,
      skills: raw.skillNames,
      currentCallId: raw.callId,
      queueId: raw.campaignId,
    });
  }
}

export class NiceAdapter extends GenesysAdapter {
  name = "NICE CXone";
  platform: PlatformId = "nice";

  normalizeCall(raw: Record<string, unknown>): UniversalCall {
    return super.normalizeCall({
      conversationId: raw.contactId,
      sessionId: raw.masterContactId,
      startTime: raw.startDate,
      durationSeconds: raw.duration,
      direction: raw.isOutbound === true ? "outbound" : "inbound",
      state: raw.contactState,
      sentimentScore: raw.sentiment,
      summary: raw.dispositionNotes,
    });
  }

  normalizeAgent(raw: Record<string, unknown>): UniversalAgent {
    return super.normalizeAgent({
      userId: raw.agentNo,
      name: raw.agentName,
      email: raw.emailAddress,
      status: raw.availability,
      skills: raw.skills,
      currentCallId: raw.contactId,
      queueId: raw.skillId,
    });
  }
}

export const adapters: Record<PlatformId, PlatformAdapter> = {
  genesys: new GenesysAdapter(),
  five9: new Five9Adapter(),
  nice: new NiceAdapter(),
};

export function routingHealth(routing: RoutingState) {
  if (routing.priority >= 8 || routing.wait_time_seconds > 180) return "critical";
  if (routing.priority >= 6 || routing.wait_time_seconds > 90) return "watch";
  return "stable";
}
