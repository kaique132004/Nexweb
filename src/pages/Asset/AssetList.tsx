import { useState } from "react";
import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import AssetTable from "./Table/AssetTable.tsx";
import AssetFormModal from "./Form/AssetFormModal.tsx";
import type { Asset } from "../../shared/types/asset.ts";

export default function AssetList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const openCreate = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setIsFormOpen(false);
    setRefreshTrigger((t) => t + 1);
  };

  return (
    <>
      <PageMeta title="Assets | Nexventory" description="CMDB — asset lifecycle management" />
      <PageBreadcrumb pageTitle="Assets" />

      <ComponentCard
        title="Assets"
        desc="Track equipment lifecycle — stock, assignment, maintenance and transfers"
        actions={
          <Button
            size="sm"
            variant="primary"
            startIcon={<span className="text-base leading-none">+</span>}
            onClick={openCreate}
          >
            Add Asset
          </Button>
        }
      >
        <AssetTable
          refreshTrigger={refreshTrigger}
          onEditAsset={(asset) => {
            setEditingAsset(asset);
            setIsFormOpen(true);
          }}
          onRefresh={() => setRefreshTrigger((t) => t + 1)}
        />
      </ComponentCard>

      <AssetFormModal
        isOpen={isFormOpen}
        closeModal={() => setIsFormOpen(false)}
        asset={editingAsset}
        onSaved={handleSaved}
      />
    </>
  );
}
