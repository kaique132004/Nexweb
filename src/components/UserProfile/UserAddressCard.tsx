import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../shared/components/ui/modal";
import Button from "../../shared/components/ui/button/Button";
import Label from "../../shared/components/form/Label.tsx";
import { authFetch, AuthFetchError } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnConfig {
  [key: string]: boolean;
}

interface ColumnsVisibility {
  transactions: ColumnConfig;
  supply: ColumnConfig;
  regions: ColumnConfig;
  user: ColumnConfig;
  [key: string]: ColumnConfig; // allow unknown tabs gracefully
}

interface UserPreferences {
  language: string;
  theme: string;
  notifications_enabled: boolean;
  columns_visibility: ColumnsVisibility;
}

type TabKey = "transactions" | "supply" | "regions" | "user";

// ─── Human-readable labels ─────────────────────────────────────────────────────
// Keys match the Java field names (camelCase) used in EntityColumnsExtractor

const COLUMN_LABELS: Record<TabKey, Record<string, string>> = {
  transactions: {
    username:        "Username",
    supplyName:      "Supply Name",
    quantityAmended: "Qty Amended",
    quantityBefore:  "Qty Before",
    quantityAfter:   "Qty After",
    createdAt:       "Date",
    regionCode:      "Region",
    priceUnit:       "Unit Price",
    totalPrice:      "Total Price",
    typeEntry:       "Type",
    obsAlter:        "Observation",
    createdBy:       "Created By",
  },
  supply: {
    supplyName:     "Supply Name",
    description:    "Description",
    regionalPrices: "Regional Prices",
    isActive:       "Active",
    createdAt:      "Created At",
    updatedAt:      "Updated At",
    createdBy:      "Created By",
    updatedBy:      "Updated By",
    supplyImage:    "Image",
  },
  regions: {
    regionCode:          "Region Code",
    regionName:          "Region Name",
    cityName:            "City",
    countryName:         "Country",
    stateName:           "State",
    addressCode:         "Address Code",
    responsibleName:     "Responsible",
    isActive:            "Active",
    containsAgentsLocal: "Has Local Agents",
    latitude:            "Latitude",
    longitude:           "Longitude",
  },
  user: {
    username:                "Username",
    email:                   "Email",
    firstName:               "First Name",
    lastName:                "Last Name",
    role:                    "Role",
    isActive:                "Active",
    createdBy:               "Created By",
    phone:                   "Phone",
    createdAt:               "Created At",
    lastPasswordResetDate:   "Last Password Reset",
    isNotTemporary:          "Permanent Account",
    accountNonExpired:       "Account Non Expired",
    accountNonLocked:        "Account Non Locked",
    credentialsNonExpired:   "Credentials Non Expired",
    regions:                 "Regions",
    permissions:             "Permissions",
  },
};

// Fallback: convert camelCase key to "Title Case" for any unlabelled column
function camelToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ColumnVisibilitySettingsProps {
  userId: string;
}

export default function ColumnVisibilitySettings({ userId }: ColumnVisibilitySettingsProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const TABS: { key: TabKey; label: string }[] = [
    { key: "transactions", label: "Transactions" },
    { key: "supply",       label: "Supply" },
    { key: "regions",      label: "Regions" },
    { key: "user",         label: "Users" },
  ];

  const [activeTab,            setActiveTab]            = useState<TabKey>("transactions");
  const [preferences,          setPreferences]          = useState<UserPreferences | null>(null);
  const [originalPreferences,  setOriginalPreferences]  = useState<UserPreferences | null>(null);
  const [loading,              setLoading]              = useState(false);
  const [saving,               setSaving]               = useState(false);
  const [error,                setError]                = useState<string | null>(null);

  // Fetch fresh from backend every time the modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<UserPreferences>(
        `${API_ENDPOINTS.preferences}/${userId}`
      );
      if (data) {
        setPreferences(data);
        setOriginalPreferences(JSON.parse(JSON.stringify(data)));
      }
    } catch (err) {
      if (err instanceof AuthFetchError) {
        setError(err.message);
      } else {
        setError("Failed to load column visibility settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Safe accessor — returns {} if the tab hasn't been loaded yet */
  const tabCols = (tab: TabKey): ColumnConfig =>
    preferences?.columns_visibility?.[tab] ?? {};

  const visibleCount = (tab: TabKey) =>
    Object.values(tabCols(tab)).filter(Boolean).length;

  const totalCount = (tab: TabKey) =>
    Object.keys(tabCols(tab)).length;

  const hasChanges = () =>
    JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const toggleColumn = (tab: TabKey, col: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      columns_visibility: {
        ...preferences.columns_visibility,
        [tab]: {
          ...preferences.columns_visibility[tab],
          [col]: !preferences.columns_visibility[tab][col],
        },
      },
    });
  };

  const setAllForTab = (tab: TabKey, value: boolean) => {
    if (!preferences) return;
    const updated = Object.fromEntries(
      Object.keys(preferences.columns_visibility[tab]).map((k) => [k, value])
    );
    setPreferences({
      ...preferences,
      columns_visibility: { ...preferences.columns_visibility, [tab]: updated },
    });
  };

  /** Reverte para o estado carregado do backend nesta sessão de modal */
  const handleReset = () => {
    if (originalPreferences)
      setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
  };

  /** Descarta alterações locais e limpa o estado — próxima abertura fará novo fetch */
  const resetAndClose = () => {
    setPreferences(null);
    setOriginalPreferences(null);
    setError(null);
    closeModal();
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch<UserPreferences>(
        `${API_ENDPOINTS.preferences}/${userId}`,
        { method: "PUT", body: JSON.stringify(preferences) }
      );
      // Notifica as tabelas para atualizar imediatamente
      window.dispatchEvent(
        new CustomEvent("preferences-updated", { detail: preferences })
      );
      // Limpa estado — próxima abertura confirma a persistência via GET
      setPreferences(null);
      setOriginalPreferences(null);
      closeModal();
    } catch (err) {
      if (err instanceof AuthFetchError) setError(err.message);
      else setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Card strip ── */}
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-2">
              Column Visibility
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose which columns are visible in each table view.
            </p>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            {/* columns icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="fill-current">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M2.25 4.5a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75ZM2.25 9a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 2.25 9Zm0 4.5a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Z" />
            </svg>
            Configure Columns
          </button>
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal isOpen={isOpen} onClose={resetAndClose} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">

          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Column Visibility
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Toggle which columns appear in each table. Changes are saved per user.
            </p>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {/* ── Content ── */}
          {!loading && preferences && (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200 px-2 dark:border-gray-700 mb-0">
                <div className="flex gap-1 overflow-x-auto">
                  {TABS.map((tab) => {
                    const vis = visibleCount(tab.key);
                    const tot = totalCount(tab.key);
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        {tab.label}
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          vis === tot
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {vis}/{tot}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column toggles */}
              <div className="px-2 pb-3 custom-scrollbar max-h-[380px] overflow-y-auto">
                {/* Select / Deselect all */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 mb-3">
                  <Label className="mb-0 text-xs text-gray-500 dark:text-gray-400">
                    {visibleCount(activeTab)} of {totalCount(activeTab)} columns visible
                  </Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAllForTab(activeTab, true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Show all
                    </button>
                    <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={() => setAllForTab(activeTab, false)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Hide all
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(tabCols(activeTab)).map(([col, visible]) => (
                    <label
                      key={col}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                    >
                      {/* Toggle switch */}
                      <span
                        onClick={() => toggleColumn(activeTab, col)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                          visible ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            visible ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </span>
                      <span className={`text-sm font-medium ${
                        visible
                          ? "text-gray-800 dark:text-white/90"
                          : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {COLUMN_LABELS[activeTab]?.[col] ?? camelToLabel(col)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="px-2 mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving || !hasChanges()}
                  type="button"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetAndClose}
                  disabled={saving}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  type="button"
                >
                  {saving
                    ? <><span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</>
                    : "Save Changes"
                  }
                </Button>
              </div>
            </>
          )}

          {/* No data state (shouldn't happen with merge logic, but safe fallback) */}
          {!loading && !preferences && !error && (
            <p className="py-8 text-center text-sm text-gray-500">
              No preference data available.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
