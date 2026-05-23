import { useEffect, useState } from "react";

import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import TransactionFormModal from "../Supply/TransactionFormModal.tsx";
import TransactionFilterModal from "./TransactionFilterModal.tsx";
import ExportModal from "./ExportModal.tsx";
import WeeklyCloseModal from "./WeeklyCloseModal.tsx";
import WeeklyClosePendingPanel from "./WeeklyClosePendingPanel.tsx";
import AuditConfigModal from "./AuditConfigModal.tsx";
import ConsumptionsTable from "../Consumptions/ConsumptionsTable.tsx";
import Button from "../../shared/components/ui/button/Button.tsx";
import { authFetch } from "../../api/apiAuth.ts";
import { API_ENDPOINTS } from "../../api/endpoint.ts";
import type { TransactionFilters, TransactionResponse } from "../../shared/types/transaction.ts";

// ─── Role helpers ─────────────────────────────────────────────────────────────
function getUserSession() {
  try { return JSON.parse(sessionStorage.getItem("user-session") ?? "{}"); } catch { return {}; }
}

const SUPERVISOR_ROLES = ["ROLE_SUPERVISOR","ROLE_MANAGER","ROLE_ADMIN","ROLE_MASTER","ROLE_DEVELOPER"];

export default function TransactionList() {
  const user = getUserSession();
  const isSupervisor = SUPERVISOR_ROLES.includes(user?.role);

  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isFilterOpen,  setIsFilterOpen]  = useState(false);
  const [isExportOpen,  setIsExportOpen]  = useState(false);
  const [isCloseOpen,   setIsCloseOpen]   = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isAuditOpen,   setIsAuditOpen]   = useState(false);

  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [filters,    setFilters]    = useState<TransactionFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Pending count badge for supervisors
  const [pendingCount, setPendingCount] = useState(0);

  const loadPendingCount = async () => {
    if (!isSupervisor) return;
    try {
      const data = await authFetch<{ id: number }[]>(`${API_ENDPOINTS.weeklyClose}/pending`);
      setPendingCount(data?.length ?? 0);
    } catch {
      // silently fail — just hide badge
    }
  };

  useEffect(() => { loadPendingCount(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditingTransaction(null); setIsFormOpen(true); };
  const handleSaved = () => { setIsFormOpen(false); setRefreshKey((p) => p + 1); };
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <PageMeta title="Transaction List | Nexventory" description="Create a new register" />
      <PageBreadcrumb pageTitle="Transaction List" />

      <ComponentCard
        title="Transaction Table"
        actions={
          <>
            {/* Export */}
            <Button size="sm" variant="outline" onClick={() => setIsExportOpen(true)}>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                </svg>
                Export
              </span>
            </Button>

            {/* Pending closes badge — Supervisor only */}
            {isSupervisor && (
              <div className="relative">
                <Button size="sm" variant="outline" onClick={() => setIsPendingOpen(true)}>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                    <span className="hidden sm:inline">Pending Closes</span>
                  </span>
                </Button>
                {pendingCount > 0 && (
                  <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>
            )}

            {/* Audit Config — Supervisor only */}
            {isSupervisor && (
              <Button size="sm" variant="outline" onClick={() => setIsAuditOpen(true)}>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="hidden sm:inline">Audit Config</span>
                </span>
              </Button>
            )}

            {/* Close Count Week */}
            <Button size="sm" variant="outline" onClick={() => setIsCloseOpen(true)}>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                Close Count Week
              </span>
            </Button>

            {/* Filter */}
            <Button
              size="sm"
              variant={activeFiltersCount > 0 ? "primary" : "outline"}
              onClick={() => setIsFilterOpen(true)}
            >
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* Register */}
            <Button
              size="sm"
              variant="primary"
              startIcon={<span className="text-base leading-none">+</span>}
              onClick={openCreate}
            >
              Register new Consumption
            </Button>
          </>
        }
      >
        <ConsumptionsTable
          filters={filters}
          refreshKey={refreshKey}
          onViewDetails={(tx) => { console.log("View details:", tx); }}
        />
      </ComponentCard>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormOpen}
        closeModal={() => setIsFormOpen(false)}
        transaction={editingTransaction}
        onSaved={handleSaved}
      />

      <TransactionFilterModal
        isOpen={isFilterOpen}
        closeModal={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filters={filters}
      />

      <WeeklyCloseModal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        onSuccess={() => { setRefreshKey((p) => p + 1); loadPendingCount(); }}
      />

      {isSupervisor && (
        <WeeklyClosePendingPanel
          isOpen={isPendingOpen}
          onClose={() => setIsPendingOpen(false)}
          onResolved={() => { loadPendingCount(); setRefreshKey((p) => p + 1); }}
        />
      )}

      {isSupervisor && (
        <AuditConfigModal
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
        />
      )}
    </>
  );
}
