/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import Button from "../../shared/components/ui/button/Button";
import type {
  WeeklyCloseApprovalRequest,
  WeeklyCloseResponse,
} from "../../shared/types/weeklyClose";

interface WeeklyClosePendingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

function DivergenceBadge({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-xs text-gray-400">—</span>;
  const positive = diff > 0;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
      positive
        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
    }`}>
      {positive ? "+" : ""}{diff}
    </span>
  );
}

const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";
const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] " +
  "px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:outline-none resize-none " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-colors";

const WeeklyClosePendingPanel: React.FC<WeeklyClosePendingPanelProps> = ({
  isOpen, onClose, onResolved,
}) => {
  const [pending, setPending]   = useState<WeeklyCloseResponse[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [selected, setSelected] = useState<WeeklyCloseResponse | null>(null);
  const [actionObs, setActionObs] = useState("");
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<WeeklyCloseResponse[]>(
        `${API_ENDPOINTS.weeklyClose}/pending`
      );
      setPending(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pending closes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOpen) { load(); setSelected(null); setActionObs(""); } }, [isOpen, load]);

  const doAction = async (action: "approve" | "reject") => {
    if (!selected) return;
    setActioning(true);
    setError(null);
    try {
      const body: WeeklyCloseApprovalRequest = { obs: actionObs.trim() || undefined };
      await authFetch<WeeklyCloseResponse>(
        `${API_ENDPOINTS.weeklyClose}/${selected.id}/${action}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      await load();
      setSelected(null);
      setActionObs("");
      onResolved?.();
    } catch (e: any) {
      setError(e?.message ?? `Failed to ${action}`);
    } finally {
      setActioning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#21262d] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔍</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Pending Closes</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Review and approve weekly inventory counts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10">
              <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"/>
              </svg>
            </div>
          )}

          {!loading && pending.length === 0 && !error && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-3xl">✓</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No pending closes</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">All inventory counts have been reviewed.</p>
            </div>
          )}

          {!loading && pending.map((close) => {
            const isSelected = selected?.id === close.id;
            return (
              <div
                key={close.id}
                className={`rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? "border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-500/5"
                    : "border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#0d1117] hover:border-gray-200 dark:hover:border-[#444c56]"
                }`}
                onClick={() => setSelected(isSelected ? null : close)}
              >
                {/* Close summary */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center text-sm">⏳</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {close.region_code} — Close #{close.id}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {close.week_start} → {close.week_end} · by {close.submitted_by}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right shrink-0">
                    {close.divergent_items > 0 ? (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {close.divergent_items} divergence{close.divergent_items > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">No divergences</span>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="border-t border-gray-100 dark:border-[#30363d] px-4 pb-4 pt-3 space-y-3">
                    {/* Items table */}
                    <div>
                      <div className="grid grid-cols-[1fr_80px_90px_70px] gap-2 px-2 py-1 rounded text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-white/5">
                        <span>Supply</span>
                        <span className="text-right">System</span>
                        <span className="text-right">Counted</span>
                        <span className="text-right">Diff</span>
                      </div>
                      <div className="space-y-1 mt-1.5 max-h-40 overflow-y-auto">
                        {(close.items ?? []).map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_80px_90px_70px] gap-2 px-2 py-1.5 rounded text-sm border border-transparent hover:border-gray-100 dark:hover:border-[#30363d]">
                            <span className="text-gray-700 dark:text-gray-300 text-xs">{item.supply_name}</span>
                            <span className="text-right text-xs font-mono text-gray-500">{item.expected_quantity}</span>
                            <span className="text-right text-xs font-mono text-gray-700 dark:text-gray-200">{item.counted_quantity}</span>
                            <div className="flex justify-end"><DivergenceBadge diff={item.divergence} /></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {close.obs && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">Note: {close.obs}</p>
                    )}

                    {/* Action area */}
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className={labelCls}>Supervisor note <span className="text-gray-300 dark:text-gray-600 font-normal normal-case">(optional)</span></label>
                        <textarea
                          rows={2}
                          className={inputCls}
                          placeholder="Add a note for the submitter…"
                          value={actionObs}
                          onChange={(e) => setActionObs(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); doAction("reject"); }}
                          disabled={actioning}
                          className="flex-1 !text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-500/30 hover:!bg-red-50 dark:hover:!bg-red-500/10"
                        >
                          {actioning ? "…" : "✗ Reject"}
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => { e.stopPropagation(); doAction("approve"); }}
                          disabled={actioning}
                          className="flex-1"
                        >
                          {actioning ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"/>
                              </svg>
                              Approving…
                            </span>
                          ) : "✓ Approve"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyClosePendingPanel;
