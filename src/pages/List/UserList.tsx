import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserListTable, { type ApiUser } from "../../components/tables/UserList/UserTable";
import Button from "../../components/ui/button/Button";
import UserFormModal from "../Users/UserFormModal";

export default function UserList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

    const openCreate = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
        // aqui você pode disparar um refetch na tabela
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
                    onEditUser={(user: any) => {
                        setEditingUser(user);
                        setIsFormOpen(true);
                    }}
                />
            </ComponentCard>

            <UserFormModal
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                user={editingUser}      // 🔥 se null => create, se tiver user => edit
                onSaved={handleSaved}
            />
        </>
    );
}
