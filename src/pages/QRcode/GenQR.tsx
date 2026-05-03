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
        const suppliesRes = await authFetch<SupplyOption[]>(`${API_ENDPOINTS.supply}/list`);
        setSupplies(suppliesRes ?? []);
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

  if (loading) {
    return (
      <>
        <PageMeta title="Generate QRCode | Nexventory" description="Generate QRCode" />
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
      <PageMeta title="Generate QRCode | Nexventory" description="Generate QRCode to register consumption" />
      <PageBreadcrumb pageTitle="QRCode Generator" />

      <div className="min-h-screen bg-gray-50  p-4 pb-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Generate QR Code
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a QR Code to quickly access consumption registration
            </p>
          </div>

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
                  disabled={!form.supply_id}
                >
                  <option value="">
                    {!form.supply_id ? "Select supply first" : "Select region"}
                  </option>
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 dark:text-white">
                      {r.region_code} - {r.supplier} (${r.price})
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

              {/* Type - Optional */}
              <div>
                <Label>Type (Optional)</Label>
                <select
                  className="w-full rounded-md border p-3 text-sm dark:text-white outline-none bg-transparent border-slate-600"
                  value={form.type_entry}
                  onChange={handleChange("type_entry")}
                >
                  <option value="" className="bg-slate-900 dark:text-white">
                    Not specified
                  </option>
                  <option value="IN" className="bg-slate-900 dark:text-white">
                    Entry
                  </option>
                  <option value="OUT" className="bg-slate-900 dark:text-white">
                    Exit
                  </option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to let user choose on registration
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <Button type="submit" className="w-full py-3 text-base font-medium">
                Generate QR Code
              </Button>
            </div>
          </form>

          {/* QR Code Display */}
          {showQR && (
            <div className="mt-6 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Your QR Code
              </h2>

              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <canvas ref={canvasRef} />
                </div>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>Supply: {supplies.find((s) => s.id === Number(form.supply_id))?.supply_name}</p>
                  <p>Region: {availableRegions.find((r) => r.id === Number(form.region_id))?.region_code}</p>
                  <p>Type: {form.type_entry ? (form.type_entry === "IN" ? "Entry" : "Exit") : "Not specified"}</p>
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    type="button"
                    onClick={downloadQRCode}
                    className="flex-1 py-3 text-base font-medium"
                  >
                    Download QR Code
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 py-3 text-base font-medium"
                  >
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
