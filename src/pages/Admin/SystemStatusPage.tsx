import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import PageMeta from "../../shared/components/common/PageMeta";
import { authFetch } from "../../api/apiAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
  username: string;
}

interface ActuatorHealth {
  status: "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
}

interface ActuatorInfo {
  app?: { name?: string; version?: string; description?: string };
  build?: { artifact?: string; name?: string; time?: string; version?: string };
  git?: { branch?: string; commit?: { id?: string; time?: string } };
  [key: string]: unknown;
}

interface ActuatorMetricsMem {
  name: string;
  measurements: { statistic: string; value: number }[];
}

interface CorsConfig {
  allowed_hosts: string[];
  allowed_ports: number[];
  total_patterns: number;
}

interface RoleHierarchy {
  [role: string]: string[];
}

type FetchStatus = "idle" | "loading" | "ok" | "error";

interface CardState<T> {
  status: FetchStatus;
  data: T | null;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL as string;

function initialCard<T>(): CardState<T> {
  return { status: "idle", data: null, error: null };
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function StatusDot({ status }: { status: FetchStatus | string }) {
  const up = status === "UP" || status === "ok";
  const down = status === "DOWN" || status === "error" || status === "OUT_OF_SERVICE";
  const loading = status === "loading" || status === "UNKNOWN";

  const cls = up
    ? "bg-emerald-400"
    : down
      ? "bg-red-400"
      : loading
        ? "bg-yellow-400 animate-pulse"
        : "bg-gray-400";

  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
}

function SectionCard({
  title,
  icon,
  status,
  children,
}: {
  title: string;
  icon: string;
  status: FetchStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-[#30363d]">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</span>
        <span className="ml-auto">
          <StatusDot status={status} />
        </span>
      </div>
      <div className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-50 dark:border-[#2a2a2a] last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 dark:text-white/90 text-right break-all">{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 dark:bg-white/5 rounded-full" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-red-500 dark:text-red-400 py-2">⚠ {msg}</p>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SystemStatusPage() {
  // Role guard
  const raw = sessionStorage.getItem("user-session");
  const user: UserSession | null = raw ? JSON.parse(raw) : null;
  const allowed = user?.role === "ROLE_MASTER" || user?.role === "ROLE_MANAGER";

  const [health,    setHealth]    = useState<CardState<ActuatorHealth>>(initialCard());
  const [info,      setInfo]      = useState<CardState<ActuatorInfo>>(initialCard());
  const [memUsed,   setMemUsed]   = useState<CardState<ActuatorMetricsMem>>(initialCard());
  const [memMax,    setMemMax]    = useState<CardState<ActuatorMetricsMem>>(initialCard());
  const [cors,      setCors]      = useState<CardState<CorsConfig>>(initialCard());
  const [hierarchy, setHierarchy] = useState<CardState<RoleHierarchy>>(initialCard());
  const [rabbitmq,  setRabbitmq]  = useState<CardState<string>>(initialCard());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetch_ = useCallback(async <T,>(
    url: string,
    setter: React.Dispatch<React.SetStateAction<CardState<T>>>,
    transform?: (raw: unknown) => T,
  ) => {
    setter((p) => ({ ...p, status: "loading" }));
    try {
      const raw = await authFetch<T>(url);
      if (raw === null) {
        setter({ status: "error", data: null, error: "Empty response from server" });
        return;
      }
      const data = transform ? transform(raw) : (raw as T);
      setter({ status: "ok", data, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setter({ status: "error", data: null, error: msg });
    }
  }, []);

  const loadAll = useCallback(() => {
    fetch_(`${API_BASE}/actuator/health`,                       setHealth);
    fetch_(`${API_BASE}/actuator/info`,                         setInfo);
    fetch_(`${API_BASE}/actuator/metrics/jvm.memory.used`,      setMemUsed);
    fetch_(`${API_BASE}/actuator/metrics/jvm.memory.max`,       setMemMax);
    fetch_(`${API_BASE}/api/v2/system/web/cors/config`,         setCors);
    fetch_(`${API_BASE}/api/v2/system/web/hierarchy`,           setHierarchy);
    fetch_<string>(
      `${API_BASE}/api/v2/system/web/rabbitmq`,
      setRabbitmq,
      (raw) => String(raw),
    );
    setLastRefresh(new Date());
  }, [fetch_]);

  useEffect(() => {
    if (allowed) loadAll();
  }, [allowed, loadAll]);

  // auto-refresh every 30 s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, loadAll]);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  // ── derived values ─────────────────────────────────────────────────────────

  const healthStatus = health.status === "ok" ? health.data!.status : health.status;

  const memUsedVal = memUsed.data?.measurements.find((m) => m.statistic === "VALUE")?.value ?? null;
  const memMaxVal  = memMax.data?.measurements.find((m) => m.statistic === "VALUE")?.value ?? null;
  const memPct = memUsedVal && memMaxVal && memMaxVal > 0
    ? Math.round((memUsedVal / memMaxVal) * 100)
    : null;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta title="System Status | Nexventory" description="Admin system status dashboard" />
      <PageBreadcrumb pageTitle="System Status" />

      <div className="p-4 pb-10">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">System Status</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Live view of backend health &amp; configuration
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  autoRefresh
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400",
                ].join(" ")}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-gray-300 dark:bg-gray-600"}`} />
                Auto-refresh {autoRefresh ? "ON" : "OFF"}
              </button>

              <button
                onClick={loadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {lastRefresh && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-3">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}

          {/* Top summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Application",
                value: health.status === "ok"
                  ? health.data!.status
                  : health.status === "loading" ? "Checking…" : "Unreachable",
                color:
                  healthStatus === "UP" ? "text-emerald-600 dark:text-emerald-400"
                  : healthStatus === "DOWN" ? "text-red-500 dark:text-red-400"
                  : "text-yellow-500 dark:text-yellow-400",
              },
              {
                label: "RabbitMQ",
                value: rabbitmq.status === "ok"
                  ? rabbitmq.data ?? "OK"
                  : rabbitmq.status === "loading" ? "Checking…" : "Error",
                color:
                  rabbitmq.status === "ok" && rabbitmq.data === "OK"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : rabbitmq.status === "error"
                      ? "text-red-500 dark:text-red-400"
                      : "text-yellow-500 dark:text-yellow-400",
              },
              {
                label: "Heap Used",
                value: memUsedVal !== null ? fmtBytes(memUsedVal) : "—",
                color: "text-gray-800 dark:text-white/90",
              },
              {
                label: "Heap %",
                value: memPct !== null ? `${memPct}%` : "—",
                color:
                  memPct === null ? "text-gray-400"
                  : memPct > 85 ? "text-red-500 dark:text-red-400"
                  : memPct > 70 ? "text-yellow-500 dark:text-yellow-400"
                  : "text-emerald-600 dark:text-emerald-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#1e1e1e] px-4 py-3"
              >
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Grid of cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Health ── */}
            <SectionCard title="Actuator Health" icon="🏥" status={health.status}>
              {health.status === "loading" && <Skeleton />}
              {health.status === "error"   && <ErrorMsg msg={health.error!} />}
              {health.status === "ok" && health.data && (
                <div className="space-y-1">
                  <KV label="Overall Status" value={
                    <span className={
                      health.data.status === "UP" ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                    }>
                      {health.data.status}
                    </span>
                  } />
                  {health.data.components && Object.entries(health.data.components).map(([name, c]) => (
                    <KV key={name} label={name} value={
                      <span className={c.status === "UP" ? "text-emerald-600 dark:text-emerald-400" : "text-red-400"}>
                        {c.status}
                      </span>
                    } />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ── Build Info ── */}
            <SectionCard title="Build Info" icon="📦" status={info.status}>
              {info.status === "loading" && <Skeleton />}
              {info.status === "error"   && <ErrorMsg msg={info.error!} />}
              {info.status === "ok" && info.data && (
                <div className="space-y-1">
                  {info.data.app?.name      && <KV label="Name"        value={info.data.app.name} />}
                  {info.data.app?.version   && <KV label="Version"     value={info.data.app.version} />}
                  {info.data.build?.time    && <KV label="Build time"  value={new Date(info.data.build.time).toLocaleString()} />}
                  {info.data.git?.branch    && <KV label="Git branch"  value={info.data.git.branch} />}
                  {info.data.git?.commit?.id && <KV label="Commit"     value={String(info.data.git.commit.id).slice(0, 8)} />}
                  {info.data.git?.commit?.time && (
                    <KV label="Commit time" value={new Date(info.data.git.commit.time).toLocaleString()} />
                  )}
                  {!info.data.app && !info.data.build && !info.data.git && (
                    <p className="text-xs text-gray-400">No info data exposed.</p>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── Memory ── */}
            <SectionCard title="JVM Memory" icon="🧠" status={memUsed.status}>
              {(memUsed.status === "loading" || memMax.status === "loading") && <Skeleton />}
              {memUsed.status === "error" && <ErrorMsg msg={memUsed.error!} />}
              {memUsed.status === "ok" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    {memUsedVal !== null && <KV label="Heap used" value={fmtBytes(memUsedVal)} />}
                    {memMaxVal  !== null && <KV label="Heap max"  value={fmtBytes(memMaxVal)} />}
                  </div>
                  {memPct !== null && (
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>Usage</span>
                        <span>{memPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            memPct > 85 ? "bg-red-400"
                            : memPct > 70 ? "bg-yellow-400"
                            : "bg-emerald-400"
                          }`}
                          style={{ width: `${memPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ── RabbitMQ ── */}
            <SectionCard title="RabbitMQ" icon="🐇" status={rabbitmq.status}>
              {rabbitmq.status === "loading" && <Skeleton />}
              {rabbitmq.status === "error"   && <ErrorMsg msg={rabbitmq.error!} />}
              {rabbitmq.status === "ok" && (
                <div className="space-y-1">
                  <KV label="Status" value={
                    <span className={
                      rabbitmq.data === "OK"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }>
                      {rabbitmq.data}
                    </span>
                  } />
                </div>
              )}
            </SectionCard>

            {/* ── CORS Config ── */}
            <SectionCard title="CORS Configuration" icon="🔒" status={cors.status}>
              {cors.status === "loading" && <Skeleton />}
              {cors.status === "error"   && <ErrorMsg msg={cors.error!} />}
              {cors.status === "ok" && cors.data && (
                <div className="space-y-1">
                  <KV label="Total patterns" value={cors.data.total_patterns} />
                  <KV label="Allowed hosts"  value={
                    cors.data.allowed_hosts.length > 0
                      ? cors.data.allowed_hosts.join(", ")
                      : "None"
                  } />
                  <KV label="Allowed ports"  value={
                    cors.data.allowed_ports.length > 0
                      ? cors.data.allowed_ports.join(", ")
                      : "None"
                  } />
                </div>
              )}
            </SectionCard>

            {/* ── Role Hierarchy ── */}
            <SectionCard title="Role Hierarchy" icon="🎭" status={hierarchy.status}>
              {hierarchy.status === "loading" && <Skeleton />}
              {hierarchy.status === "error"   && <ErrorMsg msg={hierarchy.error!} />}
              {hierarchy.status === "ok" && hierarchy.data && (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(hierarchy.data).map(([role, reachable]) => (
                    <div key={role} className="py-1.5 border-b border-gray-50 dark:border-[#2a2a2a] last:border-0">
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-0.5">
                        {role.replace("ROLE_", "")}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        {Array.isArray(reachable) && reachable.length > 0
                          ? reachable.map((r) => r.replace("ROLE_", "")).join(" → ")
                          : "No subordinate roles"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

          </div>
        </div>
      </div>
    </>
  );
}
