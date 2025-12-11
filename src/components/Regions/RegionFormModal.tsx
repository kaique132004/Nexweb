// src/pages/regions/RegionFormModal.tsx

import React, { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export interface RegionAPI {
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

interface RegionFormModalProps {
  isOpen: boolean;
  closeModal: () => void;
  region?: RegionAPI | null;          // se tiver region => editar, senão => criar
  onSaved?: (region?: RegionAPI) => void;
}

interface RegionFormPayload {
  region_code: string;
  region_name: string;
  city_name: string;
  country_name: string;
  state_name: string;
  address_code: string;
  responsible_name: string;
  is_active: boolean;
  contains_agents_local: boolean;
  latitude: string;   // como texto no form, backend converte para Double
  longitude: string;  // idem
}

const RegionFormModal: React.FC<RegionFormModalProps> = ({
  isOpen,
  closeModal,
  region,
  onSaved,
}) => {
  const isEditMode = !!region;

  const [form, setForm] = useState<RegionFormPayload>({
    region_code: "",
    region_name: "",
    city_name: "",
    country_name: "",
    state_name: "",
    address_code: "",
    responsible_name: "",
    is_active: true,
    contains_agents_local: false,
    latitude: "",
    longitude: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o form quando entra em modo edição / abre modal
  useEffect(() => {
    if (region) {
      setForm({
        region_code: region.region_code ?? "",
        region_name: region.region_name ?? "",
        city_name: region.city_name ?? "",
        country_name: region.country_name ?? "",
        state_name: region.state_name ?? "",
        address_code: region.address_code ?? "",
        responsible_name: region.responsible_name ?? "",
        is_active: region.is_active ?? true,
        contains_agents_local: region.contains_agents_local ?? false,
        latitude:
          region.latitude !== null && region.latitude !== undefined
            ? String(region.latitude)
            : "",
        longitude:
          region.longitude !== null && region.longitude !== undefined
            ? String(region.longitude)
            : "",
      });
    } else {
      // reset criação
      setForm({
        region_code: "",
        region_name: "",
        city_name: "",
        country_name: "",
        state_name: "",
        address_code: "",
        responsible_name: "",
        is_active: true,
        contains_agents_local: false,
        latitude: "",
        longitude: "",
      });
    }
  }, [region, isOpen]);

  const handleTextChange =
    (field: keyof RegionFormPayload) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setForm((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

  const handleCheckboxChange =
    (field: keyof RegionFormPayload) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setForm((prev) => ({
          ...prev,
          [field]: checked as any,
        }));
      };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        ...form,
        // converte lat/long string -> number ou null
        latitude:
          form.latitude.trim() === "" ? null : Number(form.latitude.trim()),
        longitude:
          form.longitude.trim() === "" ? null : Number(form.longitude.trim()),
      };

      if (Number.isNaN(payload.latitude)) payload.latitude = null;
      if (Number.isNaN(payload.longitude)) payload.longitude = null;

      let saved: RegionAPI | undefined;

      if (isEditMode && region) {
        // EDITAR
        saved =
          (await authFetch<RegionAPI>(
            `${API_ENDPOINTS.region}/${region.region_code}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            }
          )) ?? undefined;
      } else {
        // CRIAR
        saved =
          (await authFetch<RegionAPI>(`${API_ENDPOINTS.region}`, {
            method: "POST",
            body: JSON.stringify(payload),
          })) ?? undefined;
      }

      if (onSaved) onSaved(saved);
      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar região:", err);
      setError(err.message ?? "Erro ao salvar região");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    closeModal();
  };

  const title = isEditMode ? "Edit Region" : "Create Region";
  const primaryLabel = isEditMode
    ? saving
      ? "Saving..."
      : "Save Changes"
    : saving
      ? "Saving..."
      : "Create Region";

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
          <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-white lg:mb-6">
                Region Information
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Region Code */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>IATA Code</Label>
                  <Input
                    type="text"
                    value={form.region_code}
                    onChange={handleTextChange("region_code")}
                    required
                  />
                </div>

                {/* Region Name */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Airport Name</Label>
                  <Input
                    type="text"
                    value={form.region_name}
                    onChange={handleTextChange("region_name")}
                    required
                  />
                </div>

                {/* City */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>City</Label>
                  <Input
                    type="text"
                    value={form.city_name}
                    onChange={handleTextChange("city_name")}
                  />
                </div>

                {/* State */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>State</Label>
                  <Input
                    type="text"
                    value={form.state_name}
                    onChange={handleTextChange("state_name")}
                  />
                </div>

                {/* Country */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Country</Label>
                  <Input
                    type="text"
                    value={form.country_name}
                    onChange={handleTextChange("country_name")}
                  />
                </div>

                {/* Address Code */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Address</Label>
                  <Input
                    type="text"
                    value={form.address_code}
                    onChange={handleTextChange("address_code")}
                  />
                </div>

                {/* Responsible Name */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Responsible Name</Label>
                  <Input
                    type="text"
                    value={form.responsible_name}
                    onChange={handleTextChange("responsible_name")}
                  />
                </div>

                {/* Latitude */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Latitude</Label>
                  <Input
                    type="text"
                    value={form.latitude}
                    onChange={handleTextChange("latitude")}
                    placeholder="-23.43567"
                  />
                </div>

                {/* Longitude */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Longitude</Label>
                  <Input
                    type="text"
                    value={form.longitude}
                    onChange={handleTextChange("longitude")}
                    placeholder="-46.47321"
                  />
                </div>

                {/* Booleans */}
                <div className="col-span-2 flex flex-col gap-2 mt-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm text-white">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={handleCheckboxChange("is_active")}
                      />
                      Active
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.contains_agents_local}
                        onChange={handleCheckboxChange("contains_agents_local")}
                      />
                      Contains Local Agents
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">
                {error}
              </p>
            )}
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

export default RegionFormModal;
