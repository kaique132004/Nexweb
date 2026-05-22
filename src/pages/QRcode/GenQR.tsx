/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useMemo } from "react";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb";
import PageMeta from "../../shared/components/common/PageMeta";
import Label from "../../shared/components/form/Label.tsx";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import Button from "../../shared/components/ui/button/Button";
import QRCode from "qrcode";
import type {SupplyOption} from "../../shared/types/supply.ts";

type FormState = {
  supply_id: string;
  region_id: string;
  type_entry: string;
};

const emptyForm: FormState = {
  supply_id: "",
  region_id: "",
  type_entry: "",
};

export default function GenQR() {
  const [supplies, setSupplies] = useState<SupplyOption[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // O backend retorna uma Page do Spring: { content: [...], totalElements, ... }
        // Pedimos tamanho grande para trazer todos os supplies sem paginar
        const suppliesRes = await authFetch<{ content: SupplyOption[] } | SupplyOption[]>(
          `${API_ENDPOINTS.supply}/list?size=1000&sort=supplyName,asc`
        );
        const suppliesList = Array.isArray(suppliesRes)
          ? suppliesRes
          : (suppliesRes as { content: SupplyOption[] })?.content ?? [];
        setSupplies(suppliesList);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err?.response?.data?.message ?? "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Gerar QR Code quando showQR mudar para true
  useEffect(() => {
    if (showQR && canvasRef.current) {
      generateQRCodeImage();
    }
  }, [showQR]);

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
      setQrCodeUrl("");
      setShowQR(false);
    };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (!form.supply_id) errors.supply_id = "Supply is required";
    if (!form.region_id) errors.region_id = "Region is required";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please fill all required fields");
      return false;
    }

    return true;
  };

  const generateQRCodeImage = async () => {
    try {
      // Construir URL com parâmetros
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        supply_id: form.supply_id,
        region_id: form.region_id,
      });

      // Adicionar type apenas se foi selecionado
      if (form.type_entry) {
        params.append("type", form.type_entry);
      }

      const url = `${baseUrl}/register-consumption?${params.toString()}`;

      console.log("Generating QR Code for URL:", url);

      // Gerar QRCode
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // Gerar URL para download
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setQrCodeUrl(dataUrl);
        console.log("QR Code generated successfully");
      }
    } catch (err: any) {
      console.error("Error generating QR Code:", err);
      setError("Error generating QR Code: " + err.message);
      setShowQR(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setError(null);
    setShowQR(true);
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const supply = supplies.find((s) => s.id === Number(form.supply_id));
    const region = availableRegions.find((r) => r.id === Number(form.region_id));
    const typeLabel = form.type_entry ? `_${form.type_entry}` : "";
    const fileName = `QRCode_${supply?.supply_name}_${region?.region_code}${typeLabel}.png`;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = fileName;
    link.click();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setQrCodeUrl("");
    setShowQR(false);
    setError(null);
    setFieldErrors({});
  };

  // ─── select base classes ─────────────────────────────────────────────────────
  const selectCls = (hasError?: boolean) =>
    [
      "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors",
      "bg-white text-gray-800 border-gray-300",
      "dark:bg-[#0d1117] dark:text-white/90 dark:border-[#30363d]",
      "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10",
      "dark:focus:border-brand-700",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      hasError ? "border-red-500 dark:border-red-600" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const optionCls = "bg-white dark:bg-[#161b22] text-gray-800 dark:text-white";

  if (loading) {
    return (
      <>
        <PageMeta title="Generate QRCode | Nexventory" description="Generate QRCode" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading supplies…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Generate QRCode | Nexventory" description="Generate QRCode to register consumption" />
      <PageBreadcrumb pageTitle="QRCode Generator" />

      <div className="p-4 pb-8">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Generate QR Code
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a QR Code to quickly access consumption registration
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form card */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-6 shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">

                {/* Supply */}
                <div>
                  <Label>Supply</Label>
                  <select
                    className={selectCls(!!fieldErrors.supply_id)}
                    value={form.supply_id}
                    onChange={handleChange("supply_id")}
                  >
                    <option value="" className={optionCls}>Select supply</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id} className={optionCls}>
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
                    className={selectCls(!!fieldErrors.region_id)}
                    value={form.region_id}
                    onChange={handleChange("region_id")}
                    disabled={!form.supply_id}
                  >
                    <option value="" className={optionCls}>
                      {!form.supply_id ? "Select a supply first" : "Select region"}
                    </option>
                    {availableRegions.map((r) => (
                      <option key={r.id} value={r.id} className={optionCls}>
                        {r.region_code} — {r.supplier} (${r.price})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.region_id && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.region_id}</p>
                  )}
                  {form.supply_id && availableRegions.length === 0 && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                      No regions configured for this supply
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <Label>Type <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></Label>
                  <select
                    className={selectCls()}
                    value={form.type_entry}
                    onChange={handleChange("type_entry")}
                  >
                    <option value="" className={optionCls}>Not specified</option>
                    <option value="IN"  className={optionCls}>Entry (IN)</option>
                    <option value="OUT" className={optionCls}>Exit (OUT)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Leave empty to let the user choose at registration time
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button type="submit" className="w-full">
                  Generate QR Code
                </Button>
              </div>
            </form>
          </div>

          {/* QR Code result */}
          {showQR && (
            <div className="rounded-2xl border border-gray-200 dark:border-[#21262d] bg-white dark:bg-[#161b22] p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-5 text-center">
                Your QR Code
              </h2>

              <div className="flex flex-col items-center gap-5">
                {/* Canvas em container branco para o QR sempre legível */}
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <canvas ref={canvasRef} />
                </div>

                {/* Resumo */}
                <div className="w-full rounded-lg bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-[#21262d] px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Supply</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {supplies.find((s) => s.id === Number(form.supply_id))?.supply_name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Region</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {availableRegions.find((r) => r.id === Number(form.region_id))?.region_code ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {form.type_entry ? (form.type_entry === "IN" ? "Entry" : "Exit") : "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                  <Button type="button" onClick={downloadQRCode} className="flex-1">
                    Download PNG
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline" className="flex-1">
                    Generate New
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
