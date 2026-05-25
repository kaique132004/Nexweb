import { useEffect, useState } from "react";
import { authFetch, AuthFetchError } from "../../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import { Modal } from "../../../shared/components/ui/modal";
import Label from "../../../shared/components/form/Label.tsx";
import Input from "../../../shared/components/form/input/InputField.tsx";
import Button from "../../../shared/components/ui/button/Button.tsx";
import type { Asset, AssetRequestPayload, AssetType } from "../../../shared/types/asset.ts";
import { ASSET_TYPE_LABELS } from "../../../shared/types/asset.ts";
import type { Region } from "../../../shared/types/region.ts";

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  asset?: Asset | null;
  onSaved?: () => void;
}

type FormState = Omit<AssetRequestPayload, "current_region_id"> & {
  current_region_id: number | "";
};

const DEFAULT_FORM: FormState = {
  asset_tag:          "",
  serial_number:      "",
  manufacturer:       "",
  model:              "",
  asset_type:         "LAPTOP",
  current_region_id:  "",
  assigned_to_username: "",
  purchase_date:      "",
  warranty_expiry:    "",
  purchase_value:     undefined,
  notes:              "",
};

const ASSET_TYPE_OPTIONS = Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][];

export default function AssetFormModal({ isOpen, closeModal, asset, onSaved }: Props) {
  const isEdit = !!asset;

  const [form, setForm]       = useState<FormState>(DEFAULT_FORM);
  const [regions, setRegions] = useState<Region[]>([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ─── Fetch regions list ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    authFetch<{ content: Region[] }>(`${API_ENDPOINTS.region}?page=0&size=200`)
      .then((res) => setRegions(res?.content ?? []))
      .catch(() => {/* silently fail */});
  }, [isOpen]);

  // ─── Sync form when editing ────────────────────────────────────────────────

  useEffect(() => {
    if (asset) {
      setForm({
        asset_tag:            asset.asset_tag ?? "",
        serial_number:        asset.serial_number ?? "",
        manufacturer:         asset.manufacturer ?? "",
        model:                asset.model ?? "",
        asset_type:           asset.asset_type ?? "LAPTOP",
        current_region_id:    asset.current_region_id ?? "",
        assigned_to_username: asset.assigned_to_username ?? "",
        purchase_date:        asset.purchase_date ?? "",
        warranty_expiry:      asset.warranty_expiry ?? "",
        purchase_value:       asset.purchase_value,
        notes:                asset.notes ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
  }, [asset, isOpen]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
      setError(null);
    };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current_region_id) { setError("Please select a region."); return; }

    setSaving(true);
    setError(null);

    const payload: AssetRequestPayload = {
      asset_tag:            form.asset_tag.trim(),
      serial_number:        form.serial_number?.trim() || undefined,
      manufacturer:         form.manufacturer?.trim() || undefined,
      model:                form.model?.trim() || undefined,
      asset_type:           form.asset_type as AssetType,
      current_region_id:    Number(form.current_region_id),
      assigned_to_username: form.assigned_to_username?.trim() || undefined,
      purchase_date:        form.purchase_date || undefined,
      warranty_expiry:      form.warranty_expiry || undefined,
      purchase_value:       form.purchase_value ? Number(form.purchase_value) : undefined,
      notes:                form.notes?.trim() || undefined,
    };

    try {
      if (isEdit && asset) {
        await authFetch(`${API_ENDPOINTS.asset}/edit/${asset.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch(`${API_ENDPOINTS.asset}/create`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved?.();
      closeModal();
    } catch (err) {
      setError(err instanceof AuthFetchError ? err.message : "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const title = isEdit ? `Edit — ${asset?.asset_tag}` : "Register New Asset";

  return (
    <Modal isOpen={isOpen} onClose={() => !saving && closeModal()} className="max-w-[720px] m-4">
      <div className="no-scrollbar relative w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">

        {/* Header */}
        <div className="px-2 pr-14 mb-6">
          <h4 className="text-2xl font-semibold dark:text-white">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? "Update asset details below." : "Fill in the details to register a new asset."}
          </p>
        </div>

        <form className="flex flex-col" onSubmit={handleSave}>
          <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3 space-y-6">

            {/* Section: Identification */}
            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Identification
              </h5>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">

                <div>
                  <Label>Asset Tag <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={form.asset_tag}
                    onChange={set("asset_tag")}
                    placeholder="e.g. NVS-2025-0042"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label>Serial Number</Label>
                  <Input
                    type="text"
                    value={form.serial_number ?? ""}
                    onChange={set("serial_number")}
                    placeholder="Manufacturer serial"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label>Asset Type <span className="text-red-500">*</span></Label>
                  <select
                    value={form.asset_type}
                    onChange={set("asset_type")}
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {ASSET_TYPE_OPTIONS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    type="text"
                    value={form.manufacturer ?? ""}
                    onChange={set("manufacturer")}
                    placeholder="e.g. Dell, HP, Cisco"
                    disabled={saving}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label>Model</Label>
                  <Input
                    type="text"
                    value={form.model ?? ""}
                    onChange={set("model")}
                    placeholder="e.g. Latitude 5420"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Section: Location & Assignment */}
            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Location & Assignment
              </h5>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">

                <div>
                  <Label>Region <span className="text-red-500">*</span></Label>
                  <select
                    value={form.current_region_id}
                    onChange={set("current_region_id")}
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— Select region —</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.region_code} — {r.region_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Assigned to (username)</Label>
                  <Input
                    type="text"
                    value={form.assigned_to_username ?? ""}
                    onChange={set("assigned_to_username")}
                    placeholder="Leave empty = In Stock"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Section: Acquisition */}
            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Acquisition & Warranty
              </h5>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">

                <div>
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={form.purchase_date ?? ""}
                    onChange={set("purchase_date")}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label>Warranty Expiry</Label>
                  <Input
                    type="date"
                    value={form.warranty_expiry ?? ""}
                    onChange={set("warranty_expiry")}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label>Purchase Value</Label>
                  <Input
                    type="number"
                    value={form.purchase_value ?? ""}
                    onChange={set("purchase_value")}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-sm dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
                value={form.notes ?? ""}
                onChange={set("notes")}
                placeholder="Optional observations..."
                disabled={saving}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={() => !saving && closeModal()} disabled={saving} type="button">
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Register Asset"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
