import { useEffect, useRef, useState } from "react";
import { authFetch, AuthFetchError } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button.tsx";
import Label from "../../shared/components/form/Label.tsx";
import type { SparePart } from "../../shared/types/spare-part.ts";
import type { Asset } from "../../shared/types/asset.ts";
import { ASSET_STATUS_LABELS } from "../../shared/types/asset.ts";

interface Props {
    isOpen: boolean;
    sparePart: SparePart | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function SparePartInstallOnAssetModal({ isOpen, sparePart, onClose, onSaved }: Props) {
    const [search,        setSearch]        = useState("");
    const [assets,        setAssets]        = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [notes,         setNotes]         = useState("");
    const [saving,        setSaving]        = useState(false);
    const [error,         setError]         = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setSearch("");
            setAssets([]);
            setSelectedAsset(null);
            setNotes("");
            setError(null);
            fetchAssets("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchAssets(search), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, isOpen]);

    const fetchAssets = async (q: string) => {
        setLoadingAssets(true);
        try {
            const params = new URLSearchParams({ size: "20" });
            if (q.trim()) params.set("search", q.trim());
            const data = await authFetch<{ content: Asset[] }>(
                `${API_ENDPOINTS.asset}/list?${params}`
            );
            // Only show assets that can receive parts (not decommissioned/lost)
            setAssets(
                (data?.content ?? []).filter(
                    (a) => a.status !== "DECOMMISSIONED" && a.status !== "LOST" && a.is_active
                )
            );
        } catch {
            setAssets([]);
        } finally {
            setLoadingAssets(false);
        }
    };

    const handleInstall = async () => {
        if (!sparePart || !selectedAsset) return;
        setSaving(true);
        setError(null);
        try {
            await authFetch(
                `${API_ENDPOINTS.asset}/${selectedAsset.id}/parts/install`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        sparePartId: sparePart.id,
                        notes: notes.trim() || null,
                    }),
                }
            );
            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof AuthFetchError ? err.message : "Failed to install part.");
        } finally {
            setSaving(false);
        }
    };

    const statusColors: Record<string, string> = {
        IN_STOCK:       "text-green-600 dark:text-green-400",
        IN_USE:         "text-blue-600 dark:text-blue-400",
        IN_MAINTENANCE: "text-yellow-600 dark:text-yellow-400",
        TRANSFERRED:    "text-purple-600 dark:text-purple-400",
    };

    return (
        <Modal isOpen={isOpen} onClose={() => !saving && onClose()} className="max-w-[520px] m-4">
            <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-[#1e1e1e] lg:p-10">

                {/* Header */}
                <div className="mb-6">
                    <h4 className="text-xl font-semibold dark:text-white">🔩 Install on Asset</h4>
                    {sparePart && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                {sparePart.name}
                            </span>
                            {sparePart.part_number && (
                                <span className="ml-2 font-mono text-xs">#{sparePart.part_number}</span>
                            )}
                            <span className="ml-2 text-xs">
                                · Stock available: <span className={sparePart.quantity_in_stock === 0 ? "text-red-500 font-semibold" : "font-semibold"}>{sparePart.quantity_in_stock}</span>
                            </span>
                        </p>
                    )}
                    {sparePart && sparePart.quantity_in_stock === 0 && (
                        <p className="mt-2 text-sm text-red-500">
                            ⚠ No stock available — cannot install this part.
                        </p>
                    )}
                </div>

                {sparePart && sparePart.quantity_in_stock > 0 && (
                    <div className="space-y-4">
                        {/* Asset search */}
                        <div>
                            <Label>Search Asset</Label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setSelectedAsset(null); }}
                                placeholder="Type asset tag, model or serial…"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        {/* Asset list */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="max-h-52 overflow-y-auto">
                                {loadingAssets ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                    </div>
                                ) : assets.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                                        {search ? "No assets found." : "Start typing to search assets."}
                                    </p>
                                ) : (
                                    assets.map((a) => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => setSelectedAsset(a)}
                                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors ${
                                                selectedAsset?.id === a.id
                                                    ? "bg-brand-50 dark:bg-brand-500/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold font-mono text-gray-800 dark:text-white truncate">
                                                        {a.asset_tag}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                        {[a.manufacturer, a.model].filter(Boolean).join(" · ") || "—"}
                                                        {a.current_region_code && ` · ${a.current_region_code}`}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 text-xs font-medium ${statusColors[a.status] ?? "text-gray-500"}`}>
                                                    {ASSET_STATUS_LABELS[a.status]}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {selectedAsset && (
                            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                                ✓ Selected: <span className="font-mono">{selectedAsset.asset_tag}</span>
                            </p>
                        )}

                        {/* Notes */}
                        <div>
                            <Label>Notes (optional)</Label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Work order, reason for installation, etc."
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                disabled={saving}
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button size="sm" variant="outline" type="button" onClick={() => !saving && onClose()} disabled={saving}>
                                Cancel
                            </Button>
                            <Button size="sm" type="button" onClick={handleInstall} disabled={!selectedAsset || saving}>
                                {saving ? "Installing…" : "Confirm Install"}
                            </Button>
                        </div>
                    </div>
                )}

                {sparePart && sparePart.quantity_in_stock === 0 && (
                    <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
