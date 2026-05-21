import { useMemo } from "react";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { DataTable } from "../../shared/components/ui/table/DataTable";
import type { ColumnDef, ContextMenuAction } from "../../shared/components/ui/table/DataTable";
import Badge from "../../shared/components/ui/badge/Badge.tsx";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import type {TransactionFilters, TransactionResponse} from "../../shared/types/transaction.ts";
import {formatDate} from "../../shared/utils/date.ts";

interface ConsumptionsTableProps {
  filters?: TransactionFilters;
  refreshKey?: number;
  onViewDetails?: (tx: TransactionResponse) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatNumber = (value: number | null | undefined, decimals = 0) => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const getTypeColor = (tx: TransactionResponse): "success" | "warning" | "error" => {
  const type = tx.type_entry?.toLowerCase();
  if (type === "in") return "success";
  if (type === "out") return "error";
  return "warning";
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ConsumptionsTable({
                                            filters = {},
                                            refreshKey = 0,
                                            onViewDetails,
                                          }: ConsumptionsTableProps) {
  const { isVisible } = useColumnVisibility("transactions");

  // Constrói a URL com os filtros como query params
  // useMemo garante que a string só muda quando filters realmente muda
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.startDate)  params.append("start_date",  filters.startDate);
    if (filters.endDate)    params.append("end_date",    filters.endDate);
    if (filters.regionCode) params.append("region_code", filters.regionCode);
    if (filters.supplyName) params.append("supply_name", filters.supplyName);
    if (filters.username)   params.append("username",    filters.username);
    if (filters.typeEntry)  params.append("type_entry",  filters.typeEntry);

    const qs = params.toString();
    return qs
        ? `${API_ENDPOINTS.transaction}/list?${qs}`
        : `${API_ENDPOINTS.transaction}/list`;
  }, [
    filters.startDate,
    filters.endDate,
    filters.regionCode,
    filters.supplyName,
    filters.username,
    filters.typeEntry,
  ]);

  // ─── Colunas ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<TransactionResponse>[] = [
    {
      key: "username",
      label: "User",
      className: "px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90 font-medium",
    },
    {
      key: "supply_name",
      label: "Supply",
      className: "px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300",
    },
    {
      key: "region_code",
      label: "Region",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
    },
    {
      key: "quantity_before",
      label: "Qty Before",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
    },
    {
      key: "quantity_amended",
      label: "Qty Amended",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
    },
    {
      key: "quantity_after",
      label: "Qty After",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
    },
    {
      key: "price_unit",
      label: "Unit Price",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
      render: (tx) => formatNumber(tx.price_unit, 2),
    },
    {
      key: "total_price",
      label: "Total Price",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400",
      render: (tx) => formatNumber(tx.total_price, 2),
    },
    {
      key: "type_entry",
      label: "Type",
      render: (tx) => (
          <Badge size="sm" color={getTypeColor(tx)}>
            {tx.type_entry}
          </Badge>
      ),
    },
    {
      key: "obs_alter",
      label: "Observations",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate",
      render: (tx) => tx.obs_alter || "-",
    },
    {
      key: "created_at",
      label: "Date",
      className: "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400 whitespace-nowrap",
      render: (tx) => formatDate(tx.created_at),
    },
  ];

  const visibleColumns = columns.filter((col) => isVisible(col.key));

  // ─── Context menu actions ──────────────────────────────────────────────────

  const contextMenuActions: ContextMenuAction<TransactionResponse>[] = [
    ...(onViewDetails
        ? [{
          label: "View Details",
          onClick: (tx: TransactionResponse) => onViewDetails(tx),
        }]
        : []),
  ];

  return (
      <DataTable<TransactionResponse>
          endpoint={endpoint}
          columns={visibleColumns}
          rowKey="id"
          refreshTrigger={refreshKey}
          contextMenuActions={contextMenuActions.length ? contextMenuActions : undefined}
          contextMenuTitle={(tx) => `${tx.supply_name} – ${tx.username}`}
          emptyMessage="No transactions found with the current filters."
          loadingMessage="Loading transactions..."
      />
  );
}