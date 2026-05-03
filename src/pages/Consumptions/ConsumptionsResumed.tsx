'use client'
import React, { useEffect, useState, useMemo } from "react";
import PageMeta from "../../shared/components/common/PageMeta";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import Label from "../../shared/components/form/Label.tsx";
import Input from "../../shared/components/form/input/InputField";
import Button from "../../shared/components/ui/button/Button";
import type {SupplyOption} from "../../shared/types/supply.ts";
import type {TransactionRequestPayload} from "../../shared/types/transaction.ts";

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
  type_entry: "OUT",
  obs_alter: "",
  created: new Date().toISOString().slice(0, 16),
};

export default function ConsumptionsResumed() {
  const [supplies, setSupplies] = useState<SupplyOption[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [urlParams, setUrlParams] = useState<{
    supply_id: string;
    region_id: string;
    type: string;
  }>({ supply_id: "", region_id: "", type: "" });

  // Filtrar regiões disponíveis baseado no supply selecionado
  const availableRegions = useMemo(() => {
    if (!form.supply_id) return [];

    const selectedSupply = supplies.find((s) => s.id === Number(form.supply_id));
    if (!selectedSupply || !selectedSupply.regional_prices) return [];

    return selectedSupply.regional_prices.map((rp) => ({
      id: rp.region_id,
      region_code: rp.region_code,
      supplier: rp.supplier,
      price: rp.price,
    }));
  }, [form.supply_id, supplies]);

  // Ler params da URL no client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const supplyParam = params.get("supply_id") || "";
      const regionParam = params.get("region_id") || "";
      const typeParam = params.get("type") || "";

      console.log("URL Params:", { supplyParam, regionParam, typeParam });

      setUrlParams({
        supply_id: supplyParam,
        region_id: regionParam,
        type: typeParam,
      });
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const suppliesRes = await authFetch<SupplyOption[]>(`${API_ENDPOINTS.supply}/list`);
        setSupplies(suppliesRes ?? []);

        // Aplicar params da URL ao form
        setForm((prev) => ({
          ...prev,
          supply_id: urlParams.supply_id || prev.supply_id,
          region_id: urlParams.region_id || prev.region_id,
          type_entry: urlParams.type === "IN" || urlParams.type === "OUT" ? urlParams.type : prev.type_entry,
        }));
      } catch (err: unknown) {
        console.error("Error loading data:", err);
        const errorMessage = err instanceof Error ? err.message : "Error loading data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [urlParams]);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;

      // Se mudar o supply, resetar a região
      if (field === "supply_id") {
        setForm((prev) => ({ ...prev, [field]: value, region_id: "" }));
      } else {
        setForm((prev) => ({ ...prev, [field]: value }));
      }

      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setError(null);
      setSuccess(false);
    };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.supply_id) errors.supply_id = "Supply is required";
    if (!form.region_id) errors.region_id = "Region is required";
    if (!form.quantity_amended) {
      errors.quantity_amended = "Quantity is required";
    } else if (Number(form.quantity_amended) <= 0) {
      errors.quantity_amended = "Quantity must be greater than zero";
    }
    if (!form.type_entry) errors.type_entry = "Type is required";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please fill all required fields");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload: TransactionRequestPayload = {
        supply_id: Number(form.supply_id),
        region_id: Number(form.region_id),
        quantity_amended: Number(form.quantity_amended),
        type_entry: form.type_entry,
        created: form.created ? new Date(form.created).toISOString() : new Date().toISOString(),
        obs_alter: form.obs_alter || undefined,
      };

      await authFetch(`${API_ENDPOINTS.transaction}/add`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(true);

      // Manter os params ao resetar o form
      setForm({
        ...emptyForm,
        created: new Date().toISOString().slice(0, 16),
        supply_id: urlParams.supply_id || "",
        region_id: urlParams.region_id || "",
        type_entry: urlParams.type === "IN" || urlParams.type === "OUT" ? urlParams.type : "OUT",
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Error saving:", err);
      const errorMessage = err instanceof Error ? err.message : "Error saving movement";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Register Consumption | Nexventory" description="Register new movement" />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Register Consumption | Nexventory" description="Register new movement" />

      <div className="min-h-screen bg-gray-50 p-4 pb-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Register Movement
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register supply consumption
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ Movement registered successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-5">
              {/* Supply */}
              <div>
                <Label>Supply</Label>
                <select
                  className={`w-full rounded-md border p-3 text-sm dark:text-white outline-none bg-transparent border-slate-600 ${
                    fieldErrors.supply_id ? "border-red-500" : ""
                  }`}
                  value={form.supply_id}
                  onChange={handleChange("supply_id")}
                  disabled={saving}
                >
                  <option value="">Select supply</option>
                  {supplies.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 dark:text-white">
                      {s.supply_name}
                    </option>
                  ))}
                </select>
                {fieldErrors.supply_id && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.supply_id}</p>
                )}
              </div>

              {/* Region */}
              <div>
                <Label>Region</Label>
                <select
                  className={`w-full rounded-md border p-3 text-sm dark:text-white outline-none bg-transparent border-slate-600 ${
                    fieldErrors.region_id ? "border-red-500" : ""
                  }`}
                  value={form.region_id}
                  onChange={handleChange("region_id")}
                  disabled={saving || !form.supply_id}
                >
                  <option value="">
                    {!form.supply_id ? "Select supply first" : "Select region"}
                  </option>
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 dark:text-white">
                      {r.region_code}
                    </option>
                  ))}
                </select>
                {fieldErrors.region_id && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.region_id}</p>
                )}
                {form.supply_id && availableRegions.length === 0 && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    No regions available for this supply
                  </p>
                )}
              </div>

              {/* Quantity and Type - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step={1}
                    value={form.quantity_amended}
                    onChange={handleChange("quantity_amended")}
                    disabled={saving}
                    className="p-3"
                  />
                  {fieldErrors.quantity_amended && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.quantity_amended}</p>
                  )}
                </div>

                <div>
                  <Label>Type</Label>
                  <select
                    className={`w-full rounded-md border p-3 text-sm dark:text-white outline-none bg-transparent border-slate-600 ${
                      fieldErrors.type_entry ? "border-red-500" : ""
                    }`}
                    value={form.type_entry}
                    onChange={handleChange("type_entry")}
                    disabled={saving}
                  >
                    <option value="IN" className="bg-slate-900 dark:text-white">
                      Entry
                    </option>
                    <option value="OUT" className="bg-slate-900 dark:text-white">
                      Exit
                    </option>
                  </select>
                  {fieldErrors.type_entry && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.type_entry}</p>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <Label>Date & Time</Label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-600 bg-transparent p-3 text-sm dark:text-white outline-none"
                  value={form.created}
                  onChange={handleChange("created")}
                  disabled={saving}
                />
              </div>

              {/* Observations */}
              <div>
                <Label>Observations (optional)</Label>
                <textarea
                  className="w-full rounded-md border border-slate-600 bg-transparent p-3 text-sm dark:text-white outline-none"
                  rows={3}
                  value={form.obs_alter}
                  onChange={handleChange("obs_alter")}
                  disabled={saving}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <Button
                type="submit"
                disabled={saving}
                className="w-full py-3 text-base font-medium"
              >
                {saving ? "Saving..." : "Register Movement"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
