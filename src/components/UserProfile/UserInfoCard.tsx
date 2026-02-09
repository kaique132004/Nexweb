/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select"; // Assumindo que você tem um componente Select
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import type { UserDetail } from "../../types/user";

interface UserPreferences {
  language: string;
  notifications_enabled: boolean;
  // Outros campos como theme e columns_visibility podem ser mantidos, mas não editados aqui
}

interface UserMetaCardProps {
  userId: string;
}

export default function UserInfoCard({ userId }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para edição de preferências
  const [editLanguage, setEditLanguage] = useState("en-US");
  const [editNotifications, setEditNotifications] = useState(false);
  const [user, setUser] = useState<UserDetail>();

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        // Fetch user details
        const userData = await authFetch<UserDetail>(
          `${API_ENDPOINTS.auth}/user-detail/${userId}`,
          { method: "GET" }
        );

        if (userData) {
          setUser(userData);
        }

        // Fetch preferences
        const prefsData = await authFetch<UserPreferences>(
          `${API_ENDPOINTS.preferences}/${userId}`
        );

        if (prefsData) {
          setPreferences(prefsData);
          setEditLanguage(prefsData.language || "en-US");
          setEditNotifications(prefsData.notifications_enabled || false);
        }
      } catch (err: any) {
        setError(err.message ?? "Erro ao carregar dados");
      }
    }

    fetchData();
  }, [userId]);

  const handleOpenModal = () => {
    if (!preferences) return;
    setEditLanguage(preferences.language || "en-US");
    setEditNotifications(preferences.notifications_enabled || false);
    openModal();
  };

  const handleSave = async () => {
    if (!userId || !preferences) return;

    try {
      setSaving(true);
      setError(null);

      const updatedPrefs: UserPreferences = {
        ...preferences,
        language: editLanguage,
        notifications_enabled: editNotifications,
      };

      const updated = await authFetch<UserPreferences>(
        `${API_ENDPOINTS.preferences}/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedPrefs),
        }
      );

      if (updated) {
        setPreferences(updated);
      }

      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar preferências:", err);
      const backendMessage =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err.message;
      setError(backendMessage || "Erro ao salvar preferências.");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p>Error: {error}</p>;
  if (!userId || !preferences || !user) return <p className="text-sm text-gray-500">Loading...</p>;


  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Informações somente leitura */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.first_name}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.last_name}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.email}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Role
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.role}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Type of account
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.not_temporary ? "Permanent" : "Temporary"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Regions
              </p>
              <p className="text-sm font-medium text-gray-800">
                {user?.regions?.join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Botão para abrir modal de preferências */}
        <div className="flex flex-col gap-3 lg:items-end">
          <button
            onClick={handleOpenModal}
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
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit Preferences
          </button>
        </div>
      </div>

      {/* Modal de edição apenas para language e notifications */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Preferences
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Configure your language and notifications settings.
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Preferences
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Language</Label>
                    <Select
                      defaultValue={editLanguage}
                      onChange={(value) => setEditLanguage(value)}
                      options={[
                        { value: "en-US", label: "English (US)" },
                        { value: "pt-BR", label: "Português (BR)" },
                      ]}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editNotifications}
                        onChange={(e) => setEditNotifications(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                        disabled={saving}
                      />
                      Enable Notifications
                    </Label>
                  </div>
                </div>
              </div>
              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={closeModal}
                disabled={saving}
                type="button"
              >
                Close
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
