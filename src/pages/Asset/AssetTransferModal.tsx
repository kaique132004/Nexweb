import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Label from "../../shared/components/form/Label.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Asset } from "../../shared/types/asset.ts";
import type { Region } from "../../shared/types/region.ts";

interface Props {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetTransferModal({ isOpen, asset, onClose, onSaved }: Props) {
  const [regions,         setRegions]         = useState<Region[]>([]);
  const [targetRegionId,  setTargetRegionId]  = useState<number | "">("");
  const [notes,           setNotes]           = useState("");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Fetch regions
  useEffect(() => {
    if (!isOpen) return;
    authFetch<{ content: Region[] }>(`${API_ENDPOINTS.region}?page=0&size=200`)
      .then((res) => setRegions(res?.content ?? []))
      .catch(() => {});
    setTargetRegionId("");
    setNotes("");
    setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    if (!targetRegionId) { setError("Select the destination region."); return; }

    setSaving(true);
    setError(null);
    try {
      await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/transfer`, {
        method: "POST",
        body: JSON.stringify({ target_region_id: Number(targetRegionId), notes: notes || undefined }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Failed to transfer asset.");
    } finally {
      setSaving(false);
    }
  };

  const availableRegions = regions.filter((r) => r.id !== asset?.current_region_id);

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} className="max-w-[480px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">Transfer Asset</h4>
          {asset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Moving <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{asset.asset_tag}</span>{" "}
              from <span className="font-medium">{asset.current_region_code ?? "—"}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Destination Region <span className="text-red-500">*</span></Label>
            <select
              value={targetRegionId}
              onChange={(e) => { setTargetRegionId(Number(e.target.value)); setError(null); }}
              required
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— Select destination —</option>
              {availableRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.region_code} — {r.region_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for transfer, courier info, etc."
              disabled={saving}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => !saving && onClose()} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Transferring…" : "Confirm Transfer"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
