import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { authFetch } from "../../../api/apiAuth";
import { API_ENDPOINTS } from "../../../api/endpoint";
import DualSelectModal from "../../../pages/Users/DualSelectModal";

interface UserListTableProps {
  onEditUser?: (user: ApiUser) => void;
}

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
  // IMPORTANTE: backend envia como array de string
  regions: string[];
  permissions: string[];
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  user: ApiUser | null;
}

export default function UserListTable({ onEditUser }: UserListTableProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [permissions, setPermissions] = useState<PermissionAPI[]>([]);
  // lista global de regiões: supondo que venha { region_code, region_name }
  const [regions, setRegions] = useState<
    Array<{ region_code: string; region_name: string }>
  >([]);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isRegionModalOpen, setRegionModalOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    user: null,
  });

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRegions, setUserRegions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authFetch<ApiUser[]>(`${API_ENDPOINTS.auth}/list`);
        if (!cancelled && data) {
          setUsers(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Error to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadPermissions = async () => {
      try {
        const data = await authFetch<PermissionAPI[]>(
          `${API_ENDPOINTS.permission}`
        );
        if (!cancelled && data) {
          setPermissions(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Error to load permissions");
      }
    };

    const loadRegions = async () => {
      try {
        const data = await authFetch<
          Array<{ region_code: string; region_name: string }>
        >(`${API_ENDPOINTS.region}`);
        if (!cancelled && data) {
          setRegions(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Error to load regions");
      }
    };

    loadUsers();
    loadPermissions();
    loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fecha o menu de contexto ao clicar em qualquer lugar
  useEffect(() => {
    const handleClick = () => {
      setContextMenu((prev) =>
        prev.visible ? { ...prev, visible: false, user: null } : prev
      );
    };

    if (contextMenu.visible) {
      document.addEventListener("click", handleClick);
    }
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [contextMenu.visible]);

  const getStatus = (user: ApiUser) => {
    if (user.is_active) return "Active";
    if (!user.account_non_locked) return "Blocked";
    return "Inactive";
  };

  const getStatusColor = (
    user: ApiUser
  ): "success" | "warning" | "error" => {
    if (user.is_active) return "success";
    if (!user.account_non_locked) return "error";
    return "warning";
  };

  const handleRowContextMenu = (
    e: React.MouseEvent<HTMLTableRowElement>,
    user: ApiUser
  ) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      user,
    });
  };

  const handleEditUser = (user: ApiUser) => {
    onEditUser?.(user);
  };

  const handleToggleActive = (user: ApiUser) => {
    console.log("Active/Disable user", user);
  };

  const handleResetPassword = async (user: ApiUser) => {
    try {
      setLoading(true);
      if (user.is_active) {
        await authFetch<ApiUser>(
          `${API_ENDPOINTS.auth}/reset-own-password/${user.id}`,
          { method: "POST" }
        );
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------- PERMISSIONS (string[]) --------

  const openPermissionsModal = () => {
    if (!contextMenu.user) return;

    const freshUser = users.find((u) => u.id === contextMenu.user!.id);
    if (!freshUser) return;

    // backend já manda como string[]
    const currentPermNames = freshUser.permissions ?? [];
    setUserPermissions(currentPermNames);
    setIsPermModalOpen(true);

    console.log("Open permissions modal for user:", currentPermNames);
  };

  const handleSavePermissions = async (assignedPermissions: string[]) => {
    const current = contextMenu.user;
    if (!current) return;

    const freshUser = users.find((u) => u.id === current.id) ?? current;

    const payload = {
      firstName: freshUser.first_name,
      lastName: freshUser.last_name,
      role: freshUser.role,
      isActive: freshUser.is_active,

      // REGIÕES ATUAIS (string[])
      region_codes: freshUser.regions.map((code) => ({ region_code: code })),

      // PERMISSÕES NOVAS (string[])
      permissions: assignedPermissions.map((p) => ({ permission_name: p })),

      is_not_temporary: freshUser.is_not_temporary,
      account_non_expired: freshUser.account_non_expired,
      account_non_locked: freshUser.account_non_locked,
      credentials_non_expired: freshUser.credentials_non_expired,
    };

    try {
      await authFetch(`${API_ENDPOINTS.auth}/update/${freshUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedUser: ApiUser = {
        ...freshUser,
        permissions: assignedPermissions, // mantemos como string[]
      };

      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );

      setUserPermissions(assignedPermissions);
      setIsPermModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar permissões:", err);
    }
  };

  // -------- REGIONS (string[]) --------

  const openRegionsModal = () => {
    if (!contextMenu.user) return;

    const freshUser = users.find((u) => u.id === contextMenu.user!.id);
    if (!freshUser) return;

    const currentRegionCodes = freshUser.regions ?? [];
    setUserRegions(currentRegionCodes);
    setRegionModalOpen(true);

    console.log("Open regions modal for user:", currentRegionCodes);
  };

  const handleSaveRegions = async (assignedRegionCodes: string[]) => {
    const current = contextMenu.user;
    if (!current) return;

    const freshUser = users.find((u) => u.id === current.id) ?? current;

    const payload = {
      firstName: freshUser.first_name,
      lastName: freshUser.last_name,
      role: freshUser.role,
      isActive: freshUser.is_active,

      region_codes: assignedRegionCodes.map((code) => ({
        region_code: code,
      })),

      permissions: freshUser.permissions.map((p) => ({
        permission_name: p,
      })),

      is_not_temporary: freshUser.is_not_temporary,
      account_non_expired: freshUser.account_non_expired,
      account_non_locked: freshUser.account_non_locked,
      credentials_non_expired: freshUser.credentials_non_expired,
    };

    try {
      await authFetch(`${API_ENDPOINTS.auth}/update/${freshUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedUser: ApiUser = {
        ...freshUser,
        regions: assignedRegionCodes, // mantemos como string[]
      };

      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );

      setUserRegions(assignedRegionCodes);
      setRegionModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar regiões:", err);
    }
  };

  // -------- RENDER --------

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white ">
        <div className="p-4 text-gray-500 text-theme-sm">Loading User...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5">
        <div className="p-4 text-red-700 text-theme-sm">
          Error to load users: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white relative">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                User
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Email
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Role
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Created At
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Regions
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Permissions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {users.map((user) => (
              <TableRow
                key={user.id}
                onContextMenu={(e) => handleRowContextMenu(e, user)}
                className="cursor-default hover:bg-gray-50 dark:hover:bg-white/5"
              >
                {/* User */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {(user.first_name?.[0] ?? "U") +
                        (user.last_name?.[0] ?? "")}
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {user.email}
                </TableCell>

                {/* Role */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {user.role}
                </TableCell>

                {/* Status */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color={getStatusColor(user)}>
                    {getStatus(user)}
                  </Badge>
                </TableCell>

                {/* Created At */}
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {new Date(user.created_at).toLocaleString()}
                </TableCell>

                {/* Regions */}
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {user.regions.length}
                </TableCell>

                {/* Permissions */}
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {user.permissions.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Context menu */}
      {contextMenu.visible && contextMenu.user && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-40 rounded-md border border-gray-200 bg-white text-xs shadow-lg dark:border-white/10 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 dark:border-white/5 dark:text-gray-400">
            {contextMenu.user.first_name} {contextMenu.user.last_name}
          </div>

          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={() => handleEditUser(contextMenu.user!)}
          >
            Edit User
          </button>

          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={openPermissionsModal}
          >
            Set Permissions
          </button>

          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={openRegionsModal}
          >
            Set Regions
          </button>

          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={() => handleToggleActive(contextMenu.user!)}
          >
            {contextMenu.user.is_active ? "Disable User" : "Enable User"}
          </button>

          <button
            type="button"
            className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            onClick={() => handleResetPassword(contextMenu.user!)}
          >
            Reset Password
          </button>
        </div>
      )}

      {/* Modal de permissões */}
      <DualSelectModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title="Set Permissions"
        allOptions={permissions.map((p) => ({
          id: String(p.permission_name),
          label: p.permission_name,
        }))}
        initialSelectedIds={userPermissions.map(String)}
        onSave={(selectedIds) =>
          handleSavePermissions(selectedIds as string[])
        }
      />

      {/* Modal de regiões */}
      <DualSelectModal
        isOpen={isRegionModalOpen}
        onClose={() => setRegionModalOpen(false)}
        title="Set Regions"
        allOptions={regions.map((r) => ({
          id: String(r.region_code),
          label: r.region_name,
        }))}
        initialSelectedIds={userRegions.map(String)}
        onSave={(selectedIds) => handleSaveRegions(selectedIds as string[])}
      />
    </div>
  );
}
