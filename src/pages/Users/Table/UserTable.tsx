import { useEffect, useState } from "react";
import { DataTable, type ColumnDef, type ContextMenuAction } from "../../../components/ui/table/DataTable";
import Badge from "../../../components/ui/badge/Badge";
import { authFetch } from "../../../api/apiAuth";
import { API_ENDPOINTS } from "../../../api/endpoint";
import DualSelectModal from "../Form/DualSelectModal";

export interface PermissionAPI {
  id: number;
  permission_name: string;
  description: string;
  is_active: boolean;
}

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_password_reset_data: string | null;
  is_not_temporary: boolean;
  account_non_expired: boolean;
  account_non_locked: boolean;
  credentials_non_expired: boolean;
  regions: string[];
  permissions: string[];
}

interface UserListTableProps {
  onEditUser?: (user: ApiUser) => void;
  refreshTrigger?: number;
}

export default function UserListTable({ onEditUser, refreshTrigger }: UserListTableProps) {
  const [permissions, setPermissions] = useState<PermissionAPI[]>([]);
  const [regions, setRegions] = useState<Array<{ region_code: string; region_name: string }>>([]);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isRegionModalOpen, setRegionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRegions, setUserRegions] = useState<string[]>([]);

  // Dados auxiliares não paginados
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [permsData, regionsData] = await Promise.all([
          authFetch<PermissionAPI[]>(API_ENDPOINTS.permission),
          authFetch<{ content: Array<{ region_code: string; region_name: string }> }>(
              `${API_ENDPOINTS.region}?page=0&size=999`
          ),
        ]);
        if (!cancelled) {
          if (permsData) setPermissions(permsData);
          if (regionsData?.content) setRegions(regionsData.content);
        }
      } catch (err) {
        console.error("Error loading auxiliary data:", err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const getStatus = (user: ApiUser) => {
    if (user.is_active) return "Active";
    if (!user.account_non_locked) return "Blocked";
    return "Inactive";
  };

  const getStatusColor = (user: ApiUser): "success" | "warning" | "error" => {
    if (user.is_active) return "success";
    if (!user.account_non_locked) return "error";
    return "warning";
  };

  const handleSavePermissions = async (assignedPermissions: string[]) => {
    if (!selectedUser) return;
    const payload = {
      firstName: selectedUser.first_name,
      lastName: selectedUser.last_name,
      role: selectedUser.role,
      isActive: selectedUser.is_active,
      region_codes: selectedUser.regions.map((code) => ({ region_code: code })),
      permissions: assignedPermissions.map((p) => ({ permission_name: p })),
      is_not_temporary: selectedUser.is_not_temporary,
      account_non_expired: selectedUser.account_non_expired,
      account_non_locked: selectedUser.account_non_locked,
      credentials_non_expired: selectedUser.credentials_non_expired,
    };
    try {
      await authFetch(`${API_ENDPOINTS.auth}/update/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setIsPermModalOpen(false);
    } catch (err) {
      console.error("Error saving permissions:", err);
    }
  };

  const handleSaveRegions = async (assignedRegionCodes: string[]) => {
    if (!selectedUser) return;
    const payload = {
      firstName: selectedUser.first_name,
      lastName: selectedUser.last_name,
      role: selectedUser.role,
      isActive: selectedUser.is_active,
      region_codes: assignedRegionCodes.map((code) => ({ region_code: code })),
      permissions: selectedUser.permissions.map((p) => ({ permission_name: p })),
      is_not_temporary: selectedUser.is_not_temporary,
      account_non_expired: selectedUser.account_non_expired,
      account_non_locked: selectedUser.account_non_locked,
      credentials_non_expired: selectedUser.credentials_non_expired,
    };
    try {
      await authFetch(`${API_ENDPOINTS.auth}/update/${selectedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setRegionModalOpen(false);
    } catch (err) {
      console.error("Error saving regions:", err);
    }
  };

  // ─── Colunas ────────────────────────────────────────────────────────────────

  const columns: ColumnDef<ApiUser>[] = [
    {
      key: "name",
      label: "User",
      render: (user) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
              {(user.first_name?.[0] ?? "U") + (user.last_name?.[0] ?? "")}
            </div>
            <div>
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {user.first_name} {user.last_name}
            </span>
              <span className="block text-gray-400 text-theme-xs">
              @{user.username}
            </span>
            </div>
          </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "is_active",
      label: "Status",
      render: (user) => (
          <Badge size="sm" color={getStatusColor(user)}>
            {getStatus(user)}
          </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (user) => new Date(user.created_at).toLocaleString(),
    },
    {
      key: "regions",
      label: "Regions",
      render: (user) => (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {user.regions.length}
        </span>
      ),
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (user) => (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
          {user.permissions.length}
        </span>
      ),
    },
  ];

  // ─── Context menu actions ───────────────────────────────────────────────────

  const contextMenuActions: ContextMenuAction<ApiUser>[] = [
    {
      label: "Edit User",
      onClick: (user) => onEditUser?.(user),
    },
    {
      label: "Set Permissions",
      onClick: (user) => {
        setSelectedUser(user);
        setUserPermissions(user.permissions ?? []);
        setIsPermModalOpen(true);
      },
    },
    {
      label: "Set Regions",
      onClick: (user) => {
        setSelectedUser(user);
        setUserRegions(user.regions ?? []);
        setRegionModalOpen(true);
      },
    },
    {
      label: (user) => (user.is_active ? "Disable User" : "Enable User"),
      onClick: (user) => console.log("Toggle active:", user),
      danger: true,
    },
    {
      label: "Reset Password",
      onClick: async (user) => {
        if (!user.is_active) return;
        try {
          await authFetch(`${API_ENDPOINTS.auth}/reset-own-password/${user.id}`, {
            method: "POST",
          });
        } catch (err) {
          console.error("Error resetting password:", err);
        }
      },
      hidden: (user) => !user.is_active,
    },
  ];

  return (
      <>
        <DataTable<ApiUser>
            endpoint={`${API_ENDPOINTS.auth}/list`}
            columns={columns}
            rowKey="id"
            refreshTrigger={refreshTrigger}
            contextMenuActions={contextMenuActions}
            contextMenuTitle={(user) => `${user.first_name} ${user.last_name}`}
            emptyMessage="No users found."
            loadingMessage="Loading users..."
        />

        <DualSelectModal
            isOpen={isPermModalOpen}
            onClose={() => setIsPermModalOpen(false)}
            title="Set Permissions"
            allOptions={permissions.map((p) => ({
              id: String(p.permission_name),
              label: p.permission_name,
            }))}
            initialSelectedIds={userPermissions}
            onSave={(ids) => handleSavePermissions(ids as string[])}
        />

        <DualSelectModal
            isOpen={isRegionModalOpen}
            onClose={() => setRegionModalOpen(false)}
            title="Set Regions"
            allOptions={regions.map((r) => ({
              id: r.region_code,
              label: r.region_name,
            }))}
            initialSelectedIds={userRegions}
            onSave={(ids) => handleSaveRegions(ids as string[])}
        />
      </>
  );
}