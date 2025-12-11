// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import type {
  UserDetail,
  UserPreferencesColumnsVisibility,
} from "../../types/user";

interface ColumnsVisibilityModalProps {
  is_open: boolean;
  on_close: () => void;
  user: UserDetail | null;
  on_updated?: (user: UserDetail) => void;
}

const ColumnsVisibilityModal: React.FC<ColumnsVisibilityModalProps> = ({
  is_open,
  on_close,
  user,
  on_updated,
}) => {
  const [local_visibility, set_local_visibility] =
    useState<UserPreferencesColumnsVisibility | null>(null);

  const [saving, set_saving] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  // Ao abrir, copia prefs para estado local
  useEffect(() => {
    if (is_open && user?.preferences?.columns_visibility) {
      set_local_visibility(
        structuredClone(user.preferences.columns_visibility)
      );
      set_error(null);
    }
  }, [is_open, user]);

  const handle_toggle =
    (section: keyof UserPreferencesColumnsVisibility, field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      set_local_visibility((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: checked,
          },
        };
      });
    };

  const handle_save = async () => {
    if (!user || !local_visibility) return;
    try {
      set_saving(true);
      set_error(null);

      const updated_preferences = {
        ...user.preferences,
        columns_visibility: local_visibility,
      };

      const payload = {
        ...user,
        preferences: updated_preferences,
      };

      const updated_user = await authFetch<UserDetail>(
        `${API_ENDPOINTS.auth}/user-preferences/${user.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (on_updated && updated_user) {
        on_updated(updated_user);
      }

      on_close();
    } catch (err: any) {
      console.error("Erro ao salvar visibilidade de colunas:", err);
      const backend_message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err.message;
      set_error(backend_message || "Erro ao salvar visibilidade de colunas.");
    } finally {
      set_saving(false);
    }
  };

  if (!local_visibility) {
    return (
      <Modal isOpen={is_open} onClose={on_close}>
        <div className="p-6 text-sm text-gray-200">
          Carregando preferências...
        </div>
      </Modal>
    );
  }

  const render_checkbox = (
    section: keyof UserPreferencesColumnsVisibility,
    field: keyof UserPreferencesColumnsVisibility[typeof section],
    label: string
  ) => {
    const checked = local_visibility[section][field] as boolean;
    return (
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-500"
          checked={checked}
          onChange={handle_toggle(section, field as string)}
        />
        <span>{label}</span>
      </label>
    );
  };

  return (
    <Modal isOpen={is_open} onClose={on_close} className="max-w-[800px] m-4">
      <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-[#111827] p-4 lg:p-8">
        <h4 className="mb-4 text-xl font-semibold text-white">
          Visibilidade de Colunas
        </h4>
        <p className="mb-6 text-sm text-gray-400">
          Selecione quais colunas devem ser exibidas nas telas do sistema.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Transactions */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-200">
              Transactions
            </h5>
            <div className="grid gap-2">
              {render_checkbox("transactions", "username", "Username")}
              {render_checkbox("transactions", "supply_name", "Supply Name")}
              {render_checkbox(
                "transactions",
                "quantity_amended",
                "Quantity Amended"
              )}
              {render_checkbox(
                "transactions",
                "quantity_before",
                "Quantity Before"
              )}
              {render_checkbox(
                "transactions",
                "quantity_after",
                "Quantity After"
              )}
              {render_checkbox("transactions", "created", "Created At")}
              {render_checkbox(
                "transactions",
                "region_code",
                "Region Code"
              )}
              {render_checkbox("transactions", "price_unit", "Price Unit")}
              {render_checkbox("transactions", "total_price", "Total Price")}
              {render_checkbox("transactions", "type_entry", "Type Entry")}
              {render_checkbox("transactions", "obs_alter", "Observation")}
            </div>
          </div>

          {/* Supply */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-200">
              Supply
            </h5>
            <div className="grid gap-2">
              {render_checkbox("supply", "supply_name", "Supply Name")}
              {render_checkbox("supply", "description", "Description")}
              {render_checkbox(
                "supply",
                "regional_prices",
                "Regional Prices"
              )}
              {render_checkbox("supply", "is_active", "Active")}
              {render_checkbox("supply", "created_at", "Created At")}
              {render_checkbox("supply", "updated_at", "Updated At")}
              {render_checkbox("supply", "supply_image", "Image")}
            </div>
          </div>

          {/* Regions */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-200">
              Regions
            </h5>
            <div className="grid gap-2">
              {render_checkbox("regions", "region_code", "Region Code")}
              {render_checkbox("regions", "region_name", "Region Name")}
              {render_checkbox("regions", "city_name", "City")}
              {render_checkbox("regions", "country_name", "Country")}
              {render_checkbox("regions", "state_name", "State")}
              {render_checkbox("regions", "address_code", "Address Code")}
              {render_checkbox(
                "regions",
                "responsible_name",
                "Responsible"
              )}
              {render_checkbox("regions", "is_active", "Active")}
              {render_checkbox(
                "regions",
                "contains_agents_local",
                "Contains Local Agents"
              )}
              {render_checkbox("regions", "latitude", "Latitude")}
              {render_checkbox("regions", "longitude", "Longitude")}
            </div>
          </div>

          {/* User */}
          <div>
            <h5 className="mb-3 text-sm font-semibold text-gray-200">User</h5>
            <div className="grid gap-2">
              {render_checkbox("user", "username", "Username")}
              {render_checkbox("user", "email", "Email")}
              {render_checkbox("user", "first_name", "First Name")}
              {render_checkbox("user", "last_name", "Last Name")}
              {render_checkbox("user", "role", "Role")}
              {render_checkbox("user", "is_active", "Active")}
              {render_checkbox("user", "created_by", "Created By")}
              {render_checkbox("user", "created_at", "Created At")}
              {render_checkbox(
                "user",
                "last_password_reset_date",
                "Last Password Reset"
              )}
              {render_checkbox("user", "is_not_temporary", "Not Temporary")}
              {render_checkbox(
                "user",
                "account_non_expired",
                "Account Non Expired"
              )}
              {render_checkbox(
                "user",
                "account_non_locked",
                "Account Non Locked"
              )}
              {render_checkbox(
                "user",
                "credentials_non_expired",
                "Credentials Non Expired"
              )}
              {render_checkbox("user", "regions", "Regions")}
              {render_checkbox("user", "permissions", "Permissions")}
              {render_checkbox("user", "preferences", "Preferences")}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={on_close}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handle_save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Preferências"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ColumnsVisibilityModal;
