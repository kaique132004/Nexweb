// ─── Weekly Close types ───────────────────────────────────────────────────────

export type WeeklyCloseStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WeeklyClosePreviewItem {
  supply_id: number;
  supply_name: string;
  current_quantity: number;
  min_stock_alert: number;
}

export interface WeeklyClosePreviewResponse {
  region_id: number;
  region_code: string;
  region_name: string;
  week_start: string;
  week_end: string;
  has_pending_close: boolean;
  pending_close_id: number | null;
  items: WeeklyClosePreviewItem[];
}

export interface WeeklyCloseItemResponse {
  id: number;
  supply_id: number;
  supply_name: string;
  expected_quantity: number;
  counted_quantity: number;
  divergence: number;
  adjusted: boolean;
  transaction_id: number | null;
}

export interface WeeklyCloseResponse {
  id: number;
  region_id: number;
  region_code: string;
  week_start: string;
  week_end: string;
  status: WeeklyCloseStatus;
  submitted_by: string;
  approved_by: string | null;
  obs: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  approved_at: string | null;
  total_items: number;
  divergent_items: number;
  items: WeeklyCloseItemResponse[];
}

export interface WeeklyCloseItemRequest {
  supply_id: number;
  counted_quantity: number;
}

export interface WeeklyCloseSubmitRequest {
  region_id: number;
  obs?: string;
  items: WeeklyCloseItemRequest[];
}

export interface WeeklyCloseApprovalRequest {
  obs?: string;
}

// ─── Audit Config types ────────────────────────────────────────────────────────

export type AuditFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "BIANNUAL"
  | "ANNUAL";

export interface RegionAuditConfigResponse {
  id: number | null;
  region_id: number;
  region_code: string;
  region_name: string;
  frequency: AuditFrequency;
  enabled: boolean;
  last_count_date: string | null;
  notify_emails: string[];
  overdue: boolean;
  next_due_date: string | null;
  days_overdue: number | null;
  updated_at: string | null;
}

export interface RegionAuditConfigRequest {
  frequency?: AuditFrequency;
  enabled?: boolean;
  notify_emails?: string; // comma-separated
}
