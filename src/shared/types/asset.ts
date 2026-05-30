// ─── Enums ───────────────────────────────────────────────────────────────────

export type AssetStatus =
  | "IN_STOCK"
  | "IN_USE"
  | "IN_MAINTENANCE"
  | "TRANSFERRED"
  | "DECOMMISSIONED"
  | "LOST";

export type AssetType =
  | "LAPTOP"
  | "DESKTOP"
  | "SERVER"
  | "MONITOR"
  | "PRINTER"
  | "SCANNER"
  | "NETWORK_DEVICE"
  | "MOBILE_PHONE"
  | "TABLET"
  | "UPS"
  | "HEADSET"
  | "KEYBOARD_MOUSE"
  | "EXTERNAL_STORAGE"
  | "OTHER";

export type AssetEventType =
  | "CREATED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "TRANSFERRED"
  | "MAINTENANCE_START"
  | "MAINTENANCE_END"
  | "STATUS_CHANGED"
  | "DECOMMISSIONED"
  | "REPORTED_LOST"
  | "RECOVERED"
  | "AUDIT_VERIFIED"
  | "IMPORTED_FROM_EXTERNAL";

// ─── Main asset object (response) ────────────────────────────────────────────

export interface Asset {
  id: number;
  asset_tag: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  asset_type: AssetType;
  status: AssetStatus;
  current_region_id?: number;
  current_region_code?: string;
  current_region_name?: string;
  assigned_to_username?: string;
  assigned_to_full_name?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_value?: number;
  warranty_expired?: boolean;
  notes?: string;
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  last_audit_at?: string;
  last_audit_by?: string;
}

// ─── Event / audit trail ──────────────────────────────────────────────────────

export interface AssetEvent {
  id: number;
  asset_id: number;
  asset_tag: string;
  event_type: AssetEventType;
  previous_status?: AssetStatus;
  new_status: AssetStatus;
  from_region_id?: number;
  from_region_code?: string;
  to_region_id?: number;
  to_region_code?: string;
  assigned_to_username?: string;
  performed_by: string;
  notes?: string;
  created_at: string;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface AssetRequestPayload {
  asset_tag: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  asset_type: AssetType;
  current_region_id: number;
  assigned_to_username?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_value?: number;
  notes?: string;
  images?: string[];
}

// ─── Audit commit result ──────────────────────────────────────────────────────

export interface AssetAuditResult {
  valid: boolean;
  errors: string[];
  asset: Asset;
}

// ─── Import result ────────────────────────────────────────────────────────────

export interface AssetImportItemResult {
  asset_tag: string;
  status: "IMPORTED" | "SKIPPED" | "ERROR";
  message: string;
}

export interface AssetImportResult {
  total_records: number;
  imported: number;
  skipped: number;
  errors: number;
  details: AssetImportItemResult[];
}

// ─── Audit-all result ─────────────────────────────────────────────────────────

export interface AssetAuditAllItemResult {
  asset_id: number;
  asset_tag: string;
  valid: boolean;
  errors: string[];
}

export interface AssetAuditAllResult {
  total: number;
  passed: number;
  failed: number;
  details: AssetAuditAllItemResult[];
}

// ─── Label helpers ────────────────────────────────────────────────────────────

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  IN_STOCK:       "In Stock",
  IN_USE:         "In Use",
  IN_MAINTENANCE: "In Maintenance",
  TRANSFERRED:    "Transferred",
  DECOMMISSIONED: "Decommissioned",
  LOST:           "Lost / Stolen",
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  LAPTOP:           "Laptop",
  DESKTOP:          "Desktop",
  SERVER:           "Server",
  MONITOR:          "Monitor",
  PRINTER:          "Printer",
  SCANNER:          "Scanner",
  NETWORK_DEVICE:   "Network Device",
  MOBILE_PHONE:     "Mobile Phone",
  TABLET:           "Tablet",
  UPS:              "UPS",
  HEADSET:          "Headset",
  KEYBOARD_MOUSE:   "Keyboard / Mouse",
  EXTERNAL_STORAGE: "External Storage",
  OTHER:            "Other",
};

export const ASSET_EVENT_LABELS: Record<AssetEventType, string> = {
  CREATED:          "Created",
  ASSIGNED:         "Assigned",
  UNASSIGNED:       "Unassigned",
  TRANSFERRED:      "Transferred",
  MAINTENANCE_START:"Maintenance Started",
  MAINTENANCE_END:  "Maintenance Ended",
  STATUS_CHANGED:   "Status Changed",
  DECOMMISSIONED:       "Decommissioned",
  REPORTED_LOST:        "Reported Lost",
  RECOVERED:            "Recovered",
  AUDIT_VERIFIED:       "Audit Verified",
  IMPORTED_FROM_EXTERNAL: "Imported from External",
};
