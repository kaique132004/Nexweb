import { useEffect, useState } from "react";
import type { SupplyList } from "../tables/SupplyList/SuppliesTable";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

interface SupplyFormModalProps {
  isOpen: boolean;
  closeModal: () => void;
  supply?: SupplyList | null;
  onSaved?: (supply?: SupplyList) => void;
}

interface SupplyFormPayload {
  supply_name: string;
  description: string;
  is_active: boolean;
  supply_images: string[];
}

const SupplyFormModal: React.FC<SupplyFormModalProps> = ({
  isOpen,
  closeModal,
  supply,
  onSaved,
}) => {


  const isEditMode = !!supply;

  const [form, setForm] = useState<SupplyFormPayload>({
    supply_name: "",
    description: "",
    is_active: true,
    supply_images: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supply) {
      setForm({
        supply_name: supply.supply_name ?? "",
        description: supply.description ?? "",
        is_active: supply.is_active ?? true,
        supply_images: supply.supply_images ?? [],
      });
    } else {
      setForm({
        supply_name: "",
        description: "",
        is_active: true,
        supply_images: [],
      });
    }
  }, [supply, isOpen]);

  const handleTextChange =
    (field: keyof SupplyFormPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleCheckboxChange =
    (field: keyof SupplyFormPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setForm((prev) => ({ ...prev, [field]: checked as any }));
    };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: any = { ...form };

      let saved: SupplyList | undefined;

      if (isEditMode && supply) {
        saved =
          (await authFetch<SupplyList>(
            `${API_ENDPOINTS.supply}/edit/${supply.id}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            }
          )) ?? undefined;
      } else {
        saved =
          (await authFetch<SupplyList>(`${API_ENDPOINTS.supply}/create`, {
            method: "POST",
            body: JSON.stringify(payload),
          })) ?? undefined;
      }

      if (onSaved) onSaved(saved);
      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar supply:", err);
      setError(err.message ?? "Erro ao salvar supply");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    closeModal();
  };

  const title = isEditMode ? "Edit Supply" : "Create Supply";
  const primaryLabel = isEditMode
    ? saving
      ? "Saving..."
      : "Save Changes"
    : saving
    ? "Saving..."
    : "Create Supply";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-white">{title}</h4>
        </div>

        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-white lg:mb-6">
                Supply Information
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Supply Name */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Supply Name</Label>
                  <Input
                    type="text"
                    value={form.supply_name}
                    onChange={handleTextChange("supply_name")}
                    required
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <Label>Description</Label>
                  <textarea
                    className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm text-white outline-none"
                    rows={3}
                    value={form.description}
                    onChange={handleTextChange("description")}
                  />
                </div>

                {/* Active */}
                <div className="col-span-2 mt-2">
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={handleCheckboxChange("is_active")}
                    />
                    Active
                  </label>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Close
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SupplyFormModal;