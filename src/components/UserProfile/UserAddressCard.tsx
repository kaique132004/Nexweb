import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { authFetch, AuthFetchError } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";

interface ColumnConfig {
  [key: string]: boolean;
}

interface ColumnsVisibility {
  transactions: ColumnConfig;
  supply: ColumnConfig;
  regions: ColumnConfig;
  user: ColumnConfig;
}

interface UserPreferences {
  language: string;
  theme: string;
  notifications_enabled: boolean;
  columns_visibility: ColumnsVisibility;
}

type TabKey = keyof ColumnsVisibility;

// Definição dos labels amigáveis para cada coluna
const COLUMN_LABELS: Record<TabKey, Record<string, string>> = {
  transactions: {
    username: "Username",
    supplyName: "Supply Name",
    quantityAmended: "Quantity Amended",
    quantityBefore: "Quantity Before",
    quantityAfter: "Quantity After",
    created: "Created",
    regionCode: "Region Code",
    priceUnit: "Price Unit",
    totalPrice: "Total Price",
    typeEntry: "Type Entry",
    obsAlter: "Observations",
  },
  supply: {
    supplyName: "Supply Name",
    description: "Description",
    regionalPrices: "Regional Prices",
    isActive: "Active",
    createdAt: "Created At",
    updatedAt: "Updated At",
    supplyImage: "Supply Image",
  },
  regions: {
    regionCode: "Region Code",
    regionName: "Region Name",
    cityName: "City Name",
    countryName: "Country Name",
    stateName: "State Name",
    addressCode: "Address Code",
    responsibleName: "Responsible Name",
    isActive: "Active",
    containsAgentsLocal: "Contains Local Agents",
    latitude: "Latitude",
    longitude: "Longitude",
  },
  user: {
    username: "Username",
    email: "Email",
    firstName: "First Name",
    lastName: "Last Name",
    role: "Role",
    isActive: "Active",
    createdBy: "Created By",
    phone: "Phone",
    createdAt: "Created At",
    lastPasswordResetDate: "Last Password Reset",
    isNotTemporary: "Not Temporary",
    accountNonExpired: "Account Non Expired",
    accountNonLocked: "Account Non Locked",
    credentialsNonExpired: "Credentials Non Expired",
    regions: "Regions",
    permissions: "Permissions",
    preferences: "Preferences",
  },
};

interface ColumnVisibilitySettingsProps {
  userId: string;
}

export default function ColumnVisibilitySettings({ userId }: ColumnVisibilitySettingsProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "transactions", label: "Transactions" },
    { key: "supply", label: "Supply" },
    { key: "regions", label: "Regions" },
    { key: "user", label: "Users" },
  ];

  // Carregar preferências do usuário
  useEffect(() => {
    if (isOpen && !preferences) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await authFetch<UserPreferences>(
        `${API_ENDPOINTS.preferences}/${userId}`
      );

      if (data) {
        setPreferences(data);
        setOriginalPreferences(JSON.parse(JSON.stringify(data))); // Deep clone
      }
    } catch (error) {
      console.error('Error loading preferences:', error);

      if (error instanceof AuthFetchError) {
        console.error(error.message);
      } else {
        console.error('Failed to load column visibility settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleColumn = (tabKey: TabKey, columnId: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      columns_visibility: {
        ...preferences.columns_visibility,
        [tabKey]: {
          ...preferences.columns_visibility[tabKey],
          [columnId]: !preferences.columns_visibility[tabKey][columnId],
        },
      },
    });
  };

  const handleSelectAll = (tabKey: TabKey) => {
    if (!preferences) return;

    const updatedColumns = Object.keys(preferences.columns_visibility[tabKey]).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );

    setPreferences({
      ...preferences,
      columns_visibility: {
        ...preferences.columns_visibility,
        [tabKey]: updatedColumns,
      },
    });
  };

  const handleDeselectAll = (tabKey: TabKey) => {
    if (!preferences) return;

    const updatedColumns = Object.keys(preferences.columns_visibility[tabKey]).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {}
    );

    setPreferences({
      ...preferences,
      columns_visibility: {
        ...preferences.columns_visibility,
        [tabKey]: updatedColumns,
      },
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await authFetch<UserPreferences>(
        `${API_ENDPOINTS.preferences}/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify(preferences),
        }
      );

      console.log('Column visibility settings saved successfully');
      setOriginalPreferences(JSON.parse(JSON.stringify(preferences))); // Update original
      closeModal();

      // Disparar evento para atualizar tabelas
      window.dispatchEvent(
        new CustomEvent('preferences-updated', { 
          detail: preferences 
        })
      );
    } catch (error) {
      console.error('Error saving preferences:', error);

      if (error instanceof AuthFetchError) {
        console.error(error.message);
      } else {
        console.error('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalPreferences) {
      setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
      console.log('Settings reset to last saved state');
    }
  };

  const handleClose = () => {
    // Restaurar para estado original se houver mudanças não salvas
    if (originalPreferences) {
      setPreferences(JSON.parse(JSON.stringify(originalPreferences)));
    }
    closeModal();
  };

  const hasChanges = () => {
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 lg:mb-2">
              Column Visibility
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure which columns are visible in each table
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.25 4.5C2.25 4.08579 2.58579 3.75 3 3.75H15C15.4142 3.75 15.75 4.08579 15.75 4.5C15.75 4.91421 15.4142 5.25 15 5.25H3C2.58579 5.25 2.25 4.91421 2.25 4.5Z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.25 9C2.25 8.58579 2.58579 8.25 3 8.25H15C15.4142 8.25 15.75 8.58579 15.75 9C15.75 9.41421 15.4142 9.75 15 9.75H3C2.58579 9.75 2.25 9.41421 2.25 9Z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.25 13.5C2.25 13.0858 2.58579 12.75 3 12.75H15C15.4142 12.75 15.75 13.0858 15.75 13.5C15.75 13.9142 15.4142 14.25 15 14.25H3C2.58579 14.25 2.25 13.9142 2.25 13.5Z"
              />
            </svg>
            Configure
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-hidden bg-white rounded-3xl dark:bg-[#1e1e1e] lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Column Visibility Settings
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Select which columns to display in each table view.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          ) : preferences ? (
            <>
              {/* Tabs */}
              <div className="px-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.key
                          ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column List */}
              <div className="px-2 mb-6 overflow-y-auto max-h-96 custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <Label className="mb-0">Columns</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectAll(activeTab)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <button
                      onClick={() => handleDeselectAll(activeTab)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(preferences.columns_visibility[activeTab]).map(
                    ([columnId, isVisible]) => (
                      <label
                        key={columnId}
                        className="flex items-center gap-3 p-3 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => handleToggleColumn(activeTab, columnId)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {COLUMN_LABELS[activeTab][columnId] || columnId}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleReset} 
                  disabled={saving || !hasChanges()}
                >
                  Reset
                </Button>
                <Button size="sm" variant="outline" onClick={handleClose} disabled={saving}>
                  Close
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saving || !hasChanges()}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
