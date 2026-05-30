import { useEffect, useRef, useState } from "react";
import { AuthFetchError, authFetch } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Region } from "../../shared/types/region.ts";
import type { AssetImportResult, AssetImportItemResult } from "../../shared/types/asset.ts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type ImportSource = "SERVICENOW" | "GENERIC";
type Step = "form" | "result";

const STATUS_STYLE: Record<AssetImportItemResult["status"], string> = {
  IMPORTED: "text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-500/10",
  SKIPPED:  "text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-500/10",
  ERROR:    "text-error-700   dark:text-error-400   bg-error-50   dark:bg-error-500/10",
};

const STATUS_ICON: Record<AssetImportItemResult["status"], string> = {
  IMPORTED: "✅",
  SKIPPED:  "⏭",
  ERROR:    "❌",
};

export default function AssetImportModal({ isOpen, onClose, onSaved }: Props) {
  const [step,      setStep]      = useState<Step>("form");
  const [file,      setFile]      = useState<File | null>(null);
  const [source,    setSource]    = useState<ImportSource>("SERVICENOW");
  const [regionId,  setRegionId]  = useState<string>("");
  const [regions,   setRegions]   = useState<Region[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [result,    setResult]    = useState<AssetImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset ao abrir
  useEffect(() => {
    if (!isOpen) return;
    setStep("form");
    setFile(null);
    setSource("SERVICENOW");
    setRegionId("");
    setError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [isOpen]);

  // Carrega regiões
  useEffect(() => {
    if (!isOpen || regions.length > 0) return;
    authFetch<{ content: Region[] }>(`${API_ENDPOINTS.region}?size=200`)
      .then((data) => setRegions(data?.content ?? []))
      .catch(() => {/* silencia — user verá campo vazio */});
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file)     { setError("Select a JSON file."); return; }
    if (!regionId) { setError("Select the default region."); return; }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_ENDPOINTS.asset}/import?source=${source}&defaultRegionId=${regionId}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
        // Sem Content-Type — o browser define o boundary do multipart
      });

      if (res.status === 401) {
        sessionStorage.removeItem("userSession");
        window.location.href = "/signin";
        return;
      }

      const text = await res.text();
      const data = JSON.parse(text) as AssetImportResult;

      if (!res.ok) {
        const msg = (data as unknown as { message?: string }).message ?? `Error ${res.status}`;
        setError(msg);
        return;
      }

      setResult(data);
      setStep("result");
      if (data.imported > 0) onSaved();

    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Import failed. Check the file and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onClose()} className="max-w-[600px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

        {/* Header */}
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">📥 Import Assets from JSON</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bulk-import assets from a ServiceNow or NexSRV JSON export.
          </p>
        </div>

        {/* ── Step: form ────────────────────────────────────────── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Source system <span className="text-red-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as ImportSource)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="SERVICENOW">ServiceNow (alm_asset)</option>
                <option value="GENERIC">NexSRV Generic</option>
              </select>
              {source === "SERVICENOW" && (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Expects <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{ \"records\": [...] }"}</code> format exported from the ServiceNow Table API.
                </p>
              )}
            </div>

            {/* File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                JSON file <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 transition-colors hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-600"
              >
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white">{file.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Click to select a .json file</p>
                  )}
                  {file && (
                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
              />
            </div>

            {/* Default region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Default region <span className="text-red-500">*</span>
              </label>
              <select
                value={regionId}
                onChange={(e) => { setRegionId(e.target.value); setError(null); }}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-transparent dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select region —</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.region_code} — {r.region_name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                All imported assets will be placed in this region with status <strong>IN_STOCK</strong>.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={loading}>
                {loading ? "Importing…" : "Import"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Step: result ──────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-5">

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Imported" value={result.imported} color="success" />
              <Stat label="Skipped"  value={result.skipped}  color="warning" />
              <Stat label="Errors"   value={result.errors}   color={result.errors > 0 ? "error" : "gray"} />
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              {result.total_records} total records processed.
            </p>

            {/* Detail list */}
            {result.details.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {result.details.map((item, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-4 py-2.5 ${STATUS_STYLE[item.status]}`}>
                    <span className="text-base leading-5 shrink-0">{STATUS_ICON[item.status]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold truncate">{item.asset_tag}</p>
                      <p className="text-xs mt-0.5 opacity-80">{item.message}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide opacity-60">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
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

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400",
    warning: "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-400",
    error:   "bg-error-50   dark:bg-error-500/10   text-error-700   dark:text-error-400",
    gray:    "bg-gray-50    dark:bg-white/5         text-gray-500    dark:text-gray-400",
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colorMap[color] ?? colorMap.gray}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}
