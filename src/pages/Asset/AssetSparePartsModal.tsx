import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import { authFetch } from "../../api/apiAuth.ts";
import type { Asset } from "../../shared/types/asset.ts";
import type {
    AssetSparePart,
    SparePart,
    SparePartStatus,
} from "../../shared/types/spare-part.ts";
import {
    SPARE_PART_STATUS_COLORS,
    SPARE_PART_STATUS_LABELS,
} from "../../shared/types/spare-part.ts";

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    asset: Asset | null;
    onClose: () => void;
    onSaved: () => void;
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

type View = "list" | "install" | "remove";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AssetSparePartsModal({ isOpen, asset, onClose, onSaved }: Props) {
    const [view, setView]                       = useState<View>("list");
    const [records, setRecords]                 = useState<AssetSparePart[]>([]);
    const [catalogue, setCatalogue]             = useState<SparePart[]>([]);
    const [selectedRecord, setSelectedRecord]   = useState<AssetSparePart | null>(null);
    const [loading, setLoading]                 = useState(false);
    const [error, setError]                     = useState<string | null>(null);

    // Install form state
    const [selectedPartId, setSelectedPartId]   = useState<number | "">("");
    const [installNotes, setInstallNotes]       = useState("");

    // Remove form state
    const [removeStatus, setRemoveStatus]       = useState<SparePartStatus>("REMOVED");
    const [removeNotes, setRemoveNotes]         = useState("");

    // ─── Load records ─────────────────────────────────────────────────────────

    const loadRecords = async () => {
        if (!asset) return;
        setLoading(true);
        setError(null);
        try {
            const data = await authFetch<AssetSparePart[]>(
                `${API_ENDPOINTS.asset}/${asset.id}/parts`
            );
            setRecords(data);
        } catch (e: unknown) {
            setError((e as Error).message ?? "Failed to load parts");
        } finally {
            setLoading(false);
        }
    };

    const loadCatalogue = async () => {
        try {
            const data = await authFetch<{ content: SparePart[] }>(
                `${API_ENDPOINTS.spareParts}/list?size=200`
            );
            setCatalogue(data.content ?? []);
        } catch {
            setCatalogue([]);
        }
    };

    useEffect(() => {
        if (isOpen && asset) {
            setView("list");
            setError(null);
            loadRecords();
            loadCatalogue();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, asset]);

    if (!isOpen || !asset) return null;

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleInstall = async () => {
        if (!selectedPartId) return;
        setLoading(true);
        setError(null);
        try {
            await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/parts/install`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sparePartId: selectedPartId, notes: installNotes || null }),
            });
            setInstallNotes("");
            setSelectedPartId("");
            await loadRecords();
            await loadCatalogue();
            setView("list");
            onSaved();
        } catch (e: unknown) {
            setError((e as Error).message ?? "Failed to install part");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!selectedRecord) return;
        setLoading(true);
        setError(null);
        try {
            await authFetch(
                `${API_ENDPOINTS.asset}/${asset.id}/parts/${selectedRecord.id}/remove`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: removeStatus, notes: removeNotes || null }),
                }
            );
            setRemoveNotes("");
            setRemoveStatus("REMOVED");
            setSelectedRecord(null);
            await loadRecords();
            await loadCatalogue();
            setView("list");
            onSaved();
        } catch (e: unknown) {
            setError((e as Error).message ?? "Failed to remove part");
        } finally {
            setLoading(false);
        }
    };

    // ─── Derived data ─────────────────────────────────────────────────────────

    const installedRecords = records.filter((r) => r.status === "INSTALLED");
    const history          = records.filter((r) => r.status !== "INSTALLED");
    const availableParts   = catalogue.filter((p) => p.quantity_in_stock > 0 && p.is_active);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">

                {/* ── Header ── */}
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Spare Parts
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {asset.asset_tag}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* ── LIST VIEW ── */}
                    {view === "list" && (
                        <>
                            {/* Currently installed */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Currently Installed ({installedRecords.length})
                                    </h3>
                                    <button
                                        onClick={() => setView("install")}
                                        disabled={availableParts.length === 0}
                                        title={availableParts.length === 0 ? "No parts available in stock" : ""}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                                    >
                                        + Install Part
                                    </button>
                                </div>

                                {loading ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                                ) : installedRecords.length === 0 ? (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
                                        No spare parts currently installed.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {installedRecords.map((r) => (
                                            <div
                                                key={r.id}
                                                className="flex items-center justify-between rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 px-4 py-3"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                        {r.spare_part_name}
                                                        {r.spare_part_part_number && (
                                                            <span className="ml-2 font-mono text-xs text-gray-400">
                                                                #{r.spare_part_part_number}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                        Installed by <span className="font-medium">{r.installed_by}</span>
                                                        {" · "}
                                                        {new Date(r.installed_at).toLocaleDateString()}
                                                        {r.notes && ` · ${r.notes}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecord(r);
                                                        setRemoveStatus("REMOVED");
                                                        setRemoveNotes("");
                                                        setView("remove");
                                                    }}
                                                    className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* History */}
                            {history.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Removal History ({history.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {history.map((r) => (
                                            <div
                                                key={r.id}
                                                className="flex items-start justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-4 py-3"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {r.spare_part_name}
                                                        {r.spare_part_part_number && (
                                                            <span className="ml-2 font-mono text-xs text-gray-400">
                                                                #{r.spare_part_part_number}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                        Removed by {r.removed_by}{r.removed_at && ` · ${new Date(r.removed_at).toLocaleDateString()}`}
                                                    </p>
                                                    {r.notes && (
                                                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic">{r.notes}</p>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 ml-3 mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SPARE_PART_STATUS_COLORS[r.status]}`}>
                                                    {SPARE_PART_STATUS_LABELS[r.status]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── INSTALL VIEW ── */}
                    {view === "install" && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setView("list")}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ← Back
                            </button>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Install a Spare Part
                            </h3>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Select Part <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— Choose a part —</option>
                                    {availableParts.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                            {p.part_number ? ` [${p.part_number}]` : ""}
                                            {p.manufacturer ? ` · ${p.manufacturer}` : ""}
                                            {` · Stock: ${p.quantity_in_stock}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={installNotes}
                                    onChange={(e) => setInstallNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Reason for installation, work order number, etc."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleInstall}
                                disabled={!selectedPartId || loading}
                                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                            >
                                {loading ? "Installing…" : "Confirm Installation"}
                            </button>
                        </div>
                    )}

                    {/* ── REMOVE VIEW ── */}
                    {view === "remove" && selectedRecord && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setView("list")}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ← Back
                            </button>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Remove: <span className="font-bold">{selectedRecord.spare_part_name}</span>
                            </h3>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Removal reason <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    {(["REMOVED", "DAMAGED", "SCRAPPED"] as SparePartStatus[]).map((s) => (
                                        <label key={s} className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                                            removeStatus === s
                                                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}>
                                            <input
                                                type="radio"
                                                name="removeStatus"
                                                value={s}
                                                checked={removeStatus === s}
                                                onChange={() => setRemoveStatus(s)}
                                                className="mt-0.5"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                    {SPARE_PART_STATUS_LABELS[s]}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {s === "REMOVED" && "Part is OK and will return to stock."}
                                                    {s === "DAMAGED" && "Part is damaged — will NOT return to stock."}
                                                    {s === "SCRAPPED" && "End of life — permanently removed from inventory."}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={removeNotes}
                                    onChange={(e) => setRemoveNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Description of condition, work order, etc."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleRemove}
                                disabled={loading}
                                className="w-full rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                            >
                                {loading ? "Processing…" : "Confirm Removal"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
