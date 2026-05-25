import { useState } from "react";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import type { RegionalPrice, SupplyOption } from "../../shared/types/supply.ts";

interface Props {
    isOpen: boolean;
    supply: SupplyOption | null;
    onClose: () => void;
    onAcknowledged: () => void;
}

function isLowStock(rp: RegionalPrice) {
    return rp.quantity <= rp.min_stock_alert;
}

export default function SupplyAcknowledgeAlertModal({ isOpen, supply, onClose, onAcknowledged }: Props) {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !supply) return null;

    const lowStockRegions = supply.regional_prices.filter(isLowStock);

    const handleAcknowledge = async (regionCode: string) => {
        setLoading(regionCode);
        setError(null);
        try {
            const res = await fetch(
                `${API_ENDPOINTS.supply}/${supply.id}/acknowledge-alert?regionCode=${encodeURIComponent(regionCode)}`,
                { method: "POST", credentials: "include" }
            );
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.message ?? "Failed to acknowledge alert");
            }
            onAcknowledged();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "An unexpected error occurred.");
        } finally {
            setLoading(null);
        }
    };

    const allAcknowledged = lowStockRegions.every((rp) => rp.alert_acknowledged);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Low Stock Alerts
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {supply.supply_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {lowStockRegions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No low-stock regions found.
                        </p>
                    ) : (
                        lowStockRegions.map((rp) => (
                            <div
                                key={rp.id}
                                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                                    rp.alert_acknowledged
                                        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                                        : "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10"
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                            {rp.region_code}
                                        </span>
                                        {rp.alert_acknowledged ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                                ✓ Acknowledged
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                                                ⚠ Alert Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {rp.quantity} {rp.quantity === 1 ? "unit" : "units"} · min alert: {rp.min_stock_alert}
                                    </p>
                                    {rp.alert_acknowledged && rp.alert_acknowledged_by && (
                                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                            by <span className="font-medium">{rp.alert_acknowledged_by}</span>
                                            {rp.alert_acknowledged_at && (
                                                <> · {new Date(rp.alert_acknowledged_at).toLocaleString()}</>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {!rp.alert_acknowledged && (
                                    <button
                                        onClick={() => handleAcknowledge(rp.region_code)}
                                        disabled={loading === rp.region_code}
                                        className="ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                                    >
                                        {loading === rp.region_code ? (
                                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        ) : (
                                            "Acknowledge"
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                    {allAcknowledged && lowStockRegions.length > 0 ? (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ All alerts acknowledged — no further emails will be sent.
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Acknowledged alerts reset automatically when stock is replenished.
                        </p>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-4 shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
