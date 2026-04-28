/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import SuppliesTable, { type SupplyList } from "./SuppliesTable.tsx";
import Button from "../../components/ui/button/Button.tsx";
import SupplyFormModal from "./Form/SupplyFormModal.tsx";

export default function SupplyList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<SupplyList | any>(null);


    const openCreate = () => {
        setEditingRegion(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
    }

    return (
        <>
            <PageMeta title="Supply List | Nexventory" description="Control of supplies list" />
            <PageBreadcrumb pageTitle="Supply List" />
            <ComponentCard title="Supply" desc="Manage Supplies" actions={
                <Button
                    size="sm"
                    variant="primary"
                    startIcon={<span className="text-base leading-none">+</span>}
                    onClick={openCreate}
                >
                    Add new Supply
                </Button>
            }>
                <SuppliesTable onEditSupply={(supply: any) => {
                    setEditingRegion(supply);
                    setIsFormOpen(true);
                }}/>
            </ComponentCard>

            {/* Modal de Supply */}
            <SupplyFormModal 
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                supply={editingRegion}      // 🔥 se null => create, se tiver supply => edit
                onSaved={handleSaved}
            />
        </>
    );
}