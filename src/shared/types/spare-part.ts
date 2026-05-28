import type { AssetType } from "./asset.ts";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type SparePartStatus = "INSTALLED" | "REMOVED" | "DAMAGED" | "SCRAPPED";

// ─── Catalogue ────────────────────────────────────────────────────────────────

export interface SparePart {
    id: number;
    part_number: string | null;
    name: string;
    description: string | null;
    manufacturer: string | null;
    compatible_asset_types: AssetType[];
    quantity_in_stock: number;
    min_stock_alert: number;
    low_stock: boolean;
    unit_cost: number | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
}

// ─── Per-asset installation record ────────────────────────────────────────────

export interface AssetSparePart {
    id: number;
    asset_id: number;
    asset_tag: string;
    spare_part_id: number;
    spare_part_name: string;
    spare_part_part_number: string | null;
    spare_part_manufacturer: string | null;
    spare_part_unit_cost: number | null;
    status: SparePartStatus;
    installed_at: string;
    installed_by: string;
    removed_at: string | null;
    removed_by: string | null;
    notes: string | null;
}

// ─── Label helpers ────────────────────────────────────────────────────────────

export const SPARE_PART_STATUS_LABELS: Record<SparePartStatus, string> = {
    INSTALLED: "Installed",
    REMOVED:   "Removed (back in stock)",
    DAMAGED:   "Damaged",
    SCRAPPED:  "Scrapped",
};

export const SPARE_PART_STATUS_COLORS: Record<SparePartStatus, string> = {
    INSTALLED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    REMOVED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    DAMAGED:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    SCRAPPED:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
