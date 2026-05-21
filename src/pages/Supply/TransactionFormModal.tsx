import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Label from "../../shared/components/form/Label.tsx";
import Input from "../../shared/components/form/input/InputField.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import Alert from "../../shared/components/ui/alert/Alert.tsx";
import type { TransactionResponse } from "../../shared/types/transaction.ts";
import { useTranslation } from "react-i18next";
import Select from "../../shared/components/form/Select.tsx";
import type {SupplyOption} from "../../shared/types/supply.ts";
import type {TransactionRequestPayload} from "../../shared/types/transaction.ts";

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
  const [form, setForm] = useState<FormState>(emptyForm);
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEditMode = useMemo(() => !!transaction, [transaction]);

  // Regiões disponíveis baseadas no supply selecionado
  // Todos os valores são convertidos para string para match correto com o select
  const availableRegions = useMemo(() => {
    if (!form.supply_id) return [];

    const selectedSupply = supplies.find(
        (s) => String(s.id) === form.supply_id
    );

    if (!selectedSupply?.regional_prices?.length) return [];

    return selectedSupply.regional_prices.map((rp) => ({
      id: String(rp.region_id),        // string para bater com form.region_id
      region_code: rp.region_code,
      supplier: rp.supplier,
      price: rp.price,
    }));
  }, [form.supply_id, supplies]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRefs = async () => {
      try {
        setLoadingRefs(true);
        setError(null);

        const suppliesRes = await authFetch<any>(`${API_ENDPOINTS.supply}/list`);
        const suppliesList: SupplyOption[] = Array.isArray(suppliesRes)
            ? suppliesRes
            : Array.isArray(suppliesRes?.content)
                ? suppliesRes.content
                : [];

        setSupplies(suppliesList);

        setForm(() => {
          if (transaction) {
            return {
              supply_id: String(transaction.supply_name),
              region_id: String(transaction.region_code),
              quantity_amended: String(transaction.quantity_amended),
              type_entry: transaction.type_entry ?? "",
              obs_alter: transaction.obs_alter ?? "",
              created: transaction.created_at
                  ? new Date(transaction.created_at).toISOString().slice(0, 16)
                  : new Date().toISOString().slice(0, 16),
            };
          }

          return {
            ...emptyForm,
            created: new Date().toISOString().slice(0, 16),
            type_entry: "OUT",
          };
        });
      } catch (err: unknown) {
        console.error("Error loading references:", err);
        const errorMessage =
            err instanceof Error ? err.message : "Error loading supplies";
        setError(errorMessage);
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

            if (field === "supply_id") {
              // Ao trocar o supply, reseta a região
              setForm((prev) => ({ ...prev, supply_id: value, region_id: "" }));
            } else {
              setForm((prev) => ({ ...prev, [field]: value }));
            }

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

  const buildPayload = (): TransactionRequestPayload => ({
    supply_id: Number(form.supply_id),
    region_id: Number(form.region_id),
    quantity_amended: Number(form.quantity_amended),
    type_entry: form.type_entry,
    created: form.created
        ? new Date(form.created).toISOString()
        : new Date().toISOString(),
    obs_alter: form.obs_alter || undefined,
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      await authFetch(`${API_ENDPOINTS.transaction}/add`, {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });

      if (onSaved) await onSaved();
      closeModal();
      setForm(emptyForm);
      setFieldErrors({});
    } catch (err: unknown) {
      console.error("Error saving transaction:", err);
      const errorMessage =
          err instanceof Error ? err.message : "Error saving transaction";
      setError(errorMessage);
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

  const primaryLabel = saving
      ? "Saving..."
      : isEditMode
          ? t("movements.form_save_changes")
          : t("movements.form_save");

  const options = [
    { value: "OUT", label: "Decrease" },
    { value: "IN", label: "Increase" },
  ];

  return (
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold dark:text-white">{title}</h4>
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
                <h5 className="mb-5 text-lg font-medium dark:text-white lg:mb-6">
                  {t("movements.transaction_description")}
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  {/* Supply */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t("movements.form_supply_movement")}</Label>
                    <Select
                        options={supplies.map((s) => ({
                          value: String(s.id),
                          label: `${s.supply_name}`,
                        }))}
                        placeholder="Select supply"
                        onChange={(value) => {
                          const fakeEvent = {
                            target: {value},
                          } as React.ChangeEvent<HTMLSelectElement>;
                          handleTextChange("supply_id")(fakeEvent);
                        }}

                    />

                    {fieldErrors.supply_id && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.supply_id}</p>
                    )}
                  </div>

                  {/* Region */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t("movements.form_region_movement")}</Label>
                    <Select options={availableRegions.map((r) => ({
                      value: String(r.id),
                      label: `${r.region_code}`,
                    }))} onChange={(value) => {
                      const fakeEvent = {
                        target: {value},
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleTextChange("region_id")(fakeEvent);
                    }} />
                    {fieldErrors.region_id && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.region_id}</p>
                    )}
                    {form.supply_id && availableRegions.length === 0 && (
                        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                          No regions available for this supply
                        </p>
                    )}
                  </div>

                  {/* Quantity */}
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
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.quantity_amended}</p>
                    )}
                  </div>

                  {/* Type Entry */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t("movements.form_type_movement")}</Label>
                    <Select options={options} onChange={(value) => {
                      const fakeEvent = {
                        target: {value},
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleTextChange("type_entry")(fakeEvent);
                    }} />
                    
                    {fieldErrors.type_entry && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.type_entry}</p>
                    )}
                  </div>

                  {/* Created */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label>{t("movements.form_date_movement")}</Label>

                    <input
                        type="datetime-local"
                        className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm dark:text-white outline-none"
                        value={form.created}
                        onChange={handleTextChange("created")}
                        disabled={saving}
                    />
                  </div>

                  {/* Obs */}
                  <div className="col-span-2">
                    <Label>{t("movements.form_obs_movement")}</Label>
                    <textarea
                        className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm dark:text-white outline-none"
                        rows={3}
                        value={form.obs_alter}
                        onChange={handleTextChange("obs_alter")}
                        disabled={saving}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4">
                    <Alert variant="error" title="Error" message={error} />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" onClick={handleClose} disabled={saving}>
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