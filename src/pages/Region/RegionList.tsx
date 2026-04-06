/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import PageMeta from "../../components/common/PageMeta.tsx";
import RegionTable from "./Table/RegionTable.tsx";
import Button from "../../components/ui/button/Button.tsx";
import type { Region } from "./Table/RegionTable.tsx";
import RegionFormModal from "./Form/RegionFormModal.tsx";
// import { useTranslation } from "react-i18next"; // REMOVIDO

export default function RegionList() {
    // const { t } = useTranslation(); // REMOVIDO
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [refreshTable, setRefreshTable] = useState(0); // Estado para forçar o refetch da tabela

    const openCreate = () => {
        setEditingRegion(null);
        setIsFormOpen(true);
    };

    const handleSaved = () => {
        setIsFormOpen(false);
        setRefreshTable(prev => prev + 1); // Incrementa para forçar o refetch na tabela
    }

    const handleEditRegion = (region: Region) => {
        setEditingRegion(region);
        setIsFormOpen(true);
    };

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
                    onEditRegion={handleEditRegion}
                    refreshTrigger={refreshTable} // Passa o trigger para a tabela
                />
            </ComponentCard>

            <RegionFormModal
                isOpen={isFormOpen}
                closeModal={() => setIsFormOpen(false)}
                region={editingRegion}
                onSaved={handleSaved}
            />
        </>
    );
}