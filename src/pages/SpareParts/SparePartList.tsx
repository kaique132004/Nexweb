import { useState } from "react";
import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import SparePartTable from "./Table/SparePartTable.tsx";
import SparePartFormModal from "./Form/SparePartFormModal.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import type { SparePart } from "../../shared/types/spare-part.ts";

export default function SparePartList() {
    const [isFormOpen, setIsFormOpen]       = useState(false);
    const [editingPart, setEditingPart]     = useState<SparePart | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const openCreate = () => {
        setEditingPart(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
        setEditingPart(null);
        setRefreshTrigger((t) => t + 1);
    };

    return (
        <>
            <PageMeta title="Spare Parts | Nexventory" description="Spare parts catalogue for asset maintenance" />
            <PageBreadcrumb pageTitle="Spare Parts" />

            <ComponentCard
                title="Spare Parts"
                desc="Manage the catalogue of spare parts used in asset maintenance"
                actions={
                    <Button
                        size="sm"
                        variant="primary"
                        startIcon={<span className="text-base leading-none">+</span>}
                        onClick={openCreate}
                    >
                        Add Spare Part
                    </Button>
                }
            >
                <SparePartTable
                    onEdit={(part) => {
                        setEditingPart(part);
                        setIsFormOpen(true);
                    }}
                    refreshTrigger={refreshTrigger}
                />
            </ComponentCard>

            <SparePartFormModal
                isOpen={isFormOpen}
                sparePart={editingPart}
                onClose={() => setIsFormOpen(false)}
                onSaved={handleSaved}
            />
        </>
    );
}
