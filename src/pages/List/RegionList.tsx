import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import RegionTable from "../../components/tables/RegionList/RegionTable";
import Button from "../../components/ui/button/Button";
import type { RegionAPI } from "../../components/Regions/RegionFormModal";
import RegionFormModal from "../../components/Regions/RegionFormModal";

export default function RegionList() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<RegionAPI | any>(null);


    const openCreate = () => {
        setEditingRegion(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
    }
    return (
        <>
            <PageMeta title="Region List | Nexventory" description="Page of Region" />
            <PageBreadcrumb pageTitle="Regions" />
            <ComponentCard
                title="Region"
                desc="Manage Regions"
                actions={
                    <Button
                        size="sm"
                        variant="primary"
                        startIcon={<span className="text-base leading-none">+</span>}
                        onClick={openCreate}
                    >
                        Add new Region
                    </Button>
                }>
                <RegionTable
                    onEditRegion={(region: any) => {
                        setEditingRegion(region);
                        setIsFormOpen(true);
                    }}
                />
            </ComponentCard>

            {/* Modal de Region */}
            <RegionFormModal 
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                region={editingRegion}      // 🔥 se null => create, se tiver region => edit
                onSaved={handleSaved}
            />
        </>
    );
}