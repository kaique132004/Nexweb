/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import Button from "../../shared/components/ui/button/Button";
import type {
  WeeklyClosePreviewItem,
  WeeklyClosePreviewResponse,
  WeeklyCloseResponse,
  WeeklyCloseSubmitRequest,
} from "../../shared/types/weeklyClose";

// ─── Region shape from /api/v2/region ────────────────────────────────────────
interface RegionOption {
  id: number;
  region_code: string;
  region_name: string;
}

// ─── User session ─────────────────────────────────────────────────────────────
function getUserSession() {
  try {
    return JSON.parse(sessionStorage.getItem("user-session") ?? "{}");
  } catch {
    return {};
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface WeeklyCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Step types ───────────────────────────────────────────────────────────────
type Step = "region" | "count" | "review" | "done";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] " +
  "px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:outline-none " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-colors";

const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";

function DivergenceBadge({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-xs text-gray-400">—</span>;
  const positive = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
        positive
          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
      }`}
    >
      {positive ? "+" : ""}{diff}
    </span>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "region", label: "Region" },
    { key: "count",  label: "Count" },
    { key: "review", label: "Review" },
    { key: "done",   label: "Done" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, idx) => {
        const active  = idx === currentIdx;
        const done    = idx < currentIdx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                done   ? "bg-brand-500 text-white"
                : active ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500"
              }`}>
                {done ? "✓" : idx + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                active ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
              }`}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-3.5 mx-1 transition-colors ${
                done ? "bg-brand-500" : "bg-gray-100 dark:bg-white/10"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const WeeklyCloseModal: React.FC<WeeklyCloseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const user = getUserSession();
  const isSupervisor = ["ROLE_SUPERVISOR","ROLE_MANAGER","ROLE_ADMIN","ROLE_MASTER","ROLE_DEVELOPER"]
    .includes(user?.role);

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep]         = useState<Step>("region");
  const [regions, setRegions]   = useState<RegionOption[]>([]);
  const [regionId, setRegionId] = useState<number | "">("");
  const [obs, setObs]           = useState("");

  const [preview, setPreview]   = useState<WeeklyClosePreviewResponse | null>(null);
  const [counts, setCounts]     = useState<Record<number, string>>({}); // supplyId → typed string
  const [errors, setErrors]     = useState<Record<number, string>>({});

  const [loading, setLoading]   = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<WeeklyCloseResponse | null>(null);

  // ── Load regions on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRegions(true);
    authFetch<RegionOption[] | { content: RegionOption[] }>(
      `${API_ENDPOINTS.region}?size=200`
    ).then((res) => {
      const list: RegionOption[] = Array.isArray(res) ? res : (res as any)?.content ?? [];
      // sort client-side to avoid backend Pageable sort issues
      list.sort((a, b) => a.region_code.localeCompare(b.region_code));
      setRegions(list);
    }).catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false));
  }, [isOpen]);

  // ── Reset when closed ──────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setTimeout(() => {
      setStep("region");
      setRegionId("");
      setObs("");
      setPreview(null);
      setCounts({});
      setErrors({});
      setError(null);
      setResult(null);
    }, 200);
  }, []);

  const handleClose = () => { onClose(); reset(); };

  // ── Step 1 → 2: load preview ──────────────────────────────────────────────
  const loadPreview = async () => {
    if (!regionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<WeeklyClosePreviewResponse>(
        `${API_ENDPOINTS.weeklyClose}/preview?regionId=${regionId}`
      );
      setPreview(data!);
      // Init counts with empty strings
      const init: Record<number, string> = {};
      data!.items.forEach((i) => { init[i.supply_id] = ""; });
      setCounts(init);
      setStep("count");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load region data");
    } finally {
      setLoading(false);
    }
  };

  // ── Validate counts ────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!preview) return false;
    const newErrors: Record<number, string> = {};
    preview.items.forEach((item) => {
      const val = counts[item.supply_id];
      if (val === "" || val === undefined) {
        newErrors[item.supply_id] = "Required";
      } else if (isNaN(Number(val)) || Number(val) < 0) {
        newErrors[item.supply_id] = "Must be ≥ 0";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 2 → 3: review ────────────────────────────────────────────────────
  const goToReview = () => { if (validate()) setStep("review"); };

  // ── Computed divergences ───────────────────────────────────────────────────
  const divergenceFor = (item: WeeklyClosePreviewItem) => {
    const counted = Number(counts[item.supply_id] ?? item.current_quantity);
    return counted - item.current_quantity;
  };

  const divergentCount = preview?.items.filter((i) => divergenceFor(i) !== 0).length ?? 0;

  // ── Step 3 → Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const payload: WeeklyCloseSubmitRequest = {
        region_id: preview.region_id,
        obs: obs.trim() || undefined,
        items: preview.items.map((i) => ({
          supply_id: i.supply_id,
          counted_quantity: Number(counts[i.supply_id] ?? i.current_quantity),
        })),
      };
      const res = await authFetch<WeeklyCloseResponse>(
        `${API_ENDPOINTS.weeklyClose}/submit`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      setResult(res!);
      setStep("done");
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit weekly close");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#21262d] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📦</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Close Count Week</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Weekly inventory reconciliation</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <StepIndicator step={step} />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2.5 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── STEP 1: Region ─────────────────────────────────────────── */}
          {step === "region" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Select Region</label>
                <select
                  className={inputCls}
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : "")}
                  disabled={loadingRegions}
                >
                  <option value="">{loadingRegions ? "Loading regions…" : "Choose a region"}</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.region_code} — {r.region_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Notes <span className="text-gray-300 dark:text-gray-600 font-normal normal-case">(optional)</span></label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Any relevant observations for this count…"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">How it works</p>
                <ol className="list-decimal ml-4 space-y-0.5 text-amber-700 dark:text-amber-400">
                  <li>You enter the physical count for each supply in the selected region.</li>
                  <li>The system compares it against the recorded stock and shows divergences.</li>
                  <li>A Supervisor reviews and approves — only then are stock adjustments applied.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ── STEP 2: Count ──────────────────────────────────────────── */}
          {step === "count" && preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {preview.region_code} — {preview.region_name}
                </span>
                <span>Week {preview.week_start} → {preview.week_end}</span>
              </div>

              {preview.has_pending_close && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
                  ⚠ This region already has a pending close this week (#{preview.pending_close_id}). Submitting a new one will fail if you don't wait for the previous to be resolved.
                </div>
              )}

              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_110px_90px] gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Supply</span>
                <span className="text-right">System qty</span>
                <span className="text-right">Physical count</span>
                <span className="text-right">Diff</span>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {preview.items.map((item) => {
                  const counted = counts[item.supply_id];
                  const diff = counted !== "" && counted !== undefined
                    ? Number(counted) - item.current_quantity
                    : null;
                  const isLow = item.current_quantity <= item.min_stock_alert;

                  return (
                    <div
                      key={item.supply_id}
                      className="grid grid-cols-[1fr_100px_110px_90px] gap-2 items-center px-3 py-2.5 rounded-lg border border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#0d1117]"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90 leading-tight">{item.supply_name}</p>
                        {isLow && (
                          <span className="text-[10px] text-orange-500 dark:text-orange-400">⚠ Low stock</span>
                        )}
                      </div>

                      <p className="text-sm text-right text-gray-600 dark:text-gray-400 font-mono">{item.current_quantity}</p>

                      <div className="flex flex-col items-end gap-0.5">
                        <input
                          type="number"
                          min={0}
                          className={`w-full text-right rounded-md border px-2 py-1 text-sm font-mono focus:outline-none transition-colors ${
                            errors[item.supply_id]
                              ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-500/10"
                              : "border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]"
                          } text-gray-800 dark:text-white/90 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10`}
                          placeholder="0"
                          value={counted ?? ""}
                          onChange={(e) => {
                            setCounts((p) => ({ ...p, [item.supply_id]: e.target.value }));
                            setErrors((p) => ({ ...p, [item.supply_id]: "" }));
                          }}
                        />
                        {errors[item.supply_id] && (
                          <span className="text-[10px] text-red-500">{errors[item.supply_id]}</span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        {diff !== null ? <DivergenceBadge diff={diff} /> : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ─────────────────────────────────────────── */}
          {step === "review" && preview && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total supplies",  value: preview.items.length },
                  { label: "Divergences",     value: divergentCount, alert: divergentCount > 0 },
                  { label: "Clean",           value: preview.items.length - divergentCount },
                ].map(({ label, value, alert }) => (
                  <div key={label} className={`rounded-xl border px-4 py-3 text-center ${
                    alert
                      ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10"
                      : "border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#0d1117]"
                  }`}>
                    <p className={`text-xl font-bold ${alert ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white/90"}`}>{value}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Divergent items highlight */}
              {divergentCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Divergences found</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {preview.items
                      .filter((i) => divergenceFor(i) !== 0)
                      .map((item) => {
                        const diff = divergenceFor(item);
                        return (
                          <div key={item.supply_id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{item.supply_name}</span>
                            <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                              <span>System: {item.current_quantity}</span>
                              <span>→</span>
                              <span>Count: {Number(counts[item.supply_id])}</span>
                              <DivergenceBadge diff={diff} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {divergentCount === 0 && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-4 py-3 text-center">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">✓ No divergences found</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">All counts match the system stock.</p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-[#30363d] px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Region:</span> {preview.region_code} — {preview.region_name}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Week:</span> {preview.week_start} → {preview.week_end}</p>
                {obs && <p><span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span> {obs}</p>}
                <p className="text-amber-600 dark:text-amber-400">⏳ A Supervisor must approve before any stock changes are applied.</p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ───────────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="text-5xl">✅</div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90 text-base">Count submitted!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Close <span className="font-mono text-brand-600 dark:text-brand-400">#{result.id}</span> is awaiting supervisor approval.
                </p>
              </div>

              <div className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-[#30363d] px-4 py-3 text-sm space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Region</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{result.region_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Supplies counted</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{result.total_items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Divergences</span>
                  <span className={`font-semibold ${result.divergent_items > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {result.divergent_items}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">PENDING APPROVAL</span>
                </div>
              </div>

              {isSupervisor && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  As a Supervisor, you can approve or reject pending closes in the <strong>Pending Closes</strong> panel.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-100 dark:border-[#21262d] shrink-0">
          {/* Left: back / cancel */}
          <div>
            {step === "count" && (
              <Button size="sm" variant="outline" onClick={() => setStep("region")}>← Back</Button>
            )}
            {step === "review" && (
              <Button size="sm" variant="outline" onClick={() => setStep("count")}>← Back</Button>
            )}
            {(step === "region" || step === "done") && (
              <Button size="sm" variant="outline" onClick={handleClose}>
                {step === "done" ? "Close" : "Cancel"}
              </Button>
            )}
          </div>

          {/* Right: primary action */}
          <div>
            {step === "region" && (
              <Button
                size="sm"
                variant="primary"
                onClick={loadPreview}
                disabled={!regionId || loading}
              >
                {loading ? "Loading…" : "Continue →"}
              </Button>
            )}

            {step === "count" && (
              <Button size="sm" variant="primary" onClick={goToReview}>
                Review →
              </Button>
            )}

            {step === "review" && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"/>
                    </svg>
                    Submitting…
                  </span>
                ) : "Submit for Approval"}
              </Button>
            )}

            {step === "done" && (
              <Button size="sm" variant="primary" onClick={() => { reset(); setTimeout(() => setStep("region"), 250); }}>
                New Count
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCloseModal;
