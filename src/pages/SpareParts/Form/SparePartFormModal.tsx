import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import { authFetch } from "../../../api/apiAuth.ts";
import type { SparePart } from "../../../shared/types/spare-part.ts";
import type { AssetType } from "../../../shared/types/asset.ts";
import { ASSET_TYPE_LABELS } from "../../../shared/types/asset.ts";

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    sparePart: SparePart | null;   // null → create, object → edit
    onClose: () => void;
    onSaved: () => void;
}

// ─── Asset types list ─────────────────────────────────────────────────────────

const ALL_ASSET_TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SparePartFormModal({ isOpen, sparePart, onClose, onSaved }: Props) {
    const isEdit = sparePart !== null;

    const [name,              setName]              = useState("");
    const [partNumber,        setPartNumber]        = useState("");
    const [description,       setDescription]       = useState("");
    const [manufacturer,      setManufacturer]      = useState("");
    const [quantityInStock,   setQuantityInStock]   = useState(0);
    const [minStockAlert,     setMinStockAlert]     = useState(1);
    const [unitCost,          setUnitCost]          = useState("");
    const [compatibleTypes,   setCompatibleTypes]   = useState<AssetType[]>([]);

    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    // Populate form when editing
    useEffect(() => {
        if (isOpen && sparePart) {
            setName(sparePart.name);
            setPartNumber(sparePart.part_number ?? "");
            setDescription(sparePart.description ?? "");
            setManufacturer(sparePart.manufacturer ?? "");
            setQuantityInStock(sparePart.quantity_in_stock);
            setMinStockAlert(sparePart.min_stock_alert);
            setUnitCost(sparePart.unit_cost != null ? String(sparePart.unit_cost) : "");
            setCompatibleTypes(sparePart.compatible_asset_types ?? []);
        } else if (isOpen) {
            setName("");
            setPartNumber("");
            setDescription("");
            setManufacturer("");
            setQuantityInStock(0);
            setMinStockAlert(1);
            setUnitCost("");
            setCompatibleTypes([]);
        }
        setError(null);
    }, [isOpen, sparePart]);

    if (!isOpen) return null;

    const toggleType = (t: AssetType) =>
        setCompatibleTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
        );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                name,
                part_number:            partNumber || null,
                description:            description || null,
                manufacturer:           manufacturer || null,
                quantity_in_stock:      quantityInStock,
                min_stock_alert:        minStockAlert,
                unit_cost:              unitCost ? parseFloat(unitCost) : null,
                compatible_asset_types: compatibleTypes,
            };

            if (isEdit) {
                await authFetch(`${API_ENDPOINTS.spareParts}/edit/${sparePart!.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                await authFetch(`${API_ENDPOINTS.spareParts}/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            onSaved();
        } catch (err: unknown) {
            setError((err as Error).message ?? "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {isEdit ? "Edit Spare Part" : "Add Spare Part"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Laptop Battery Dell WDX0R"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Part number + Manufacturer */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Part Number
                            </label>
                            <input
                                value={partNumber}
                                onChange={(e) => setPartNumber(e.target.value)}
                                placeholder="e.g. BATT-DELL-WDX0R"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Manufacturer
                            </label>
                            <input
                                value={manufacturer}
                                onChange={(e) => setManufacturer(e.target.value)}
                                placeholder="e.g. Dell"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Optional details about this part"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Stock + Min alert + Cost */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Qty in Stock
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={quantityInStock}
                                onChange={(e) => setQuantityInStock(Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Min Alert
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={minStockAlert}
                                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Unit Cost
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={unitCost}
                                onChange={(e) => setUnitCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Compatible asset types */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Compatible Asset Types
                            <span className="ml-1 text-gray-400">(leave empty for universal)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_ASSET_TYPES.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleType(t)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                        compatibleTypes.includes(t)
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {ASSET_TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
                        >
                            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Part"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
