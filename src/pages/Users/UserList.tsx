/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import UserListTable from "./Table/UserTable.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import UserFormModal from "./Form/UserFormModal.tsx";
import type {ApiUser} from "../../shared/types/user.ts";

export default function UserList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const openCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
        triggerRefresh(); // ← dispara reload da tabela
    };

    return (
        <>
            <PageMeta
                title="List User | Nexventory"
                description="Nexventory application"
            />

            <PageBreadcrumb pageTitle="User List" />

            <ComponentCard
                title="User List"
                desc="Manage User of application"
                actions={
                    <Button
                        size="sm"
                        variant="primary"
                        startIcon={<span className="text-base leading-none">+</span>}
                        onClick={openCreate}
                    >
                        Add new User
                    </Button>
                }
            >
                <UserListTable
                    onEditUser={(user: ApiUser) => {
                        setEditingUser(user);
                        setIsFormOpen(true);
                    }}
                    refreshTrigger={refreshTrigger}        // ← estava faltando
                    onRefreshNeeded={triggerRefresh}       // ← para regiões/permissões
                />
            </ComponentCard>

            <UserFormModal
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                user={editingUser}
                onSaved={handleSaved}
            />
        </>
    );
}