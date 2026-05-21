// components/Regions/Form/RegionFormModal.tsx
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import React, { useState, useEffect } from 'react';
import { authFetch, AuthFetchError } from "../../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import { Modal } from "../../../shared/components/ui/modal";
import Label from "../../../shared/components/form/Label.tsx";
import Input from "../../../shared/components/form/input/InputField.tsx";
import Button from "../../../shared/components/ui/button/Button.tsx";
import type {Region} from "../../../shared/types/region.ts";
// import { useTranslation } from 'react-i18next'; // REMOVIDO

interface RegionFormModalProps {
  isOpen: boolean;
  closeModal: () => void;
  region: Region | null;
  onSaved: () => void;
}

export default function RegionFormModal({ isOpen, closeModal, region, onSaved }: RegionFormModalProps) {
  // const { t } = useTranslation(); // REMOVIDO
  const [formData, setFormData] = useState<Partial<Region>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (region) {
      setFormData(region);
    } else {
      // Estado inicial completo para nova região
      setFormData({
        region_code: '',
        region_name: '',
        city_name: '',
        country_name: '',
        address_code: '',
        state_name: '',
        responsible_name: '',
        is_active: true,
        contains_agents_local: false,
        longitude: undefined,
        latitude: undefined,
      });
    }
    setSaveError(null);
  }, [region, isOpen]);

  const handleInputChange = (field: keyof Region, value: string | boolean | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      // Ajuste para enviar apenas os campos necessários para a API
      const payload = {
        region_code: formData.region_code,
        region_name: formData.region_name,
        city_name: formData.city_name,
        country_name: formData.country_name,
        address_code: formData.address_code,
        state_name: formData.state_name,
        responsible_name: formData.responsible_name,
        is_active: formData.is_active,
        contains_agents_local: formData.contains_agents_local,
        longitude: formData.longitude,
        latitude: formData.latitude,
      };

      if (region && region.region_code) {
        await authFetch(`${API_ENDPOINTS.region}/${region.region_code}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await authFetch(API_ENDPOINTS.region, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
      }
      onSaved();
    } catch (error) {
      console.error('Failed to save region:', error);
      if (error instanceof AuthFetchError) {
        setSaveError(error.message);
      } else {
        setSaveError('An unexpected error occurred.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSaveError(null);
    closeModal();
  };

  return (
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {region ? 'Edit Region' : 'Create New Region'}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update region details or create a new one.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
              {saveError && (
                  <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
                    {saveError}
                  </p>
              )}

              <div className="mb-4">
                <Label>Region Code</Label>
                <Input
                    type="text"
                    value={formData.region_code || ''}
                    onChange={(e) => handleInputChange('region_code', e.target.value)}
                    placeholder="e.g., GRU, SFO"
                    disabled={region !== null} // Código não pode ser editado após criação
                    required
                />
              </div>
              <div className="mb-4">
                <Label>Region Name</Label>
                <Input
                    type="text"
                    value={formData.region_name || ''}
                    onChange={(e) => handleInputChange('region_name', e.target.value)}
                    placeholder="e.g., Guarulhos, San Francisco"
                    required
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>City Name</Label>
                <Input
                    type="text"
                    value={formData.city_name || ''}
                    onChange={(e) => handleInputChange('city_name', e.target.value)}
                    placeholder="e.g., São Paulo"
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>Country Name</Label>
                <Input
                    type="text"
                    value={formData.country_name || ''}
                    onChange={(e) => handleInputChange('country_name', e.target.value)}
                    placeholder="e.g., Brazil"
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>Address Code</Label>
                <Input
                    type="text"
                    value={formData.address_code || ''}
                    onChange={(e) => handleInputChange('address_code', e.target.value)}
                    placeholder="e.g., ABC-123"
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>State Name</Label>
                <Input
                    type="text"
                    value={formData.state_name || ''}
                    onChange={(e) => handleInputChange('state_name', e.target.value)}
                    placeholder="e.g., São Paulo"
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>Responsible Name</Label>
                <Input
                    type="text"
                    value={formData.responsible_name || ''}
                    onChange={(e) => handleInputChange('responsible_name', e.target.value)}
                    placeholder="e.g., John Doe"
                    disabled={saving}
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    disabled={saving}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-blue-600"
                />
                <Label htmlFor="is_active" className="mb-0">Is Active</Label>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                    type="checkbox"
                    id="contains_agents_local"
                    checked={formData.contains_agents_local ?? false}
                    onChange={(e) => handleInputChange('contains_agents_local', e.target.checked)}
                    disabled={saving}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-blue-600"
                />
                <Label htmlFor="contains_agents_local" className="mb-0">Contains Local Agents</Label>
              </div>
              <div className="mb-4">
                <Label>Longitude</Label>
                <Input
                    type="number"
                    value={formData.longitude ?? ''}
                    onChange={(e) => handleInputChange('longitude', e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g., -46.6333"
                    disabled={saving}
                />
              </div>
              <div className="mb-4">
                <Label>Latitude</Label>
                <Input
                    type="number"
                    value={formData.latitude ?? ''}
                    onChange={(e) => handleInputChange('latitude', e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g., -23.5505"
                    disabled={saving}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClose}
                  disabled={saving}
                  type="button"
              >
                Cancel
              </Button>
              <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={saving}
                  type="submit"
              >
                {saving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Saving...
                    </>
                ) : (
                    "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
  );
}