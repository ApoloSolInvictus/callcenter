import type {
  AiAssistResponse,
  AssistPolicy,
  PlatformId,
  RoutingState,
  TranscriptTurn,
  UniversalAgent,
  UniversalCall,
  UniversalCustomer,
} from "@/types/call-center";

export const transcriptSeed: TranscriptTurn[] = [
  {
    speaker: "agent",
    text: "Gracias por llamar a soporte premium. Mi nombre es Valeria. Con quien tengo el gusto?",
    timestamp: "2026-06-04T15:41:08.000Z",
    confidence: 0.98,
    language: "es-CR",
  },
  {
    speaker: "customer",
    text: "Soy Marco Rojas. Llevo dos dias sin poder entrar a mi cuenta y ya hice el pago.",
    timestamp: "2026-06-04T15:41:16.000Z",
    confidence: 0.95,
    language: "es-CR",
  },
  {
    speaker: "agent",
    text: "Gracias, Marco. Ya estoy revisando el estado de cuenta y validando el ultimo pago.",
    timestamp: "2026-06-04T15:41:28.000Z",
    confidence: 0.97,
    language: "es-CR",
  },
  {
    speaker: "customer",
    text: "Necesito resolverlo hoy porque mi equipo depende de esa plataforma para atender clientes.",
    timestamp: "2026-06-04T15:41:37.000Z",
    confidence: 0.94,
    language: "es-CR",
  },
  {
    speaker: "agent",
    text: "Entiendo la urgencia. Veo un bloqueo automatico por intento de acceso desde una IP nueva.",
    timestamp: "2026-06-04T15:42:02.000Z",
    confidence: 0.97,
    language: "es-CR",
  },
  {
    speaker: "customer",
    text: "Eso fue mi oficina nueva. Ya envie los documentos. No quiero que me vuelvan a pedir todo.",
    timestamp: "2026-06-04T15:42:18.000Z",
    confidence: 0.92,
    language: "es-CR",
  },
  {
    speaker: "agent",
    text: "Voy a revisar los documentos cargados y buscar la ruta mas rapida para reactivar el acceso.",
    timestamp: "2026-06-04T15:42:36.000Z",
    confidence: 0.96,
    language: "es-CR",
  },
];

export const callSeed: UniversalCall = {
  call_id: "0d3af3b3-7f17-490f-b0df-153942a834bd",
  session_id: "session-ccai-2198",
  start_time: "2026-06-04T15:41:08.000Z",
  duration_seconds: 134,
  direction: "inbound",
  status: "active",
  transcript: transcriptSeed.slice(0, 4),
  sentiment_score: -0.48,
  summary: "Cliente premium no puede acceder tras pago confirmado e IP nueva.",
};

export const agentSeed: UniversalAgent = {
  agent_id: "34a931df-9d3f-498c-9f83-bbc2d7783d13",
  name: "Valeria Monge",
  email: "valeria.monge@example.com",
  status: "busy",
  skills: ["premium", "billing", "identity"],
  current_call_id: callSeed.call_id,
  queue_id: "q-premium-support",
};

export const customerSeed: UniversalCustomer = {
  customer_id: "84c9ecb2-f4ca-453b-9d61-6395ce6ba1cc",
  phone_number: "+50640001234",
  name: "Marco Rojas",
  email: "marco.rojas@example.com",
  account_id: "acct-cr-4491",
  history: [
    {
      call_id: "prev-102",
      date: "2026-05-22",
      outcome: "resolved",
      summary: "Pago duplicado aplicado como credito a favor.",
    },
    {
      call_id: "prev-088",
      date: "2026-04-17",
      outcome: "follow-up",
      summary: "Solicitud de cambio de correo administrativo.",
    },
  ],
  crm_data: {
    plan: "Premium CX",
    arr: 42000,
    region: "Costa Rica",
    sla: "4h",
    risk: "medium",
    open_ticket: "TCK-88219",
  },
};

export const routingSeed: RoutingState = {
  queue_id: "q-premium-support",
  queue_name: "Premium Support",
  wait_time_seconds: 142,
  priority: 8,
  skills_required: ["billing", "identity", "spanish"],
  ivr_path: ["Soporte", "Cuenta", "Acceso bloqueado"],
};

export const defaultPolicy: AssistPolicy = {
  language: "es",
  sensitivity: 68,
  includeCompliance: true,
};

export const initialAssist: AiAssistResponse = {
  suggested_response:
    "Marco, ya identifique que el pago esta registrado y el bloqueo viene de seguridad por la IP nueva. Voy a validar sus documentos cargados y, si coinciden, activo la ruta de reactivacion prioritaria sin pedirle que repita el proceso.",
  kb_articles: [
    {
      title: "Reactivacion por IP nueva",
      url: "#reactivacion-ip-nueva",
      confidence: 0.91,
      excerpt: "Valida pago, documento ya cargado y evento de seguridad antes de solicitar nueva verificacion.",
    },
    {
      title: "SLA Premium para acceso bloqueado",
      url: "#sla-premium",
      confidence: 0.86,
      excerpt: "Casos premium con impacto operativo califican para prioridad alta y seguimiento supervisor.",
    },
  ],
  next_best_action: "Validar documentos existentes y abrir reactivacion prioritaria con ticket TCK-88219.",
  escalation_flag: true,
  compliance_alerts: ["No pedir datos completos de tarjeta.", "Confirmar identidad con datos parciales."],
  sentiment_score: -0.52,
  sentiment_label: "urgent",
  summary: "Cliente premium con acceso bloqueado por IP nueva, pago confirmado e impacto operativo hoy.",
  risk_factors: ["Impacto a equipo de atencion", "Segundo dia sin acceso", "Cliente premium"],
  recommended_disposition: "security_reactivation_priority",
  confidence: 0.88,
  source: "demo",
  model: null,
  generated_at: "2026-06-04T15:42:39.000Z",
};

export const platformMetrics: Record<PlatformId, Array<{ label: string; value: string; trend: string }>> = {
  genesys: [
    { label: "SLA", value: "94%", trend: "+3.2%" },
    { label: "ASA", value: "38s", trend: "-11s" },
    { label: "CSAT", value: "4.7", trend: "+0.2" },
  ],
  five9: [
    { label: "SLA", value: "91%", trend: "+1.4%" },
    { label: "ASA", value: "42s", trend: "-6s" },
    { label: "CSAT", value: "4.5", trend: "+0.1" },
  ],
  nice: [
    { label: "SLA", value: "96%", trend: "+4.0%" },
    { label: "ASA", value: "34s", trend: "-14s" },
    { label: "CSAT", value: "4.8", trend: "+0.3" },
  ],
};
