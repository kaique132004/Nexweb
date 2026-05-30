/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import Button from "../../shared/components/ui/button/Button";
import type {
  AuditFrequency,
  RegionAuditConfigRequest,
  RegionAuditConfigResponse,
} from "../../shared/types/weeklyClose";

interface AuditConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: AuditFrequency; label: string; desc: string }[] = [
  { value: "WEEKLY",    label: "Weekly",    desc: "Every 7 days"  },
  { value: "BIWEEKLY",  label: "Bi-weekly", desc: "Every 14 days" },
  { value: "MONTHLY",   label: "Monthly",   desc: "Every 30 days" },
  { value: "QUARTERLY", label: "Quarterly", desc: "Every 90 days" },
  { value: "BIANNUAL",  label: "Bi-annual", desc: "Every 180 days"},
  { value: "ANNUAL",    label: "Annual",    desc: "Every 365 days"},
];

const labelCls =
  "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";
const inputCls =
  "w-full rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] " +
  "px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:outline-none " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-colors";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ cfg }: { cfg: RegionAuditConfigResponse }) {
  if (!cfg.enabled) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
        Disabled
      </span>
    );
  }
  if (cfg.overdue) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">
        {cfg.days_overdue != null && cfg.days_overdue > 0
          ? `${cfg.days_overdue}d overdue`
          : "Overdue"}
      </span>
    );
  }
  if (cfg.next_due_date) {
    const daysLeft = cfg.days_overdue != null ? -cfg.days_overdue : null;
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
        {daysLeft != null && daysLeft >= 0 ? `${daysLeft}d left` : "On track"}
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
      Never counted
    </span>
  );
}

// ─── Edit drawer (inline per row) ────────────────────────────────────────────

interface EditDrawerProps {
  cfg: RegionAuditConfigResponse;
  onSaved: (updated: RegionAuditConfigResponse) => void;
  onCancel: () => void;
}

function EditDrawer({ cfg, onSaved, onCancel }: EditDrawerProps) {
  const [frequency, setFrequency]   = useState<AuditFrequency>(cfg.frequency);
  const [enabled, setEnabled]       = useState(cfg.enabled);
  const [emails, setEmails]         = useState(cfg.notify_emails?.join(", ") ?? "");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: RegionAuditConfigRequest = {
        frequency,
        enabled,
        notify_emails: emails.trim() || undefined,
      };
      const updated = await authFetch<RegionAuditConfigResponse>(
        `${API_ENDPOINTS.auditConfig}/${cfg.region_id}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      if (updated) onSaved(updated);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-[#30363d] px-4 pb-4 pt-3 space-y-3 bg-gray-50/50 dark:bg-white/[0.02]">
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Frequency */}
      <div>
        <label className={labelCls}>Audit Frequency</label>
        <div className="grid grid-cols-3 gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFrequency(opt.value)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                frequency === opt.value
                  ? "border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400"
                  : "border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#444c56]"
              }`}
            >
              <span className="block text-xs font-semibold">{opt.label}</span>
              <span className="block text-[10px] opacity-60 mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notify emails */}
      <div>
        <label className={labelCls}>
          Notify Emails{" "}
          <span className="text-gray-300 dark:text-gray-600 font-normal normal-case">
            (optional — comma-separated; leave blank to use region users)
          </span>
        </label>
        <input
          type="text"
          className={inputCls}
          placeholder="supervisor@co.com, manager@co.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
      </div>

      {/* Enabled toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Email reminders {enabled ? "enabled" : "disabled"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={save} disabled={saving} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const AuditConfigModal: React.FC<AuditConfigModalProps> = ({ isOpen, onClose }) => {
  const [configs, setConfigs]   = useState<RegionAuditConfigResponse[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState<number | null>(null); // region_id being edited
  const [search, setSearch]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<RegionAuditConfigResponse[]>(API_ENDPOINTS.auditConfig);
      const sorted = (data ?? []).sort((a, b) =>
        a.region_code.localeCompare(b.region_code)
      );
      setConfigs(sorted);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load audit configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) { load(); setEditing(null); setSearch(""); }
  }, [isOpen, load]);

  const handleSaved = (updated: RegionAuditConfigResponse) => {
    setConfigs((prev) =>
      prev.map((c) => (c.region_id === updated.region_id ? updated : c))
    );
    setEditing(null);
  };

  const visible = configs.filter(
    (c) =>
      c.region_code.toLowerCase().includes(search.toLowerCase()) ||
      c.region_name.toLowerCase().includes(search.toLowerCase())
  );

  const overdueCount = configs.filter((c) => c.enabled && c.overdue).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#21262d] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Audit Configuration
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                Set the inventory count frequency and notification emails per region
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">
                {overdueCount} overdue
              </span>
            )}
            <button
              onClick={load}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-[#21262d] shrink-0">
          <input
            type="text"
            className={inputCls}
            placeholder="Search region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
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

          {!loading && visible.length === 0 && !error && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-3xl">📋</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No regions found</p>
            </div>
          )}

          {!loading && visible.map((cfg) => {
            const isEditing = editing === cfg.region_id;
            return (
              <div
                key={cfg.region_id}
                className={`rounded-xl border transition-colors ${
                  isEditing
                    ? "border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-500/5"
                    : cfg.enabled && cfg.overdue
                      ? "border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5"
                      : "border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#0d1117]"
                }`}
              >
                {/* Row */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  {/* Left: region info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm shrink-0">
                      🌍
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                        {cfg.region_code}
                        <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                          {cfg.region_name}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {cfg.frequency.charAt(0) + cfg.frequency.slice(1).toLowerCase().replace("_", "-")}
                        </span>
                        {cfg.last_count_date && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            · Last: {cfg.last_count_date}
                          </span>
                        )}
                        {cfg.next_due_date && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            · Due: {cfg.next_due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: status + edit */}
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge cfg={cfg} />
                    <button
                      onClick={() => setEditing(isEditing ? null : cfg.region_id)}
                      className="text-xs text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                      title={isEditing ? "Cancel edit" : "Edit config"}
                    >
                      {isEditing ? "✕" : "✏️"}
                    </button>
                  </div>
                </div>

                {/* Edit drawer */}
                {isEditing && (
                  <EditDrawer
                    cfg={cfg}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-[#21262d] shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            📧 Reminder emails are sent automatically on the due date. Daily overdue alerts continue until the count is completed.
            If no emails are set, notifications go to all users assigned to the region.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditConfigModal;
