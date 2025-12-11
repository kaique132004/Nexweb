// src/pages/users/UserFormModal.tsx

import React, { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import type { ApiUser } from "../../components/tables/UserList/UserTable";
import Select from "../../components/form/Select"; // seu Select simples

interface UserFormModalProps {
  isOpen: boolean;
  closeModal: () => void;
  user?: ApiUser | null;              // se tiver user => editar, senão => criar
  onSaved?: (user?: ApiUser) => void; // callback depois de salvar
}

// Payload alinhado com o DTO da API
interface UserFormPayload {
  username: string;
  email: string;
  password: string; // opcional na prática (pode ir vazio)
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  active: boolean;
  is_not_temporary: boolean;
  account_non_expired: boolean;
  account_non_locked: boolean;
  credentials_non_expired: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  closeModal,
  user,
  onSaved,
}) => {
  const isEditMode = !!user;

  const [form, setForm] = useState<UserFormPayload>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    active: true,
    is_not_temporary: true,
    account_non_expired: true,
    account_non_locked: true,
    credentials_non_expired: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // opções para o Select de role
  const roleOptions = [
    { value: "MASTER", label: "MASTER" },
    { value: "ADMIN", label: "ADMIN" },
    { value: "USER", label: "USER" },
    { value: "MANAGER", label: "MANAGER" },
    { value: "SUPERVISOR", label: "SUPERVISOR" },
  ];

  // Preenche o form quando entrar em modo edição / abrir modal
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username ?? "",
        email: user.email ?? "",
        password: "", // não carregamos senha do backend
        // suporta camelCase ou snake_case
        first_name: (user as any).firstName ?? (user as any).first_name ?? "",
        last_name: (user as any).lastName ?? (user as any).last_name ?? "",
        phone: (user as any).phone ?? "",
        role: (user as any).role ?? "",
        active: (user as any).active ?? true,
        is_not_temporary: (user as any).isNotTemporary ?? true,
        account_non_expired: (user as any).accountNonExpired ?? true,
        account_non_locked: (user as any).accountNonLocked ?? true,
        credentials_non_expired:
          (user as any).credentialsNonExpired ?? true,
      });
    } else {
      // reset para criação
      setForm({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "",
        active: true,
        is_not_temporary: true,
        account_non_expired: true,
        account_non_locked: true,
        credentials_non_expired: true,
      });
    }
  }, [user, isOpen]);

  const handleTextChange =
    (field: keyof UserFormPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleCheckboxChange =
    (field: keyof UserFormPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setForm((prev) => ({
        ...prev,
        [field]: checked as any,
      }));
    };

  const handleRoleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Se você quiser NÃO enviar a senha vazia, pode filtrar aqui:
      const payload: any = { ...form };
      if (!payload.password) {
        delete payload.password;
      }

      if (isEditMode && user) {
        // EDITAR
        const updated = await authFetch<ApiUser>(
          `${API_ENDPOINTS.auth}/update/${user.id}`,
          {
            method: "PUT", // ou PATCH conforme sua API
            body: JSON.stringify(payload),
          }
        );
        if (onSaved) onSaved(updated ?? undefined);
      } else {
        // CRIAR
        const created = await authFetch<ApiUser>(
          `${API_ENDPOINTS.auth}/create-user`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        if (onSaved) onSaved(created ?? undefined);
        console.log("Usuário criado:", payload);
      }

      closeModal();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      setError(err.message ?? "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    closeModal();
  };

  const title = isEditMode ? "Edit User" : "Create User";

  const primaryLabel = isEditMode
    ? saving
      ? "Saving..."
      : "Save Changes"
    : saving
      ? "Saving..."
      : "Create User";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-white">{title}</h4>
        </div>

        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-white lg:mb-6">
                User Information
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* First Name */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={form.first_name}
                    onChange={handleTextChange("first_name")}
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={form.last_name}
                    onChange={handleTextChange("last_name")}
                    required
                  />
                </div>

                {/* Username */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Username</Label>
                  <Input
                    type="text"
                    value={form.username}
                    onChange={handleTextChange("username")}
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={handleTextChange("email")}
                    required
                  />
                </div>

                {/* Password (opcional, aparece sempre) */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Password (optional)</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={handleTextChange("password")}
                    placeholder={isEditMode ? "Leave blank to keep current" : ""}
                  />
                </div>

                {/* Phone */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    value={form.phone}
                    onChange={handleTextChange("phone")}
                    placeholder="+55 ..."
                  />
                </div>

                {/* Role (Select) */}
                <div className="col-span-2 lg:col-span-1">
                  <Label>Role</Label>
                  <Select
                    options={roleOptions}
                    placeholder="Select role"
                    defaultValue={form.role}
                    onChange={handleRoleChange}
                    className="dark:bg-[#1e1e1e]"
                  />
                </div>

                {/* Booleans */}
                <div className="col-span-2 flex flex-col gap-2 mt-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm text-white">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={handleCheckboxChange("active")}
                      />
                      Active
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_not_temporary}
                        onChange={handleCheckboxChange("is_not_temporary")}
                      />
                      Not Temporary
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.account_non_expired}
                        onChange={handleCheckboxChange("account_non_expired")}
                      />
                      Account Non Expired
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.account_non_locked}
                        onChange={handleCheckboxChange("account_non_locked")}
                      />
                      Account Non Locked
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.credentials_non_expired}
                        onChange={handleCheckboxChange("credentials_non_expired")}
                      />
                      Credentials Non Expired
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Close
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UserFormModal;
