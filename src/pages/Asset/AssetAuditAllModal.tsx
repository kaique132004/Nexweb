import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { AssetAuditAllResult, AssetAuditAllItemResult } from "../../shared/types/asset.ts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Step = "confirm" | "running" | "result";

export default function AssetAuditAllModal({ isOpen, onClose, onSaved }: Props) {
  const [step,    setStep]    = useState<Step>("confirm");
  const [error,   setError]   = useState<string | null>(null);
  const [result,  setResult]  = useState<AssetAuditAllResult | null>(null);

  useEffect(() => {
    if (isOpen) { setStep("confirm"); setError(null); setResult(null); }
  }, [isOpen]);

  const handleConfirm = async () => {
    setStep("running");
    setError(null);
    try {
      const data = await authFetch<AssetAuditAllResult>(
        `${API_ENDPOINTS.asset}/audit-all`,
        { method: "POST" }
      );
      setResult(data!);
      setStep("result");
      if (data!.passed > 0) onSaved();
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Audit failed. Please try again.");
      setStep("confirm");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => step !== "running" && onClose()} className="max-w-[560px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

        {/* Header */}
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">🔍 Audit All Assets</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Admin-only operation</p>
        </div>

        {/* ── Step: confirm ─────────────────────────────────────── */}
        {(step === "confirm") && (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 flex items-start gap-3">
              <span className="text-2xl leading-none">⚠️</span>
              <div className="text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  This will run a full audit on every active asset
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Assets that pass all validation checks will have an{" "}
                  <strong>AUDIT_VERIFIED</strong> event permanently recorded.
                  Assets that fail will appear in the results but will not be modified.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <Button size="sm" variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="button" onClick={handleConfirm}>
                Yes, Audit All
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: running ─────────────────────────────────────── */}
        {step === "running" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Running audit on all assets…</p>
          </div>
        )}

        {/* ── Step: result ──────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-5">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total"  value={result.total}  color="gray" />
              <StatCard label="Passed" value={result.passed} color="success" />
              <StatCard label="Failed" value={result.failed} color={result.failed > 0 ? "error" : "gray"} />
            </div>

            {/* Detail list (only failures + a few passes) */}
            {result.details.length > 0 && (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {result.failed > 0 ? "Failed assets" : "All assets passed ✅"}
                </p>

                {result.failed > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {result.details
                      .filter((d) => !d.valid)
                      .map((item) => (
                        <FailedRow key={item.asset_id} item={item} />
                      ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400",
    error:   "bg-error-50   dark:bg-error-500/10   text-error-700   dark:text-error-400",
    gray:    "bg-gray-50    dark:bg-white/5         text-gray-600    dark:text-gray-400",
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colorMap[color] ?? colorMap.gray}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

function FailedRow({ item }: { item: AssetAuditAllItemResult }) {
  return (
    <div className="px-4 py-3 bg-error-50 dark:bg-error-500/10">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">❌</span>
        <span className="font-mono text-xs font-semibold text-error-700 dark:text-error-400">
          {item.asset_tag}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">id={item.asset_id}</span>
      </div>
      <ul className="pl-6 space-y-0.5">
        {item.errors.map((e, i) => (
          <li key={i} className="text-xs text-error-600 dark:text-error-300">• {e}</li>
        ))}
      </ul>
    </div>
  );
}
