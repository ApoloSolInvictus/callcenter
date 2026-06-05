import type { AiAssistRequest, AiAssistResponse, KbArticle, SentimentLabel } from "@/types/call-center";

export const aiAssistJsonSchema = {
  type: "object",
  properties: {
    suggested_response: {
      type: "string",
      description: "A concise agent response that can be said out loud to the customer.",
    },
    kb_articles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          confidence: { type: "number" },
          excerpt: { type: "string" },
        },
        required: ["title", "url", "confidence", "excerpt"],
        additionalProperties: false,
      },
    },
    next_best_action: { type: "string" },
    escalation_flag: { type: "boolean" },
    compliance_alerts: {
      type: "array",
      items: { type: "string" },
    },
    sentiment_score: { type: "number" },
    sentiment_label: {
      type: "string",
      enum: ["positive", "neutral", "negative", "urgent"],
    },
    summary: { type: "string" },
    risk_factors: {
      type: "array",
      items: { type: "string" },
    },
    recommended_disposition: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "suggested_response",
    "kb_articles",
    "next_best_action",
    "escalation_flag",
    "compliance_alerts",
    "sentiment_score",
    "sentiment_label",
    "summary",
    "risk_factors",
    "recommended_disposition",
    "confidence",
  ],
  additionalProperties: false,
} as const;

export function buildAssistInput(request: AiAssistRequest) {
  return {
    platform: request.platform,
    policy: request.policy,
    call: {
      ...request.call,
      transcript: request.call.transcript.slice(-12),
    },
    agent: request.agent,
    customer: request.customer,
    routing: request.routing,
  };
}

export const assistInstructions = [
  "You are Lux Aeterna, a real-time AI copilot for business call centers.",
  "Support agents with concise, compliant, customer-safe suggestions.",
  "Use the customer's language preference.",
  "Never invent account facts, balances, payments, or policy approvals.",
  "Escalate when operational impact, repeat contact, legal risk, fraud, or high frustration appears.",
  "Return only JSON that matches the provided schema.",
].join(" ");

function inferSentiment(text: string): { score: number; label: SentimentLabel } {
  const lower = text.toLowerCase();
  const urgentHits = ["hoy", "urgente", "depende", "dos dias", "bloqueado", "no quiero"].filter((word) =>
    lower.includes(word),
  ).length;
  const positiveHits = ["gracias", "perfecto", "resuelto", "excelente"].filter((word) => lower.includes(word)).length;

  if (urgentHits >= 3) return { score: -0.68, label: "urgent" };
  if (urgentHits >= 1) return { score: -0.42, label: "negative" };
  if (positiveHits >= 2) return { score: 0.45, label: "positive" };
  return { score: -0.05, label: "neutral" };
}

function buildArticles(es: boolean): KbArticle[] {
  return es
    ? [
        {
          title: "Reactivacion por IP nueva",
          url: "#reactivacion-ip-nueva",
          confidence: 0.89,
          excerpt: "Usar pago confirmado, documento existente y evento de seguridad para evitar friccion duplicada.",
        },
        {
          title: "SLA Premium para acceso bloqueado",
          url: "#sla-premium",
          confidence: 0.84,
          excerpt: "Prioridad alta cuando hay impacto operativo y cliente con plan premium.",
        },
      ]
    : [
        {
          title: "New IP reactivation",
          url: "#new-ip-reactivation",
          confidence: 0.89,
          excerpt: "Use confirmed payment, existing documents, and the security event before requesting new verification.",
        },
        {
          title: "Premium blocked-access SLA",
          url: "#premium-sla",
          confidence: 0.84,
          excerpt: "High priority applies when a premium customer has operational impact.",
        },
      ];
}

export function createFallbackAssist(request: AiAssistRequest): AiAssistResponse {
  const joined = request.call.transcript.map((turn) => turn.text).join(" ");
  const sentiment = inferSentiment(joined);
  const es = request.policy.language === "es";
  const highRisk = sentiment.label === "urgent" || request.routing.priority >= 8 || request.policy.sensitivity > 75;

  return {
    suggested_response: es
      ? "Marco, ya veo el pago registrado y el bloqueo parece venir de seguridad por la IP nueva. Voy a validar los documentos que ya envio y mover este caso por la ruta prioritaria para reactivar el acceso sin repetirle pasos."
      : "Marco, I can see the payment is registered and the block appears to come from the new IP security check. I will validate the documents already submitted and move this through the priority reactivation path.",
    kb_articles: buildArticles(es),
    next_best_action: es
      ? "Validar documentos existentes, confirmar evento de seguridad y abrir reactivacion prioritaria."
      : "Validate existing documents, confirm the security event, and open priority reactivation.",
    escalation_flag: highRisk,
    compliance_alerts: request.policy.includeCompliance
      ? es
        ? ["Confirmar identidad con datos parciales.", "No solicitar datos completos de tarjeta."]
        : ["Confirm identity with partial data.", "Do not request full card details."]
      : [],
    sentiment_score: sentiment.score,
    sentiment_label: sentiment.label,
    summary: es
      ? "Cliente premium con acceso bloqueado por IP nueva, pago confirmado e impacto operativo inmediato."
      : "Premium customer has blocked access after a new IP event, confirmed payment, and immediate operational impact.",
    risk_factors: es
      ? ["Impacto operativo", "Contacto repetido", "Cuenta premium"]
      : ["Operational impact", "Repeat contact", "Premium account"],
    recommended_disposition: "security_reactivation_priority",
    confidence: 0.81,
    source: "demo",
    model: null,
    generated_at: new Date().toISOString(),
  };
}

export function coerceAssistResponse(
  value: unknown,
  request: AiAssistRequest,
  model: string | null,
): AiAssistResponse {
  const fallback = createFallbackAssist(request);

  if (!value || typeof value !== "object") {
    return { ...fallback, source: model ? "openai" : "demo", model };
  }

  const record = value as Partial<AiAssistResponse>;

  return {
    suggested_response: typeof record.suggested_response === "string" ? record.suggested_response : fallback.suggested_response,
    kb_articles: Array.isArray(record.kb_articles) ? record.kb_articles.slice(0, 4) : fallback.kb_articles,
    next_best_action: typeof record.next_best_action === "string" ? record.next_best_action : fallback.next_best_action,
    escalation_flag: typeof record.escalation_flag === "boolean" ? record.escalation_flag : fallback.escalation_flag,
    compliance_alerts: Array.isArray(record.compliance_alerts)
      ? record.compliance_alerts.filter((item): item is string => typeof item === "string").slice(0, 4)
      : fallback.compliance_alerts,
    sentiment_score: typeof record.sentiment_score === "number" ? record.sentiment_score : fallback.sentiment_score,
    sentiment_label:
      record.sentiment_label === "positive" ||
      record.sentiment_label === "neutral" ||
      record.sentiment_label === "negative" ||
      record.sentiment_label === "urgent"
        ? record.sentiment_label
        : fallback.sentiment_label,
    summary: typeof record.summary === "string" ? record.summary : fallback.summary,
    risk_factors: Array.isArray(record.risk_factors)
      ? record.risk_factors.filter((item): item is string => typeof item === "string").slice(0, 5)
      : fallback.risk_factors,
    recommended_disposition:
      typeof record.recommended_disposition === "string"
        ? record.recommended_disposition
        : fallback.recommended_disposition,
    confidence: typeof record.confidence === "number" ? record.confidence : fallback.confidence,
    source: model ? "openai" : "demo",
    model,
    generated_at: new Date().toISOString(),
  };
}
