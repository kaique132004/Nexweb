/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import type { TransactionResponse } from "../tables/SupplyList/ConsumptionsTable";
import { useTranslation } from "react-i18next";

interface RegionAPI {
  id: string;
  region_code: string;
  region_name: string;
  city_name: string;
  country_name: string;
  state_name: string;
  address_code: string;
  responsible_name: string;
  is_active: boolean;
  contains_agents_local: boolean;
  latitude: string | null;
  longitude: string | null;
}

interface SupplyOption {
  id: number;
  supply_name: string;
}

interface TransactionRequestPayload {
  supply_id: number;
  quantity_amended: number;
  created: string;
  region_id: number;
  type_entry: string;
  obs_alter?: string;
}

interface TransactionRequestModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onSaved?: () => void;
  transaction: TransactionResponse | null;
}

type FormState = {
  supply_id: string;
  region_id: string;
  quantity_amended: string;
  type_entry: string;
  obs_alter: string;
  created: string;
};

const emptyForm: FormState = {
  supply_id: "",
  region_id: "",
  quantity_amended: "",
  type_entry: "",
  obs_alter: "",
  created: "",
};

const TransactionFormModal: React.FC<TransactionRequestModalProps> = ({
  isOpen,
  closeModal,
  onSaved,
  transaction,
}) => {
  const [supplies, setSupplies] = useState<SupplyOption[]>([]);
  const [regions, setRegions] = useState<RegionAPI[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEditMode = useMemo(() => !!transaction, [transaction]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRefs = async () => {
      try {
        setLoadingRefs(true);
        setError(null);

        const [suppliesRes, regionsRes] = await Promise.all([
          authFetch<SupplyOption[]>(`${API_ENDPOINTS.supply}/list`),
          authFetch<RegionAPI[]>(API_ENDPOINTS.region),
        ]);

        setSupplies(suppliesRes ?? []);
        setRegions(regionsRes ?? []);

        setForm((prev) => {
          if (transaction) {
            return {
              supply_id: String(transaction.supply_name),
              region_id: String(transaction.region_code),
              quantity_amended: String(transaction.quantity_amended),
              type_entry: transaction.type_entry ?? "",
              obs_alter: transaction.obs_alter ?? "",
              created: transaction.created
                ? new Date(transaction.created).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16),
            };
          }

          return {
            ...emptyForm,
            created:
              prev.created ||
              new Date().toISOString().slice(0, 16),
            type_entry: prev.type_entry || "OUT",
          };
        });
      } catch (err: any) {
        console.error("Error loading references:", err);
        setError(
          err?.response?.data?.message ??
          err.message ??
          "Error loading supplies/regions."
        );
      } finally {
        setLoadingRefs(false);
      }
    };

    loadRefs();
  }, [isOpen, transaction]);

  const handleTextChange =
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.supply_id) errors.supply_id = "Supply is required.";
    if (!form.region_id) errors.region_id = "Region is required.";

    if (!form.quantity_amended) {
      errors.quantity_amended = "Quantity is required.";
    } else if (Number(form.quantity_amended) <= 0) {
      errors.quantity_amended = "Quantity must be greater than zero.";
    }

    if (!form.type_entry) errors.type_entry = "Movement type is required.";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Fix the highlighted fields.");
      return false;
    }

    setError(null);
    return true;
  };

  const buildPayload = (): TransactionRequestPayload => {
    return {
      supply_id: Number(form.supply_id),
      region_id: Number(form.region_id),
      quantity_amended: Number(form.quantity_amended),
      type_entry: form.type_entry,
      created: form.created
        ? new Date(form.created).toISOString()
        : new Date().toISOString(),
      obs_alter: form.obs_alter || undefined,
    };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = buildPayload();

      // No backend atual, você só tem POST /add (criação).
      // Se quiser suportar edição, pode criar um PUT /{id} e usar isEditMode aqui.
      const url = `${API_ENDPOINTS.transaction}/add`;
      const method = "POST";

      await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (onSaved) await onSaved();
      closeModal();
      setForm(emptyForm);
      setFieldErrors({});
    } catch (err: any) {
      console.error("Error saving transaction:", err);
      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err.message;
      setError(backendMessage || "Error saving transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    closeModal();
    setForm(emptyForm);
    setFieldErrors({});
    setError(null);
  };

  const title = isEditMode
    ? t("movements.title_form_edit_movement")
    : t("movements.title_form_movement");
  const primaryLabel = saving ? "Salvando..." : isEditMode ? t("movements.form_save_changes") : t("movements.form_save");

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
                {t("movements.transaction_description")}
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Supply */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>{t("movements.form_supply_movement")}</Label>
                  <select
                    className={`w-full rounded-md border p-2 text-sm text-white outline-none bg-transparent border-slate-600 ${fieldErrors.supply_id ? "border-red-500" : ""
                      }`}
                    value={form.supply_id}
                    onChange={handleTextChange("supply_id")}
                    disabled={loadingRefs || saving || isEditMode}
                  >
                    <option value="">{t("movements.form_supply_movement_placeholder")}</option>
                    {supplies.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-slate-900 text-white"
                      >
                        {s.supply_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.supply_id && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.supply_id}
                    </p>
                  )}
                </div>

                {/* Region */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>{t("movements.form_region_movement")}</Label>
                  <select
                    className={`w-full rounded-md border p-2 text-sm text-white outline-none bg-transparent border-slate-600 ${fieldErrors.region_id ? "border-red-500" : ""
                      }`}
                    value={form.region_id}
                    onChange={handleTextChange("region_id")}
                    disabled={loadingRefs || saving || isEditMode}
                  >
                    <option value="">{t("movements.form_region_movement_placeholder")}</option>
                    {regions.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        className="bg-slate-900 text-white"
                      >
                        {r.region_code} - {r.region_name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.region_id && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.region_id}
                    </p>
                  )}
                </div>

                {/* Quantity Amended */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>{t("movements.form_quantity_movement")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.quantity_amended}
                    onChange={handleTextChange("quantity_amended")}
                    disabled={saving}
                  />
                  {fieldErrors.quantity_amended && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.quantity_amended}
                    </p>
                  )}
                </div>

                {/* Type Entry */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>{t("movements.form_type_movement")}</Label>
                  <select
                    className={`w-full rounded-md border p-2 text-sm text-white outline-none bg-transparent border-slate-600 ${fieldErrors.type_entry ? "border-red-500" : ""
                      }`}
                    value={form.type_entry}
                    onChange={handleTextChange("type_entry")}
                    disabled={saving}
                  >
                    <option value="">{t("movements.form_type_movement_placeholder")}</option>
                    <option value="IN" className="bg-slate-900 text-white">
                      {t("movements.form_type_movement_add")}
                    </option>
                    <option value="OUT" className="bg-slate-900 text-white">
                      {t("movements.form_type_movement_out")}
                    </option>
                  </select>
                  {fieldErrors.type_entry && (
                    <p className="mt-1 text-xs text-red-500">
                      {fieldErrors.type_entry}
                    </p>
                  )}
                </div>

                {/* Created */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>{t("movements.form_date_movement")}</Label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm text-white outline-none"
                    value={form.created}
                    onChange={handleTextChange("created")}
                    disabled={saving}
                  />
                </div>

                {/* Obs */}
                <div className="col-span-2">
                  <Label>{t("movements.form_obs_movement")}</Label>
                  <textarea
                    className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm text-white outline-none"
                    rows={3}
                    value={form.obs_alter}
                    onChange={handleTextChange("obs_alter")}
                    disabled={saving}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              {t("movements.form_close")}
            </Button>
            <Button size="sm" type="submit" disabled={saving || loadingRefs}>
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TransactionFormModal;
