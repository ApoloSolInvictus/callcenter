"use client";

import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Database,
  GitBranch,
  Headphones,
  Layers3,
  Network,
  Pause,
  PhoneCall,
  Play,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  agentSeed,
  callSeed,
  customerSeed,
  defaultPolicy,
  initialAssist,
  platformMetrics,
  routingSeed,
  transcriptSeed,
} from "@/lib/mock-data";
import { architectureLayers, platformCatalog, routingHealth, schemaCatalog } from "@/lib/platforms";
import type { AiAssistResponse, AssistPolicy, PlatformId, UniversalCall } from "@/types/call-center";

type WorkspaceTab = "operations" | "architecture" | "schema" | "adapters";

const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof Activity }> = [
  { id: "operations", label: "Operacion", icon: Activity },
  { id: "architecture", label: "Arquitectura", icon: Layers3 },
  { id: "schema", label: "Esquema", icon: Database },
  { id: "adapters", label: "Adaptadores", icon: GitBranch },
];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function confidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function platformName(platform: PlatformId) {
  return platformCatalog.find((item) => item.id === platform)?.name ?? "Genesys";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("operations");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("genesys");
  const [activeSchema, setActiveSchema] = useState("call");
  const [call, setCall] = useState<UniversalCall>(callSeed);
  const [policy, setPolicy] = useState<AssistPolicy>(defaultPolicy);
  const [assist, setAssist] = useState<AiAssistResponse>(initialAssist);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const platform = platformCatalog.find((item) => item.id === activePlatform) ?? platformCatalog[0];
  const metrics = platformMetrics[activePlatform];
  const health = routingHealth(routingSeed);

  const requestPayload = useMemo(
    () => ({
      platform: activePlatform,
      call,
      agent: agentSeed,
      customer: customerSeed,
      routing: routingSeed,
      policy,
    }),
    [activePlatform, call, policy],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function analyzeCall() {
      setIsLoading(true);
      setLastError(null);

      try {
        const response = await fetch("/api/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        const data = (await response.json()) as AiAssistResponse & { error?: string };
        setAssist(data);
        setLastError(data.error ?? null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLastError(error instanceof Error ? error.message : "AI analysis failed.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    analyzeCall();

    return () => controller.abort();
  }, [requestPayload, refreshKey]);

  function advanceTranscript() {
    setCall((current) => {
      if (current.transcript.length >= transcriptSeed.length) {
        return {
          ...callSeed,
          transcript: transcriptSeed.slice(0, 4),
        };
      }

      return {
        ...current,
        transcript: transcriptSeed.slice(0, current.transcript.length + 1),
        duration_seconds: current.duration_seconds + 18,
        sentiment_score: Math.max(-0.86, current.sentiment_score - 0.04),
      };
    });
  }

  function resetCall() {
    setCall(callSeed);
    setAssist(initialAssist);
    setRefreshKey((value) => value + 1);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="eyebrow">Lux Aeterna</p>
            <h1>Call Center AI Command</h1>
          </div>
        </div>

        <div className="top-actions">
          <span className={`source-pill ${assist.source === "openai" ? "source-live" : "source-demo"}`}>
            {assist.source === "openai" ? "OpenAI" : "Demo"} {assist.model ? `- ${assist.model}` : ""}
          </span>
          <button
            className="icon-button"
            type="button"
            title={isLive ? "Pausar simulacion" : "Activar simulacion"}
            aria-label={isLive ? "Pausar simulacion" : "Activar simulacion"}
            onClick={() => setIsLive((value) => !value)}
          >
            {isLive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            title="Reanalizar llamada"
            aria-label="Reanalizar llamada"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <nav className="workspace-tabs" aria-label="Workspace">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "tab-button active" : "tab-button"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "operations" && (
        <section className="operations-grid" aria-label="Operacion en vivo">
          <aside className="panel stack-panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Plataforma</p>
                <h2>{platform.name}</h2>
              </div>
              <Network size={20} style={{ color: platform.color }} />
            </div>

            <div className="segmented-control" aria-label="Seleccionar plataforma">
              {platformCatalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={activePlatform === item.id ? "segment active" : "segment"}
                  onClick={() => setActivePlatform(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="metric-grid">
              {metrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.trend}</small>
                </div>
              ))}
            </div>

            <div className="call-card">
              <div className="call-state">
                <PhoneCall size={18} />
                <span>{call.status}</span>
              </div>
              <strong>{formatDuration(call.duration_seconds)}</strong>
              <small>{routingSeed.queue_name}</small>
            </div>

            <div className="customer-panel">
              <div className="avatar">
                <UserRound size={22} />
              </div>
              <div className="customer-copy">
                <strong>{customerSeed.name}</strong>
                <span>{customerSeed.account_id}</span>
                <span>{customerSeed.phone_number}</span>
              </div>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Plan</dt>
                <dd>{String(customerSeed.crm_data.plan)}</dd>
              </div>
              <div>
                <dt>SLA</dt>
                <dd>{String(customerSeed.crm_data.sla)}</dd>
              </div>
              <div>
                <dt>Ticket</dt>
                <dd>{String(customerSeed.crm_data.open_ticket)}</dd>
              </div>
            </dl>
          </aside>

          <section className="panel transcript-panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Llamada activa</p>
                <h2>{platformName(activePlatform)} / {call.direction}</h2>
              </div>
              <span className={`health-pill ${health}`}>
                <RadioTower size={15} />
                {health}
              </span>
            </div>

            <div className="transcript-list" aria-label="Transcripcion">
              {call.transcript.map((turn, index) => (
                <article key={`${turn.timestamp}-${index}`} className={`turn ${turn.speaker}`}>
                  <div className="turn-meta">
                    <span>{turn.speaker === "agent" ? agentSeed.name : customerSeed.name}</span>
                    <small>{confidence(turn.confidence)}</small>
                  </div>
                  <p>{turn.text}</p>
                </article>
              ))}
            </div>

            <div className="suggestion-strip">
              <div className="suggestion-icon">
                <Brain size={22} />
              </div>
              <div>
                <span className="eyebrow">Respuesta sugerida</span>
                <p>{assist.suggested_response}</p>
              </div>
            </div>

            <div className="control-row">
              <button className="primary-button" type="button" onClick={advanceTranscript}>
                <ChevronRight size={18} />
                Siguiente turno
              </button>
              <button className="secondary-button" type="button" onClick={resetCall}>
                <RefreshCw size={18} />
                Reiniciar
              </button>
              <span className="loading-text">{isLoading ? "Analizando..." : "Listo"}</span>
            </div>
          </section>

          <aside className="panel assist-panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">AI Assist</p>
                <h2>Decision en vivo</h2>
              </div>
              {assist.escalation_flag ? <AlertTriangle className="warn-icon" size={22} /> : <CheckCircle2 className="ok-icon" size={22} />}
            </div>

            <div className="risk-meter">
              <div>
                <span>Sentimiento</span>
                <strong>{assist.sentiment_label}</strong>
              </div>
              <div className="meter-track" aria-label="Sentiment score">
                <span style={{ width: `${Math.max(8, Math.min(100, (assist.sentiment_score + 1) * 50))}%` }} />
              </div>
              <small>{assist.sentiment_score.toFixed(2)} / confianza {confidence(assist.confidence)}</small>
            </div>

            <div className="next-action">
              <Clock3 size={18} />
              <p>{assist.next_best_action}</p>
            </div>

            <div className="article-list">
              <div className="mini-heading">
                <BookOpen size={16} />
                Articulos
              </div>
              {assist.kb_articles.map((article) => (
                <a className="article-item" href={article.url} key={article.title}>
                  <strong>{article.title}</strong>
                  <span>{article.excerpt}</span>
                  <small>{confidence(article.confidence)}</small>
                </a>
              ))}
            </div>

            <div className="alert-list">
              <div className="mini-heading">
                <ShieldCheck size={16} />
                Cumplimiento
              </div>
              {assist.compliance_alerts.length === 0 ? (
                <span className="empty-state">Sin alertas activas</span>
              ) : (
                assist.compliance_alerts.map((alert) => <span key={alert}>{alert}</span>)
              )}
            </div>

            <div className="policy-box">
              <label>
                <SlidersHorizontal size={16} />
                Sensibilidad
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={policy.sensitivity}
                  onChange={(event) =>
                    setPolicy((current) => ({
                      ...current,
                      sensitivity: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={policy.includeCompliance}
                  onChange={(event) =>
                    setPolicy((current) => ({
                      ...current,
                      includeCompliance: event.target.checked,
                    }))
                  }
                />
                Compliance
              </label>
              <select
                value={policy.language}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    language: event.target.value as AssistPolicy["language"],
                  }))
                }
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>

            {lastError && <p className="safe-error">{lastError}</p>}
          </aside>
        </section>
      )}

      {activeTab === "architecture" && (
        <section className="architecture-layout">
          <div className="panel architecture-panel">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Sistema</p>
                <h2>Flujo universal de datos</h2>
              </div>
              <Workflow size={22} />
            </div>

            <div className="layer-stack">
              {architectureLayers.map((layer, index) => (
                <article className="layer-row" key={layer.id}>
                  <span className="layer-index">{index + 1}</span>
                  <div>
                    <strong>{layer.label}</strong>
                    <p>{layer.desc}</p>
                  </div>
                  <small>{layer.metric}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="panel signal-panel">
            <Image
              src="/lux-aeterna-signal.svg"
              alt=""
              width={720}
              height={420}
              className="signal-asset"
              priority
            />
            <div className="signal-caption">
              <CircleGauge size={18} />
              <span>Realtime CX intelligence</span>
            </div>
          </div>
        </section>
      )}

      {activeTab === "schema" && (
        <section className="schema-layout">
          <div className="panel schema-picker">
            <p className="eyebrow">Contrato universal</p>
            <div className="schema-buttons">
              {Object.keys(schemaCatalog).map((key) => (
                <button
                  key={key}
                  className={activeSchema === key ? "schema-button active" : "schema-button"}
                  type="button"
                  onClick={() => setActiveSchema(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="panel schema-table">
            <div className="panel-title-row">
              <div>
                <p className="eyebrow">Objeto</p>
                <h2>{activeSchema}</h2>
              </div>
              <Database size={22} />
            </div>

            <div className="field-table">
              {Object.entries(schemaCatalog[activeSchema]).map(([field, type]) => (
                <div className="field-row" key={field}>
                  <strong>{field}</strong>
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "adapters" && (
        <section className="adapter-grid">
          {platformCatalog.map((item) => (
            <article className="panel adapter-card" key={item.id}>
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">{item.api}</p>
                  <h2>{item.name}</h2>
                </div>
                <Headphones size={22} style={{ color: item.color }} />
              </div>

              <p className="adapter-note">{item.notes}</p>

              <div className="mapping-list">
                {Object.entries(item.fields).map(([universal, native]) => (
                  <div key={universal} className="mapping-row">
                    <span>{universal}</span>
                    <ArrowRight size={14} />
                    <strong>{native}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
