import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Label from "../../shared/components/form/Label.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Asset } from "../../shared/types/asset.ts";

interface Props {
  isOpen: boolean;
  mode: "start" | "end";
  asset: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetMaintenanceModal({ isOpen, mode, asset, onClose, onSaved }: Props) {
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setNotes(""); setError(null); }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    if (!notes.trim()) { setError("Please provide notes."); return; }

    setSaving(true);
    setError(null);
    const endpoint = mode === "start"
      ? `${API_ENDPOINTS.asset}/${asset.id}/maintenance/start`
      : `${API_ENDPOINTS.asset}/${asset.id}/maintenance/end`;

    try {
      await authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const isStart = mode === "start";
  const title   = isStart ? "Send to Maintenance" : "End Maintenance";
  const icon    = isStart ? "🔧" : "✅";
  const hint    = isStart
    ? "Describe the reason (e.g. 'Screen cracked — sent to vendor')."
    : "Describe the outcome (e.g. 'Screen replaced. Asset returned in good condition').";

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} className="max-w-[480px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">{icon} {title}</h4>
          {asset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Asset: <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{asset.asset_tag}</span>
              {asset.model && ` — ${asset.model}`}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Notes <span className="text-red-500">*</span></Label>
            <p className="text-xs text-gray-400 mb-2">{hint}</p>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              rows={4}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setError(null); }}
              placeholder="Required…"
              disabled={saving}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => !saving && onClose()} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : isStart ? "Confirm" : "Mark as Complete"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
