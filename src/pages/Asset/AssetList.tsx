import { useState } from "react";
import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import AssetTable from "./Table/AssetTable.tsx";
import AssetFormModal from "./Form/AssetFormModal.tsx";
import AssetImportModal from "./AssetImportModal.tsx";
import AssetAuditAllModal from "./AssetAuditAllModal.tsx";
import type { Asset } from "../../shared/types/asset.ts";

// ─── Role helpers ─────────────────────────────────────────────────────────────
function getUserSession() {
  try { return JSON.parse(sessionStorage.getItem("user-session") ?? "{}"); } catch { return {}; }
}
const ADMIN_AND_ABOVE = ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_DEVELOPER", "ROLE_MASTER"];

export default function AssetList() {
  const sessionUser   = getUserSession();
  const isAdmin       = ADMIN_AND_ABOVE.includes(sessionUser?.role ?? "");

  const [isFormOpen,     setIsFormOpen]     = useState(false);
  const [isImportOpen,   setIsImportOpen]   = useState(false);
  const [isAuditAllOpen, setIsAuditAllOpen] = useState(false);
  const [editingAsset,   setEditingAsset]   = useState<Asset | null>(null);
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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                startIcon={<span className="text-base leading-none">🔍</span>}
                onClick={() => setIsAuditAllOpen(true)}
              >
                Audit All
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              startIcon={<span className="text-base leading-none">📥</span>}
              onClick={() => setIsImportOpen(true)}
            >
              Import JSON
            </Button>
            <Button
              size="sm"
              variant="primary"
              startIcon={<span className="text-base leading-none">+</span>}
              onClick={openCreate}
            >
              Add Asset
            </Button>
          </div>
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

      <AssetImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSaved={() => {
          setIsImportOpen(false);
          setRefreshTrigger((t) => t + 1);
        }}
      />

      <AssetAuditAllModal
        isOpen={isAuditAllOpen}
        onClose={() => setIsAuditAllOpen(false)}
        onSaved={() => setRefreshTrigger((t) => t + 1)}
      />
    </>
  );
}
