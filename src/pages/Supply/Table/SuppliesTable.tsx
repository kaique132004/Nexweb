import { useState } from "react";
import { DataTable, type ColumnDef, type ContextMenuAction } from "../../../shared/components/ui/table/DataTable.tsx";
import { useColumnVisibility } from "../../../hooks/useColumnVisibility";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import Badge from "../../../shared/components/ui/badge/Badge.tsx";
import SupplyRegionalPricesModal from "../SupplyRegionalPricesModal.tsx";
import SupplyAcknowledgeAlertModal from "../SupplyAcknowledgeAlertModal.tsx";
import type {SupplyOption} from "../../../shared/types/supply.ts";
import {formatDate} from "../../../shared/utils/date.ts";

interface SuppliesTableProps {
    onEditSupply?: (supply: SupplyOption) => void;
    refreshTrigger?: number;
}


export default function SuppliesTable({ onEditSupply, refreshTrigger }: SuppliesTableProps) {
    const { isVisible } = useColumnVisibility("supply");
    const [regionalPricesModalOpen, setRegionalPricesModalOpen] = useState(false);
    const [acknowledgeModalOpen, setAcknowledgeModalOpen] = useState(false);
    const [selectedSupply, setSelectedSupply] = useState<SupplyOption | null>(null);
    const [internalRefresh, setInternalRefresh] = useState(0);

    /** Retorna true se o supply tem alguma região com estoque baixo e alerta ainda ativo (não acknowledged) */
    const hasUnacknowledgedAlert = (supply: SupplyOption) =>
        supply.regional_prices.some(
            (rp) => rp.quantity <= rp.min_stock_alert && !rp.alert_acknowledged
        );

    const handleToggleActive = async (supply: SupplyOption) => {
        console.log("Toggling active for supply:", supply.id);
        // sua lógica de ativar/desativar aqui
    };

    // ─── Colunas ────────────────────────────────────────────────────────────────

    const columns: ColumnDef<SupplyOption>[] = [
        {
            key: "supply_name",
            label: "Supply Name",
            className: "px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90 font-medium",
        },
        {
            key: "description",
            label: "Description",
            className: "px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400",
        },
        {
            key: "created_at",
            label: "Created At",
            className: "px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400",
            render: (supply) =>
                supply.created_at
                    ? formatDate(supply.created_at)
                    : "—",
        },
        {
            key: "is_active",
            label: "Status",
            render: (supply) => (
                <Badge size="sm" color={supply.is_active ? "success" : "warning"}>
                    {supply.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "regional_prices",
            label: "Regional Prices",
            className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
            render: (supply) =>
                supply.regional_prices.length === 0 ? (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">No prices set</span>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {supply.regional_prices.map((rp) => {
                            const isLow = rp.quantity <= rp.min_stock_alert;
                            const isAcknowledged = isLow && rp.alert_acknowledged;
                            const isAlertActive = isLow && !rp.alert_acknowledged;
                            return (
                                <span
                                    key={rp.id}
                                    title={
                                        isAlertActive
                                            ? `⚠ Low stock! ${rp.quantity} / min ${rp.min_stock_alert}`
                                            : isAcknowledged
                                            ? `✓ Alert acknowledged by ${rp.alert_acknowledged_by ?? "someone"}`
                                            : undefined
                                    }
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        isAlertActive
                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                            : isAcknowledged
                                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                            : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                    }`}
                                >
                                    {isAlertActive && <span>⚠</span>}
                                    {isAcknowledged && <span>✓</span>}
                                    {rp.region_code}: {rp.currency} · QTY {rp.quantity}
                                </span>
                            );
                        })}
                    </div>
                ),
        },
    ];

    // ─── Context menu actions ───────────────────────────────────────────────────

    const contextMenuActions: ContextMenuAction<SupplyOption>[] = [
        {
            label: "Edit Supply",
            onClick: (supply) => onEditSupply?.(supply),
        },
        {
            label: "Set Regional Prices",
            onClick: (supply) => {
                setSelectedSupply(supply);
                setRegionalPricesModalOpen(true);
            },
        },
        {
            label: "Acknowledge Low Stock Alert",
            onClick: (supply) => {
                setSelectedSupply(supply);
                setAcknowledgeModalOpen(true);
            },
            // Só aparece quando há pelo menos uma região com alerta ativo (não acknowledged)
            hidden: (supply) => !hasUnacknowledgedAlert(supply),
        },
        {
            label: (supply) => (supply.is_active ? "Disable Supply" : "Enable Supply"),
            onClick: handleToggleActive,
            danger: true,
        },
    ];

    const visibleColumns = columns.filter((col) => isVisible(col.key));

    return (
        <>
            <DataTable<SupplyOption>
                endpoint={`${API_ENDPOINTS.supply}/list`}
                columns={visibleColumns}
                rowKey="id"
                refreshTrigger={refreshTrigger ?? internalRefresh}
                contextMenuActions={contextMenuActions}
                contextMenuTitle={(supply) => supply.supply_name}
                emptyMessage="No supplies found."
                loadingMessage="Loading supplies..."
            />

            <SupplyRegionalPricesModal
                isOpen={regionalPricesModalOpen}
                closeModal={() => {
                    setRegionalPricesModalOpen(false);
                    setSelectedSupply(null);
                }}
                supplyId={selectedSupply?.id ?? 0}
                initialRegionalPrices={selectedSupply?.regional_prices ?? []}
                onSaved={() => setInternalRefresh((prev) => prev + 1)}
            />

            <SupplyAcknowledgeAlertModal
                isOpen={acknowledgeModalOpen}
                supply={selectedSupply}
                onClose={() => {
                    setAcknowledgeModalOpen(false);
                    setSelectedSupply(null);
                }}
                onAcknowledged={() => setInternalRefresh((prev) => prev + 1)}
            />
        </>
    );
}