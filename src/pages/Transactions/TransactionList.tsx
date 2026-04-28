import { useState } from "react";

import ComponentCard from "../../shared/components/common/ComponentCard.tsx";
import PageBreadcrumb from "../../shared/components/common/PageBreadCrumb.tsx";
import PageMeta from "../../shared/components/common/PageMeta.tsx";
import TransactionFormModal from "../Supply/TransactionFormModal.tsx";
import TransactionFilterModal from "./TransactionFilterModal.tsx";
import ConsumptionsTable, {
  type TransactionResponse,
} from "../Consumptions/ConsumptionsTable.tsx";
import Button from "../../components/ui/button/Button.tsx";
import { authFetchBlob } from "../../api/apiAuth.ts"; // Import da nova função
import { API_ENDPOINTS } from "../../api/endpoint.ts";

// Interface para os filtros
export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  regionCode?: string;
  supplyName?: string;
  typeEntry?: string;
  username?: string;
}

// Interface para o payload de export
interface ExportPayload {
  dateDays?: number;
  nameSupply?: string[];
  typeEntry?: string;
  regionCodes?: string[];
  quantitySupply?: number;
  user?: string;
  startDate?: string;
  endDate?: string;
}

export default function TransactionList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionResponse | null>(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreate = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setIsFormOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleClose = () => setIsFormOpen(false);

  const openFilterModal = () => {
    setIsFilterOpen(true);
  };

  const handleApplyFilters = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const closeWeek = async () => {
    console.log("Closing week...");
  };

  const exportList = async () => {
    console.log("Exporting list...");
    try {
      setExporting(true);

      // Construir payload baseado nos filtros ativos
      const payload: ExportPayload = {};

      if (filters.startDate) payload.startDate = filters.startDate;
      if (filters.endDate) payload.endDate = filters.endDate;
      if (filters.supplyName) payload.nameSupply = [filters.supplyName];
      if (filters.regionCode) payload.regionCodes = [filters.regionCode];
      if (filters.typeEntry) payload.typeEntry = filters.typeEntry;
      if (filters.username) payload.user = filters.username;

      console.log("Export payload:", payload);

      // Fazer requisição com authFetchBlob
      const { blob, filename } = await authFetchBlob(
        `${API_ENDPOINTS.transaction}/export?format=csv`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename || `consumption-report-${new Date().toISOString().slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Export CSV completed successfully");
    } catch (err: unknown) {
      console.error("Error exporting:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error exporting transactions";
      alert(`Export failed: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <PageMeta
        title="Transaction List | Nexventory"
        description="Create a new register"
      />

      <PageBreadcrumb pageTitle="Transaction List" />

      <ComponentCard
        title="Transaction Table"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={exportList}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export Transaction List"}
            </Button>

            <Button size="sm" onClick={closeWeek}>
              Close Count Week
            </Button>

            <Button
              size="sm"
              variant={activeFiltersCount > 0 ? "primary" : "outline"}
              onClick={openFilterModal}
            >
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

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
          onViewDetails={(tx) => {
            console.log("View details:", tx);
          }}
        />
      </ComponentCard>

      <TransactionFormModal
        isOpen={isFormOpen}
        closeModal={handleClose}
        transaction={editingTransaction}
        onSaved={handleSaved}
      />

      <TransactionFilterModal
        isOpen={isFilterOpen}
        closeModal={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}
