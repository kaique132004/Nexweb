import React, { useState } from "react";
import { authFetch } from "../api/apiAuth";
import { API_ENDPOINTS } from "../api/endpoint";
import Button from "../shared/components/ui/button/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Impact  = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ReportType = "bug" | "suggestion";

interface FormState {
  description: string;
  impact: Impact;
  urgency: Urgency;
  errorLog: string;
  notifyEmails: string;   // comma-separated raw input
}

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVELS: { value: Impact; label: string; light: string; dark: string }[] = [
  { value: "LOW",      label: "Low",      light: "border-emerald-300 bg-emerald-50 text-emerald-700",        dark: "dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"  },
  { value: "MEDIUM",   label: "Medium",   light: "border-yellow-300  bg-yellow-50  text-yellow-700",         dark: "dark:border-yellow-700  dark:bg-yellow-500/10  dark:text-yellow-400"   },
  { value: "HIGH",     label: "High",     light: "border-orange-300  bg-orange-50  text-orange-700",         dark: "dark:border-orange-700  dark:bg-orange-500/10  dark:text-orange-400"   },
  { value: "CRITICAL", label: "Critical", light: "border-red-300     bg-red-50     text-red-700",            dark: "dark:border-red-700     dark:bg-red-500/10     dark:text-red-400"      },
];

const idleCls =
  "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-gray-400 dark:hover:border-[#444c56]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const labelCls =
  "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide";

const textareaCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-[#30363d] dark:bg-[#0d1117] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700 resize-none";

// ─── Component ────────────────────────────────────────────────────────────────

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [type, setType]     = useState<ReportType>("bug");
  const [form, setForm]     = useState<FormState>({
    description:   "",
    impact:        "MEDIUM",
    urgency:       "MEDIUM",
    errorLog:      "",
    notifyEmails:  "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  if (!isOpen) return null;

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleClose = () => {
    onClose();
    // reset after animation
    setTimeout(() => {
      setForm({ description: "", impact: "MEDIUM", urgency: "MEDIUM", errorLog: "", notifyEmails: "" });
      setType("bug");
      setShowAdvanced(false);
      setSuccess(false);
      setError(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const emails = form.notifyEmails
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        description:  form.description.trim(),
        impact:       type === "suggestion" ? "LOW"    : form.impact,
        urgency:      type === "suggestion" ? "LOW"    : form.urgency,
        errorLog:     form.errorLog.trim() || undefined,
        endpoint:     window.location.pathname,
        occurredAt:   new Date().toISOString(),
        notifyEmails: emails.length ? emails : undefined,
        meta: { type, userAgent: navigator.userAgent.slice(0, 120) },
      };

      const base = API_ENDPOINTS.auth.replace(/\/api\/v2\/auth$/, "");
      await authFetch(`${base}/api/v2/bug-reports`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#21262d] dark:bg-[#161b22]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#21262d]">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {type === "bug" ? "🐛" : "💡"}
            </span>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {type === "bug" ? "Report a Bug" : "Send a Suggestion"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <div className="text-4xl">✅</div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {type === "bug" ? "Bug report sent!" : "Suggestion sent!"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thanks for your feedback. The team has been notified.
            </p>
            <Button size="sm" variant="outline" onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 space-y-4">

              {/* Type toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-[#30363d] p-0.5 bg-gray-50 dark:bg-[#0d1117] gap-0.5">
                {(["bug", "suggestion"] as ReportType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={[
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                      type === t
                        ? "bg-white dark:bg-[#161b22] text-gray-800 dark:text-white/90 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                    ].join(" ")}
                  >
                    {t === "bug" ? "🐛 Bug Report" : "💡 Suggestion"}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>
                  {type === "bug" ? "What went wrong?" : "Your idea"}
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <textarea
                  rows={4}
                  className={textareaCls}
                  placeholder={
                    type === "bug"
                      ? "Describe what happened, what you expected, and steps to reproduce…"
                      : "Share your idea or improvement suggestion…"
                  }
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Impact + Urgency — only for bugs */}
              {type === "bug" && (
                <div className="grid grid-cols-2 gap-4">
                  {(["impact", "urgency"] as const).map((field) => (
                    <div key={field}>
                      <label className={labelCls}>{field}</label>
                      <div className="flex flex-col gap-1">
                        {LEVELS.map((lvl) => {
                          const selected = form[field] === lvl.value;
                          return (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, [field]: lvl.value }))}
                              className={[
                                "w-full text-left px-2.5 py-1 rounded-md border text-xs font-medium transition-all",
                                selected
                                  ? `${lvl.light} ${lvl.dark}`
                                  : idleCls,
                              ].join(" ")}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Advanced — collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                  </svg>
                  Advanced options
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    {/* Error log */}
                    {type === "bug" && (
                      <div>
                        <label className={labelCls}>Error log / stack trace</label>
                        <textarea
                          rows={3}
                          className={`${textareaCls} font-mono text-xs`}
                          placeholder="Paste any console errors or stack traces here…"
                          value={form.errorLog}
                          onChange={(e) => setForm((p) => ({ ...p, errorLog: e.target.value }))}
                        />
                      </div>
                    )}

                    {/* Notify emails */}
                    <div>
                      <label className={labelCls}>Notify emails</label>
                      <input
                        type="text"
                        className={textareaCls.replace("resize-none", "")}
                        placeholder="email@example.com, another@example.com"
                        value={form.notifyEmails}
                        onChange={(e) => setForm((p) => ({ ...p, notifyEmails: e.target.value }))}
                      />
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                        Comma-separated. Leave empty to notify only the default team.
                      </p>
                    </div>

                    {/* Current page (read-only) */}
                    <div>
                      <label className={labelCls}>Current page</label>
                      <input
                        readOnly
                        value={window.location.pathname}
                        className={`${textareaCls.replace("resize-none", "")} opacity-60 cursor-default`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-[#21262d]">
              <Button size="sm" variant="outline" type="button" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  type === "bug" ? "Send Report" : "Send Suggestion"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BugReportModal;
