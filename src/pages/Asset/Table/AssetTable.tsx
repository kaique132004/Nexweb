import { useState } from "react";
import { DataTable, type ColumnDef, type ContextMenuAction } from "../../../shared/components/ui/table/DataTable.tsx";
import { API_ENDPOINTS } from "../../../api/endpoint.ts";
import Badge from "../../../shared/components/ui/badge/Badge.tsx";
import {
  type Asset,
  type AssetStatus,
  ASSET_STATUS_LABELS,
  ASSET_TYPE_LABELS,
} from "../../../shared/types/asset.ts";
import { formatDate } from "../../../shared/utils/date.ts";
import AssetTransferModal from "../AssetTransferModal.tsx";
import AssetMaintenanceModal from "../AssetMaintenanceModal.tsx";
import AssetHistoryModal from "../AssetHistoryModal.tsx";
import AssetAssignModal from "../AssetAssignModal.tsx";
import { authFetch } from "../../../api/apiAuth.ts";

// ─── Status → badge color ────────────────────────────────────────────────────

type BadgeColor = "success" | "warning" | "error" | "info" | "primary";

const statusColor: Record<AssetStatus, BadgeColor> = {
  IN_STOCK:       "success",
  IN_USE:         "info",
  IN_MAINTENANCE: "warning",
  TRANSFERRED:    "primary",
  DECOMMISSIONED: "error",
  LOST:           "error",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface AssetTableProps {
  onEditAsset?: (asset: Asset) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AssetTable({ onEditAsset, onRefresh, refreshTrigger }: AssetTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [transferOpen,     setTransferOpen]     = useState(false);
  const [maintenanceOpen,  setMaintenanceOpen]  = useState(false);
  const [maintenanceMode,  setMaintenanceMode]  = useState<"start" | "end">("start");
  const [historyOpen,      setHistoryOpen]      = useState(false);
  const [assignOpen,       setAssignOpen]       = useState(false);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const select = (asset: Asset) => setSelectedAsset(asset);

  const afterAction = () => {
    setSelectedAsset(null);
    onRefresh?.();
  };

  const handleDecommission = async (asset: Asset) => {
    if (!confirm(`Decommission asset "${asset.asset_tag}"? This action cannot be undone.`)) return;
    try {
      await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/decommission`, { method: "POST" });
      onRefresh?.();
    } catch (e: unknown) {
      alert((e as Error).message ?? "Failed to decommission asset");
    }
  };

  const handleReportLost = async (asset: Asset) => {
    if (!confirm(`Mark asset "${asset.asset_tag}" as LOST?`)) return;
    try {
      await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/lost`, { method: "POST" });
      onRefresh?.();
    } catch (e: unknown) {
      alert((e as Error).message ?? "Failed to report asset as lost");
    }
  };

  const handleUnassign = async (asset: Asset) => {
    if (!confirm(`Unassign asset "${asset.asset_tag}" from "${asset.assigned_to_username}"?`)) return;
    try {
      await authFetch(`${API_ENDPOINTS.asset}/${asset.id}/unassign`, { method: "POST" });
      onRefresh?.();
    } catch (e: unknown) {
      alert((e as Error).message ?? "Failed to unassign asset");
    }
  };

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<Asset>[] = [
    {
      key: "asset_tag",
      label: "Asset Tag",
      className: "px-5 py-4 text-start font-mono text-sm font-semibold text-gray-800 dark:text-white/90",
    },
    {
      key: "asset_type",
      label: "Type",
      className: "px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300",
      render: (a) => ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type,
    },
    {
      key: "manufacturer",
      label: "Manufacturer / Model",
      className: "px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300",
      render: (a) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{a.manufacturer ?? "—"}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{a.model ?? ""}</p>
        </div>
      ),
    },
    {
      key: "serial_number",
      label: "Serial Number",
      className: "px-5 py-4 font-mono text-xs text-gray-500 dark:text-gray-400",
      render: (a) => a.serial_number ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (a) => (
        <Badge size="sm" color={statusColor[a.status]}>
          {ASSET_STATUS_LABELS[a.status]}
        </Badge>
      ),
    },
    {
      key: "current_region_code",
      label: "Region",
      className: "px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300",
      render: (a) => (
        <div>
          <p className="font-medium">{a.current_region_code ?? "—"}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{a.current_region_name ?? ""}</p>
        </div>
      ),
    },
    {
      key: "assigned_to_username",
      label: "Assigned To",
      className: "px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300",
      render: (a) =>
        a.assigned_to_username ? (
          <div>
            <p className="font-medium">{a.assigned_to_full_name ?? a.assigned_to_username}</p>
            <p className="text-xs text-gray-400">@{a.assigned_to_username}</p>
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">Unassigned</span>
        ),
    },
    {
      key: "warranty_expiry",
      label: "Warranty",
      className: "px-5 py-4 text-start text-theme-sm",
      render: (a) => {
        if (!a.warranty_expiry) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className={a.warranty_expired ? "text-red-500 text-xs font-medium" : "text-gray-600 dark:text-gray-300 text-xs"}>
            {formatDate(a.warranty_expiry)}
            {a.warranty_expired && " ⚠️"}
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: "Registered",
      className: "px-5 py-4 text-start text-xs text-gray-400 dark:text-gray-500",
      render: (a) => formatDate(a.created_at),
    },
  ];

  // ─── Context menu actions ─────────────────────────────────────────────────

  const contextMenuActions: ContextMenuAction<Asset>[] = [
    {
      label: "Edit",
      onClick: (a) => onEditAsset?.(a),
    },
    {
      label: "View History",
      onClick: (a) => { select(a); setHistoryOpen(true); },
    },
    {
      label: "Assign to User",
      hidden: (a) => a.status === "DECOMMISSIONED" || a.status === "LOST",
      onClick: (a) => { select(a); setAssignOpen(true); },
    },
    {
      label: "Unassign",
      hidden: (a) => !a.assigned_to_username,
      onClick: handleUnassign,
    },
    {
      label: "Transfer to Region",
      hidden: (a) => a.status === "DECOMMISSIONED" || a.status === "LOST",
      onClick: (a) => { select(a); setTransferOpen(true); },
    },
    {
      label: "Send to Maintenance",
      hidden: (a) => a.status === "IN_MAINTENANCE" || a.status === "DECOMMISSIONED" || a.status === "LOST",
      onClick: (a) => { select(a); setMaintenanceMode("start"); setMaintenanceOpen(true); },
    },
    {
      label: "End Maintenance",
      hidden: (a) => a.status !== "IN_MAINTENANCE",
      onClick: (a) => { select(a); setMaintenanceMode("end"); setMaintenanceOpen(true); },
    },
    {
      label: "Report as Lost",
      hidden: (a) => a.status === "LOST" || a.status === "DECOMMISSIONED",
      onClick: handleReportLost,
      danger: true,
    },
    {
      label: "Decommission",
      hidden: (a) => a.status === "DECOMMISSIONED",
      onClick: handleDecommission,
      danger: true,
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <DataTable<Asset>
        endpoint={`${API_ENDPOINTS.asset}/list`}
        columns={columns}
        rowKey="id"
        refreshTrigger={refreshTrigger}
        contextMenuActions={contextMenuActions}
        contextMenuTitle={(a) => a.asset_tag}
        emptyMessage="No assets registered yet."
        loadingMessage="Loading assets..."
      />

      {/* Transfer */}
      <AssetTransferModal
        isOpen={transferOpen}
        asset={selectedAsset}
        onClose={() => { setTransferOpen(false); setSelectedAsset(null); }}
        onSaved={afterAction}
      />

      {/* Maintenance start / end */}
      <AssetMaintenanceModal
        isOpen={maintenanceOpen}
        mode={maintenanceMode}
        asset={selectedAsset}
        onClose={() => { setMaintenanceOpen(false); setSelectedAsset(null); }}
        onSaved={afterAction}
      />

      {/* History */}
      <AssetHistoryModal
        isOpen={historyOpen}
        asset={selectedAsset}
        onClose={() => { setHistoryOpen(false); setSelectedAsset(null); }}
      />

      {/* Assign */}
      <AssetAssignModal
        isOpen={assignOpen}
        asset={selectedAsset}
        onClose={() => { setAssignOpen(false); setSelectedAsset(null); }}
        onSaved={afterAction}
      />
    </>
  );
}
