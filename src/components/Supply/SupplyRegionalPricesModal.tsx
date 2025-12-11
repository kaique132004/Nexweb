// src/pages/supplies/SupplyRegionalPricesModal.tsx
import React, { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import type { SupplyList } from "../tables/SupplyList/SuppliesTable";

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

interface SupplyRequestSnake {
  id: string;
  supply_name: string;
  description: string;
  is_active: boolean;
  supply_image: string[];
  regional_prices: RegionControlSupply[];
}

interface SupplyResponseSnake {
  id: string;
  supply_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  supply_image: string[];
  regional_prices: RegionControlSupply[];
}


export interface RegionControlSupply {
    id: string;
    region_id: number;
    region_code: string;
    currency: string;
    supplier: string;
    price: number;
    quantity: number;
}

interface SupplyRegionalPricesModalProps {
    isOpen: boolean;
    closeModal: () => void;
    supplyId: string;
    initialRegionalPrices?: RegionControlSupply[];
    onSaved?: (prices: RegionControlSupply[]) => void;
}

const SupplyRegionalPricesModal: React.FC<SupplyRegionalPricesModalProps> = ({
    isOpen,
    closeModal,
    supplyId,
    initialRegionalPrices,
    onSaved,
}) => {
    const [regions, setRegions] = useState<RegionAPI[]>([]);
    const [regionalPrices, setRegionalPrices] = useState<RegionControlSupply[]>([]);
    const [supply, setSupply] = useState<SupplyList>();
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega regiões quando o modal abre
    useEffect(() => {
        if (!isOpen) return;

        const fetchRegions = async () => {
            try {
                setLoadingRegions(true);

                const supply = await authFetch<SupplyList>(`${API_ENDPOINTS.supply}/list/${supplyId}`, {
                    method: "GET",
                });

                setSupply(supply ?? undefined);

                const data = await authFetch<RegionAPI[]>(API_ENDPOINTS.region, {
                    method: "GET",
                });

                setRegions(data ?? []);
            } catch (err) {
                console.error("Erro ao buscar regiões:", err);
            } finally {
                setLoadingRegions(false);
            }
        };

        fetchRegions();
    }, [isOpen]);

    // Inicializa/preenche preços regionais ao abrir modal
    useEffect(() => {
        if (!isOpen) return;

        if (initialRegionalPrices && initialRegionalPrices.length > 0) {
            // clona pra não mutar o original
            setRegionalPrices(initialRegionalPrices.map((rp) => ({ ...rp })));
        } else {
            setRegionalPrices([]);
        }
    }, [initialRegionalPrices, isOpen]);

    // Adiciona novo registro de preço regional
    const handleAddRegionalPrice = () => {
        setRegionalPrices((prev) => [
            ...prev,
            {
                id: "", // se o backend gerar, pode mandar vazio ou não mandar esse campo
                region_id: 0,
                region_code: "",
                currency: "",
                supplier: "",
                price: 0,
                quantity: 1,
            },
        ]);
    };

    // Seleção de região
    const handleRegionChange =
        (index: number) =>
            (e: React.ChangeEvent<HTMLSelectElement>) => {
                const regionIdStr = e.target.value;
                const region = regions.find((r) => r.id === regionIdStr);
                if (!region) return;

                setRegionalPrices((prev) => {
                    const copy = [...prev];
                    const current = copy[index];

                    copy[index] = {
                        ...current,
                        region_id: Number(region.id), // se o backend espera number
                        region_code: region.region_code,
                    };

                    return copy;
                });
            };

    // Campos numéricos/texto
    const handleFieldChange =
        (index: number, field: keyof RegionControlSupply) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setRegionalPrices((prev) => {
                    const copy = [...prev];
                    const current = copy[index];

                    let parsed: any = value;
                    if (field === "price" || field === "quantity") {
                        parsed = value === "" ? 0 : Number(value);
                    }

                    copy[index] = {
                        ...current,
                        [field]: parsed,
                    };

                    return copy;
                });
            };

    const handleRemove = (index: number) => {
        setRegionalPrices((prev) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!supply) {
                setError("Supply não carregado.");
                setSaving(false);
                return;
            }

            const invalid = regionalPrices.some((rp) => !rp.region_id);
            if (invalid) {
                setError("Há registros sem região selecionada.");
                setSaving(false);
                return;
            }

            // monta explicitamente no formato snake_case que o backend espera
            const payload: SupplyRequestSnake = {
                id: supply.id,
                supply_name: supply.supply_name,      // nunca null
                description: supply.description ?? "",
                is_active: supply.is_active,
                supply_image: supply.supply_images ?? [],
                regional_prices: regionalPrices,
            };

            await authFetch<SupplyResponseSnake>(
                `${API_ENDPOINTS.supply}/edit/${supplyId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            if (onSaved) onSaved(regionalPrices);
            closeModal();
        } catch (err: any) {
            console.error("Erro ao salvar preços regionais:", err);
            setError(err.message ?? "Erro ao salvar preços regionais");
        } finally {
            setSaving(false);
        }
    };



    const handleClose = () => {
        if (saving) return;
        closeModal();
    };

    const title = "Regional Prices";

    const primaryLabel = saving ? "Saving..." : "Save";

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[900px] m-4">
            <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
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
                    <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3">
                        <div className="mt-7">
                            <h5 className="mb-3 text-lg font-medium text-white lg:mb-4">
                                Manage regional prices
                            </h5>

                            {loadingRegions && (
                                <p className="mb-2 text-xs text-slate-400">
                                    Loading regions...
                                </p>
                            )}

                            <div className="flex flex-col gap-3">
                                {regionalPrices.map((rp, index) => {
                                    const selectedRegion = regions.find(
                                        (r) =>
                                            Number(r.id) === rp.region_id ||
                                            r.region_code === rp.region_code
                                    );

                                    return (
                                        <div
                                            key={rp.id || index}
                                            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-700 p-3 lg:grid-cols-7"
                                        >
                                            {/* Region */}
                                            <div className="lg:col-span-2">
                                                <Label>Region</Label>
                                                <select
                                                    className="w-full rounded-md border border-slate-600 bg-transparent p-2 text-sm text-white outline-none"
                                                    value={selectedRegion?.id ?? ""}
                                                    onChange={handleRegionChange(index)}
                                                >
                                                    <option value="">Select a region</option>
                                                    {regions.map((region) => (
                                                        <option
                                                            key={region.id}
                                                            value={region.id}
                                                            className="bg-slate-900 text-white"
                                                        >
                                                            {region.region_code} - {region.region_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Currency */}
                                            <div className="lg:col-span-1">
                                                <Label>Currency</Label>
                                                <Input
                                                    type="text"
                                                    value={rp.currency}
                                                    onChange={handleFieldChange(index, "currency")}
                                                />
                                            </div>

                                            {/* Supplier */}
                                            <div className="lg:col-span-1">
                                                <Label>Supplier</Label>
                                                <Input
                                                    type="text"
                                                    value={rp.supplier}
                                                    onChange={handleFieldChange(index, "supplier")}
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="lg:col-span-1">
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    step={0.01}
                                                    value={rp.price}
                                                    onChange={handleFieldChange(index, "price")}
                                                />
                                            </div>

                                            {/* Quantity */}
                                            <div className="lg:col-span-1">
                                                <Label>Quantity</Label>
                                                <Input
                                                    type="number"
                                                    value={rp.quantity}
                                                    onChange={handleFieldChange(index, "quantity")}
                                                />
                                            </div>

                                            {/* Remove */}
                                            <div className="lg:col-span-1 flex items-end justify-end">
                                                <Button
                                                    size="md"
                                                    variant="outline"
                                                    type="button"
                                                    onClick={() => handleRemove(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddRegionalPrice}
                                >
                                    Add Regional Price
                                </Button>
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

export default SupplyRegionalPricesModal;
