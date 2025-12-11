import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SuppliesTable, { type SupplyList } from "../../components/tables/SupplyList/SuppliesTable";
import Button from "../../components/ui/button/Button";
import SupplyFormModal from "../../components/Supply/SupplyFormModal";

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