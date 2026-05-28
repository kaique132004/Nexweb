import { useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import Label from "../../shared/components/form/Label.tsx";
import type { SparePart } from "../../shared/types/spare-part.ts";

type AdjustType = "ADD" | "REMOVE";

interface Props {
    isOpen: boolean;
    sparePart: SparePart | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function SparePartStockModal({ isOpen, sparePart, onClose, onSaved }: Props) {
    const [type,     setType]     = useState<AdjustType>("ADD");
    const [quantity, setQuantity] = useState<string>("1");
    const [reason,   setReason]   = useState("");
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    const handleClose = () => {
        if (saving) return;
        setType("ADD");
        setQuantity("1");
        setReason("");
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!sparePart) return;

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1) {
            setError("Quantity must be at least 1.");
            return;
        }
        if (type === "REMOVE" && qty > sparePart.quantity_in_stock) {
            setError(`Cannot remove ${qty} — only ${sparePart.quantity_in_stock} in stock.`);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await authFetch(`${API_ENDPOINTS.spareParts}/${sparePart.id}/stock`, {
                method: "POST",
                body: JSON.stringify({
                    type,
                    quantity: qty,
                    reason: reason.trim() || null,
                }),
            });
            setType("ADD");
            setQuantity("1");
            setReason("");
            onSaved();
        } catch (err) {
            setError(err instanceof AuthFetchError ? err.message : "Failed to adjust stock.");
        } finally {
            setSaving(false);
        }
    };

    const isRemoveDisabled = type === "REMOVE" && (sparePart?.quantity_in_stock ?? 0) === 0;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[440px] m-4">
            <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

                {/* Header */}
                <div className="mb-6">
                    <h4 className="text-xl font-semibold dark:text-white">📦 Adjust Stock</h4>
                    {sparePart && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                {sparePart.name}
                            </span>
                            {sparePart.part_number && (
                                <span className="ml-2 font-mono text-xs">#{sparePart.part_number}</span>
                            )}
                        </p>
                    )}
                    {sparePart && (
                        <p className="mt-2 text-sm">
                            Current stock:{" "}
                            <span className={`font-semibold ${
                                sparePart.low_stock
                                    ? "text-orange-500"
                                    : "text-gray-800 dark:text-white"
                            }`}>
                                {sparePart.quantity_in_stock}
                            </span>
                            {sparePart.low_stock && (
                                <span className="ml-2 text-xs text-orange-500">⚠ Low stock</span>
                            )}
                        </p>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Type toggle */}
                    <div>
                        <Label>Operation</Label>
                        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-1">
                            <button
                                type="button"
                                onClick={() => { setType("ADD"); setError(null); }}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                    type === "ADD"
                                        ? "bg-green-500 text-white"
                                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                ＋ Add (Entry)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setType("REMOVE"); setError(null); }}
                                className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                                    type === "REMOVE"
                                        ? "bg-red-500 text-white"
                                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                － Remove (Write-off)
                            </button>
                        </div>
                        {type === "ADD" && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Use for new shipments, returns from storage, or inventory corrections.
                            </p>
                        )}
                        {type === "REMOVE" && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Use for discards, losses, or inventory write-offs not tied to an asset.
                            </p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <Label>Quantity</Label>
                        <input
                            type="number"
                            min={1}
                            max={type === "REMOVE" ? (sparePart?.quantity_in_stock ?? 999999) : undefined}
                            value={quantity}
                            onChange={(e) => { setQuantity(e.target.value); setError(null); }}
                            disabled={saving || isRemoveDisabled}
                            className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                        />
                        {type === "REMOVE" && isRemoveDisabled && (
                            <p className="mt-1 text-xs text-red-500">No stock to remove.</p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <Label>
                            Reason{type === "REMOVE" && <span className="text-red-500 ml-0.5">*</span>}
                            {type === "ADD" && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
                        </Label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            placeholder={
                                type === "ADD"
                                    ? "e.g. PO-2024-001, received from supplier…"
                                    : "e.g. damaged during handling, inventory correction…"
                            }
                            disabled={saving}
                            className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-50"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    {/* Preview */}
                    {sparePart && !isRemoveDisabled && (
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">After adjustment: </span>
                            <span className="font-semibold text-gray-800 dark:text-white">
                                {type === "ADD"
                                    ? sparePart.quantity_in_stock + (parseInt(quantity, 10) || 0)
                                    : Math.max(0, sparePart.quantity_in_stock - (parseInt(quantity, 10) || 0))
                                } units
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-1">
                        <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving || isRemoveDisabled}
                        >
                            {saving
                                ? "Saving…"
                                : type === "ADD"
                                    ? "Confirm Entry"
                                    : "Confirm Write-off"}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
