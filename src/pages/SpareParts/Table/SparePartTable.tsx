import { useState } from "react";
import { DataTable, type ColumnDef, type ContextMenuAction } from "../../../shared/components/ui/table/DataTable.tsx";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import Badge from "../../../shared/components/ui/badge/Badge.tsx";
import type { SparePart } from "../../../shared/types/spare-part.ts";
import { ASSET_TYPE_LABELS } from "../../../shared/types/asset.ts";
import { authFetch } from "../../../api/apiAuth.ts";
import SparePartInstallOnAssetModal from "../SparePartInstallOnAssetModal.tsx";
import SparePartInstallationsModal from "../SparePartInstallationsModal.tsx";
import SparePartStockModal from "../SparePartStockModal.tsx";

interface Props {
    onEdit?: (part: SparePart) => void;
    refreshTrigger?: number;
}

export default function SparePartTable({ onEdit, refreshTrigger }: Props) {
    const [internalRefresh,        setInternalRefresh]        = useState(0);
    const [selectedPart,           setSelectedPart]           = useState<SparePart | null>(null);
    const [installModalOpen,       setInstallModalOpen]       = useState(false);
    const [installationsModalOpen, setInstallationsModalOpen] = useState(false);
    const [stockModalOpen,         setStockModalOpen]         = useState(false);

    const handleDelete = async (part: SparePart) => {
        if (!confirm(`Delete spare part "${part.name}"? This will mark it as inactive.`)) return;
        try {
            await authFetch(`${API_ENDPOINTS.spareParts}/del/${part.id}`, { method: "DELETE" });
            setInternalRefresh((v) => v + 1);
        } catch (e: unknown) {
            alert((e as Error).message ?? "Failed to delete spare part");
        }
    };

    // ─── Columns ─────────────────────────────────────────────────────────────

    const columns: ColumnDef<SparePart>[] = [
        {
            key: "name",
            label: "Part Name",
            className: "px-5 py-4 text-start",
            render: (p) => (
                <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{p.name}</p>
                    {p.part_number && (
                        <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                            #{p.part_number}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "manufacturer",
            label: "Manufacturer",
            className: "px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-300",
            render: (p) => p.manufacturer ?? "—",
        },
        {
            key: "compatible_asset_types",
            label: "Compatible With",
            render: (p) =>
                !p.compatible_asset_types || p.compatible_asset_types.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Universal</span>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {p.compatible_asset_types.map((t) => (
                            <span
                                key={t}
                                className="inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                            >
                                {ASSET_TYPE_LABELS[t] ?? t}
                            </span>
                        ))}
                    </div>
                ),
        },
        {
            key: "quantity_in_stock",
            label: "Stock",
            render: (p) => (
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                        p.low_stock
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-800 dark:text-white/90"
                    }`}>
                        {p.quantity_in_stock}
                    </span>
                    {p.low_stock && (
                        <span
                            title={`Low stock! Min: ${p.min_stock_alert}`}
                            className="inline-flex rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400"
                        >
                            ⚠ Low
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "unit_cost",
            label: "Unit Cost",
            className: "px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-300",
            render: (p) =>
                p.unit_cost != null
                    ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(p.unit_cost)
                    : "—",
        },
        {
            key: "is_active",
            label: "Status",
            render: (p) => (
                <Badge size="sm" color={p.is_active ? "success" : "warning"}>
                    {p.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    // ─── Context menu ─────────────────────────────────────────────────────────

    const contextMenuActions: ContextMenuAction<SparePart>[] = [
        {
            label: "Install on Asset",
            onClick: (p) => { setSelectedPart(p); setInstallModalOpen(true); },
            hidden: (p) => !p.is_active,
        },
        {
            label: "View Installations",
            onClick: (p) => { setSelectedPart(p); setInstallationsModalOpen(true); },
        },
        {
            label: "Adjust Stock",
            onClick: (p) => { setSelectedPart(p); setStockModalOpen(true); },
            hidden: (p) => !p.is_active,
        },
        {
            label: "Edit",
            onClick: (p) => onEdit?.(p),
        },
        {
            label: "Delete",
            onClick: handleDelete,
            danger: true,
        },
    ];

    return (
        <>
            <DataTable<SparePart>
                endpoint={`${API_ENDPOINTS.spareParts}/list`}
                columns={columns}
                rowKey="id"
                refreshTrigger={refreshTrigger ?? internalRefresh}
                contextMenuActions={contextMenuActions}
                contextMenuTitle={(p) => p.name}
                emptyMessage="No spare parts in catalogue."
                loadingMessage="Loading spare parts…"
            />

            {/* Install this part on an asset */}
            <SparePartInstallOnAssetModal
                isOpen={installModalOpen}
                sparePart={selectedPart}
                onClose={() => { setInstallModalOpen(false); setSelectedPart(null); }}
                onSaved={() => {
                    setInstallModalOpen(false);
                    setSelectedPart(null);
                    setInternalRefresh((v) => v + 1); // atualiza stock na tabela
                }}
            />

            {/* Where is this part installed right now? */}
            <SparePartInstallationsModal
                isOpen={installationsModalOpen}
                sparePart={selectedPart}
                onClose={() => { setInstallationsModalOpen(false); setSelectedPart(null); }}
            />

            {/* Manual stock adjustment (ADD / REMOVE) */}
            <SparePartStockModal
                isOpen={stockModalOpen}
                sparePart={selectedPart}
                onClose={() => { setStockModalOpen(false); setSelectedPart(null); }}
                onSaved={() => {
                    setStockModalOpen(false);
                    setSelectedPart(null);
                    setInternalRefresh((v) => v + 1);
                }}
            />
        </>
    );
}
