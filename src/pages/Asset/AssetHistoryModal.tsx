import { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Asset, AssetEvent, AssetEventType, AssetStatus } from "../../shared/types/asset.ts";
import { ASSET_EVENT_LABELS, ASSET_STATUS_LABELS } from "../../shared/types/asset.ts";
import { formatDate } from "../../shared/utils/date.ts";

// ─── Event icon ───────────────────────────────────────────────────────────────

const EVENT_ICON: Record<AssetEventType, string> = {
  CREATED:          "🆕",
  ASSIGNED:         "👤",
  UNASSIGNED:       "🔓",
  TRANSFERRED:      "🚚",
  MAINTENANCE_START:"🔧",
  MAINTENANCE_END:  "✅",
  STATUS_CHANGED:   "🔄",
  DECOMMISSIONED:   "🗑️",
  REPORTED_LOST:    "🚨",
  RECOVERED:        "🎉",
};

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<AssetStatus, string> = {
  IN_STOCK:       "bg-green-100  text-green-700  dark:bg-green-500/10 dark:text-green-400",
  IN_USE:         "bg-blue-100   text-blue-700   dark:bg-blue-500/10  dark:text-blue-400",
  IN_MAINTENANCE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  TRANSFERRED:    "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  DECOMMISSIONED: "bg-red-100    text-red-700    dark:bg-red-500/10   dark:text-red-400",
  LOST:           "bg-red-100    text-red-700    dark:bg-red-500/10   dark:text-red-400",
};

function StatusPill({ status }: { status: AssetStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {ASSET_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Props & component ────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
}

export default function AssetHistoryModal({ isOpen, asset, onClose }: Props) {
  const [events,  setEvents]  = useState<AssetEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !asset) return;
    setLoading(true);
    setError(null);
    authFetch<AssetEvent[]>(`${API_ENDPOINTS.asset}/${asset.id}/history`)
      .then((res) => setEvents(res ?? []))
      .catch((e) => setError(e.message ?? "Failed to load history"))
      .finally(() => setLoading(false));
  }, [isOpen, asset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] m-4">
      <div className="relative w-full rounded-3xl bg-white dark:bg-[#1e1e1e] p-6 lg:p-10">

        {/* Header */}
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">📜 Asset History</h4>
          {asset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{asset.asset_tag}</span>
              {asset.model && ` — ${asset.manufacturer ?? ""} ${asset.model}`}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-red-500 py-4">{error}</p>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No events recorded yet.</p>
          )}

          {!loading && events.length > 0 && (
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-0">
              {events.map((ev, idx) => (
                <li key={ev.id} className="mb-6 ml-6">
                  {/* Timeline dot */}
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[#1e1e1e] ring-2 ring-gray-200 dark:ring-gray-700 text-sm select-none">
                    {EVENT_ICON[ev.event_type] ?? "•"}
                  </span>

                  <div className={`rounded-xl border p-4 ${
                    idx === 0
                      ? "border-brand-500/30 bg-brand-50/30 dark:border-brand-500/20 dark:bg-brand-500/5"
                      : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]"
                  }`}>
                    {/* Event type + date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        {ASSET_EVENT_LABELS[ev.event_type]}
                      </span>
                      <time className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDate(ev.created_at)}
                      </time>
                    </div>

                    {/* Status change */}
                    {ev.previous_status && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StatusPill status={ev.previous_status} />
                        <span className="text-gray-400 text-xs">→</span>
                        <StatusPill status={ev.new_status} />
                      </div>
                    )}

                    {/* Transfer */}
                    {(ev.from_region_code || ev.to_region_code) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span className="font-medium">{ev.from_region_code ?? "?"}</span>
                        {" → "}
                        <span className="font-medium">{ev.to_region_code ?? "?"}</span>
                      </p>
                    )}

                    {/* Assigned to */}
                    {ev.assigned_to_username && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Assigned to:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          @{ev.assigned_to_username}
                        </span>
                      </p>
                    )}

                    {/* Notes */}
                    {ev.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                        {ev.notes}
                      </p>
                    )}

                    {/* Performed by */}
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">
                      by @{ev.performed_by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
