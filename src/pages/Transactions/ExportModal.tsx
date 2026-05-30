import React, { useState } from "react";
import Button from "../../shared/components/ui/button/Button";
import { authFetch, authFetchBlob } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { generateTransactionsPDF, EXPORT_COLUMNS } from "../../utils/pdfExport";
import type { TransactionFilters, ExportPayload, TransactionResponse } from "../../shared/types/transaction";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = "csv" | "xlsx" | "pdf";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TransactionFilters;
}

// ─── Format card data ─────────────────────────────────────────────────────────

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "csv",
    label: "CSV",
    desc: "Comma-separated, opens in any spreadsheet",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    id: "xlsx",
    label: "Excel",
    desc: "Native Excel format (.xlsx) with auto-sizing",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m9.75-3.75h-1.5" />
      </svg>
    ),
  },
  {
    id: "pdf",
    label: "PDF",
    desc: "Print-ready document with header and page numbers",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

// ─── Color tokens per format ──────────────────────────────────────────────────

const FORMAT_COLORS: Record<ExportFormat, { ring: string; icon: string; bg: string }> = {
  csv:  { ring: "ring-emerald-500", icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  xlsx: { ring: "ring-blue-500",    icon: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-500/10"       },
  pdf:  { ring: "ring-rose-500",    icon: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-50 dark:bg-rose-500/10"       },
};

// ─── Component ────────────────────────────────────────────────────────────────

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, filters }) => {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [checkedCols, setCheckedCols] = useState<Set<string>>(
    () => new Set(EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key))
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ── Column helpers ──

  const toggleCol = (key: string) => {
    setCheckedCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll  = () => setCheckedCols(new Set(EXPORT_COLUMNS.map((c) => c.key)));
  const clearAll   = () => setCheckedCols(new Set());
  const selectedKeys = EXPORT_COLUMNS.map((c) => c.key).filter((k) => checkedCols.has(k));

  // ── Build filter payload ──

  const buildPayload = (): ExportPayload => {
    const payload: ExportPayload = {};
    if (filters.startDate)  payload.startDate    = filters.startDate;
    if (filters.endDate)    payload.endDate      = filters.endDate;
    if (filters.supplyName) payload.nameSupply   = [filters.supplyName];
    if (filters.regionCode) payload.regionCodes  = [filters.regionCode];
    if (filters.typeEntry)  payload.typeEntry    = filters.typeEntry;
    if (filters.username)   payload.user         = filters.username;
    return payload;
  };

  // ── Export handlers ──

  const handleExport = async () => {
    if (selectedKeys.length === 0) {
      setError("Select at least one column.");
      return;
    }
    setError(null);
    setExporting(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      if (format === "pdf") {
        // Fetch data as JSON then generate PDF client-side
        const payload = buildPayload();
        const result = await authFetch<TransactionResponse[] | { content: TransactionResponse[] }>(
          `${API_ENDPOINTS.transaction}/finder`,
          { method: "POST", body: JSON.stringify(payload) }
        );

        const rows: TransactionResponse[] = Array.isArray(result)
          ? result
          : (result as { content: TransactionResponse[] })?.content ?? [];

        await generateTransactionsPDF(rows, selectedKeys, `consumption-report-${today}.pdf`);
      } else {
        // CSV / XLSX — use backend export endpoint
        const colsParam = selectedKeys.map((k) => `columns=${k}`).join("&");
        const url = `${API_ENDPOINTS.transaction}/export?format=${format}&${colsParam}`;

        const { blob, filename } = await authFetchBlob(url, {
          method: "POST",
          body: JSON.stringify(buildPayload()),
        });

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename || `consumption-report-${today}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#21262d] dark:bg-[#161b22]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Export Transactions
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Choose format and columns to include
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-6">

          {/* Format selection */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
              Format
            </p>
            <div className="grid grid-cols-3 gap-3">
              {FORMATS.map((f) => {
                const fc = FORMAT_COLORS[f.id];
                const selected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all",
                      selected
                        ? `border-current ${fc.ring} ring-1 ${fc.bg}`
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                    ].join(" ")}
                  >
                    <span className={selected ? fc.icon : "text-gray-400 dark:text-gray-500"}>
                      {f.icon}
                    </span>
                    <span className={`text-sm font-semibold ${selected ? fc.icon : "text-gray-600 dark:text-gray-300"}`}>
                      {f.label}
                    </span>
                    <span className="text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                      {f.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Columns
                <span className="ml-1.5 font-normal normal-case">
                  ({selectedKeys.length}/{EXPORT_COLUMNS.length} selected)
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:underline dark:text-gray-500"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EXPORT_COLUMNS.map((col) => {
                const checked = checkedCols.has(col.key);
                return (
                  <label
                    key={col.key}
                    className={[
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors select-none",
                      checked
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-500/10"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCol(col.key)}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <span
                      className={`text-sm ${
                        checked
                          ? "font-medium text-blue-700 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {col.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {selectedKeys.length === 0
              ? "No columns selected"
              : `${selectedKeys.length} column${selectedKeys.length > 1 ? "s" : ""} · ${format.toUpperCase()}`}
          </p>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExport}
              disabled={exporting || selectedKeys.length === 0}
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Generating…
                </span>
              ) : (
                `Export ${format.toUpperCase()}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
