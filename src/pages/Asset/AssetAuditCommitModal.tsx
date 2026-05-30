import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Asset, AssetAuditResult } from "../../shared/types/asset.ts";

interface Props {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

type Step = "confirm" | "result";

export default function AssetAuditCommitModal({ isOpen, asset, onClose, onSaved }: Props) {
  const [step,    setStep]    = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [result,  setResult]  = useState<AssetAuditResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("confirm");
      setLoading(false);
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  const handleCommit = async () => {
    if (!asset) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/audit-commit`, {
        method: "POST",
      });
      setResult(data as AssetAuditResult);
      setStep("result");
      if ((data as AssetAuditResult).valid) {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Audit commit failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onClose()} className="max-w-[500px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

        {/* Header */}
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">🔍 Audit Commit</h4>
          {asset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Asset:{" "}
              <span className="font-mono font-medium text-gray-700 dark:text-gray-200">
                {asset.asset_tag}
              </span>
              {asset.model && ` — ${asset.model}`}
            </p>
          )}
        </div>

        {/* ── Step: confirm ─────────────────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will validate all required fields and check for duplicate asset tags and serial
              numbers. If the asset passes all checks, an{" "}
              <span className="font-semibold text-gray-800 dark:text-white">AUDIT_VERIFIED</span>{" "}
              event will be permanently recorded in the audit trail.
            </p>

            {/* Asset summary */}
            {asset && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                <Row label="Tag"    value={asset.asset_tag} mono />
                <Row label="Type"   value={asset.asset_type} />
                <Row label="Serial" value={asset.serial_number ?? "—"} mono />
                <Row label="Region" value={asset.current_region_code ?? "—"} />
                <Row label="Status" value={asset.status} />
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button size="sm" type="button" onClick={handleCommit} disabled={loading}>
                {loading ? "Validating…" : "Run Audit"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: result ──────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-5">
            {result.valid ? (
              <div className="rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 p-4 flex items-start gap-3">
                <span className="text-2xl leading-none">✅</span>
                <div>
                  <p className="font-semibold text-success-700 dark:text-success-400">
                    Audit passed
                  </p>
                  <p className="text-sm text-success-600 dark:text-success-300 mt-0.5">
                    All fields are valid. An <strong>AUDIT_VERIFIED</strong> event has been
                    recorded in the audit trail.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 p-4 flex items-start gap-3">
                  <span className="text-2xl leading-none">❌</span>
                  <div>
                    <p className="font-semibold text-error-700 dark:text-error-400">
                      Audit failed — {result.errors.length} issue{result.errors.length !== 1 ? "s" : ""} found
                    </p>
                    <p className="text-sm text-error-600 dark:text-error-300 mt-0.5">
                      No event was recorded. Fix the issues below and try again.
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {result.errors.map((err, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-error-700 dark:text-error-400 bg-error-50 dark:bg-error-500/10 rounded-lg px-3 py-2"
                    >
                      <span className="mt-0.5 shrink-0">⚠</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant={result.valid ? "primary" : "outline"} onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-gray-800 dark:text-gray-100 text-sm ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
