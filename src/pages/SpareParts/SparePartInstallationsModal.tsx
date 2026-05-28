import { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { SparePart, AssetSparePart } from "../../shared/types/spare-part.ts";
import { formatDate } from "../../shared/utils/date.ts";

interface Props {
    isOpen: boolean;
    sparePart: SparePart | null;
    onClose: () => void;
}

export default function SparePartInstallationsModal({ isOpen, sparePart, onClose }: Props) {
    const [installations, setInstallations] = useState<AssetSparePart[]>([]);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !sparePart) return;
        setLoading(true);
        setError(null);
        authFetch<AssetSparePart[]>(`${API_ENDPOINTS.spareParts}/${sparePart.id}/installations`)
            .then((res) => setInstallations(res ?? []))
            .catch((e) => setError(e.message ?? "Failed to load installations"))
            .finally(() => setLoading(false));
    }, [isOpen, sparePart]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[540px] m-4">
            <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

                {/* Header */}
                <div className="mb-6">
                    <h4 className="text-xl font-semibold dark:text-white">📍 Current Installations</h4>
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
                </div>

                {/* Content */}
                <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        </div>
                    )}

                    {error && !loading && (
                        <p className="text-sm text-red-500 py-4">{error}</p>
                    )}

                    {!loading && !error && installations.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-3xl mb-2">📦</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                This part is not installed in any asset currently.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                                Stock available: {sparePart?.quantity_in_stock ?? 0}
                            </p>
                        </div>
                    )}

                    {!loading && installations.length > 0 && (
                        <>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                                {installations.length} active {installations.length === 1 ? "installation" : "installations"} found
                            </p>
                            {installations.map((inst) => (
                                <div
                                    key={inst.id}
                                    className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            {/* Asset tag */}
                                            <p className="font-mono font-semibold text-sm text-gray-800 dark:text-white">
                                                {inst.asset_tag}
                                            </p>

                                            {/* Installed by + when */}
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Installed by{" "}
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    @{inst.installed_by}
                                                </span>
                                                {inst.installed_at && (
                                                    <> · {formatDate(inst.installed_at)}</>
                                                )}
                                            </p>

                                            {/* Notes */}
                                            {inst.notes && (
                                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                                    {inst.notes}
                                                </p>
                                            )}
                                        </div>

                                        <span className="shrink-0 inline-flex rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                            Installed
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end mt-6">
                    <Button size="sm" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
