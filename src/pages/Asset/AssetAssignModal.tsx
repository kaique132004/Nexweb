import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Label from "../../shared/components/form/Label.tsx";
import Input from "../../shared/components/form/input/InputField.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { Asset } from "../../shared/types/asset.ts";

interface Props {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetAssignModal({ isOpen, asset, onClose, onSaved }: Props) {
  const [username, setUsername] = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setUsername(""); setNotes(""); setError(null); }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    if (!username.trim()) { setError("Username is required."); return; }

    setSaving(true);
    setError(null);
    try {
      await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), notes: notes || undefined }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Failed to assign asset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && onClose()} className="max-w-[440px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">
        <div className="mb-6">
          <h4 className="text-xl font-semibold dark:text-white">👤 Assign Asset</h4>
          {asset && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Assigning <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{asset.asset_tag}</span>
            </p>
          )}
          {asset?.assigned_to_username && (
            <p className="text-xs text-amber-500 mt-1">
              ⚠️ Currently assigned to @{asset.assigned_to_username} — will be replaced.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Username <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="e.g. joao.silva"
              required
              disabled={saving}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Issued for field work — project XYZ"
              disabled={saving}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => !saving && onClose()} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
