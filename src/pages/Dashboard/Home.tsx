/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from 'react-i18next';
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "../../api/endpoint";
import { authFetch, AuthFetchError } from "../../api/apiAuth";

type Movement = {
  id: number;
  username: string;
  supply_name: string;
  supply_id: number;
  quantity_amended: number;
  quantity_before: number;
  quantity_after: number;
  created: string;
  region_id: number;
  region_code: string;
  price_unit: number;
  total_price: number;
  type_entry: "IN" | "OUT";
  obs_alter: string | null;
};

type RegionFilter = "GLOBAL" | string;

export default function Home() {
  const { t } = useTranslation();
  const [movement, setMovement] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("GLOBAL");

  // Filtros
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const consumptions = await authFetch<Movement[]>(
          `${API_ENDPOINTS.transaction}/list`
        );

        if (consumptions) {
          setMovement(consumptions);
        }
      } catch (err: any) {
        console.error("Erro ao buscar movimentações:", err);

        if (err instanceof AuthFetchError) {
          if (err.status === 401) {
            setError(t('dashboard.errorLoading'));
          } else if (err.status === 403) {
            setError("You don't have permission to view this data");
          } else if (err.status >= 500) {
            setError("Server error. Please try again later.");
          } else {
            setError(err.message || t('dashboard.errorLoading'));
          }
        } else {
          setError(err?.message || t('dashboard.errorLoading'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Opções de region_code
  const regionCodes = useMemo(() => {
    const set = new Set<string>();
    movement.forEach((m) => {
      if (m.region_code) set.add(m.region_code);
    });
    return Array.from(set).sort();
  }, [movement]);

  const multiRegionOptions = regionCodes;

  // Opções de supplies
  const supplyOptions = useMemo(() => {
    const map = new Map<number, string>();
    movement.forEach((m) => {
      if (!map.has(m.supply_id)) {
        map.set(m.supply_id, m.supply_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [movement]);

  // Aplica filtros
  const filteredMovements = useMemo(() => {
    return movement.filter((m) => {
      if (regionFilter !== "GLOBAL" && m.region_code !== regionFilter) {
        return false;
      }

      if (startDate) {
        const createdDate = new Date(m.created).setHours(0, 0, 0, 0);
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (createdDate < start) return false;
      }

      if (endDate) {
        const createdDate = new Date(m.created).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (createdDate > end) return false;
      }

      if (selectedRegions.length > 0 && !selectedRegions.includes(m.region_code)) {
        return false;
      }

      if (
        selectedSupplies.length > 0 &&
        !selectedSupplies.includes(m.supply_id)
      ) {
        return false;
      }

      return true;
    });
  }, [movement, regionFilter, startDate, endDate, selectedRegions, selectedSupplies]);

  const handleRegionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setSelectedRegions(values);
  };

  const handleSuppliesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((opt) =>
      Number(opt.value)
    );
    setSelectedSupplies(values);
  };

  return (
    <>
      <PageMeta
        title="Dashboard | Nexventory"
        description="Nexventory Application"
      />

      {/* HEADER COM FILTROS */}
      <div className="mb-6">
        {/* Card de Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1e1e1e] lg:p-6">
          {/* Header do Card */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {t('dashboard.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.description')}
            </p>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Filtro de Data Inicial */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('dashboard.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              />
            </div>

            {/* Filtro de Data Final */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('dashboard.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              />
            </div>

            {/* Filtro de Região (simples) */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('dashboard.regionFilter')}
              </label>
              <select
                value={regionFilter}
                onChange={(e) =>
                  setRegionFilter(
                    e.target.value === "GLOBAL" ? "GLOBAL" : e.target.value
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              >
                <option value="GLOBAL">{t('dashboard.global')}</option>
                {regionCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-select de Regiões */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('dashboard.regionsMulti')}
              </label>
              <select
                multiple
                value={selectedRegions}
                onChange={handleRegionsChange}
                className="min-h-[38px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              >
                {multiRegionOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hold Ctrl/Cmd to select multiple
              </p>
            </div>

            {/* Multi-select de Supplies */}
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('dashboard.supplies')}
              </label>
              <select
                multiple
                value={selectedSupplies.map(String)}
                onChange={handleSuppliesChange}
                className="min-h-[38px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              >
                {supplyOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hold Ctrl/Cmd to select multiple
              </p>
            </div>
          </div>

          {/* Botão de Limpar Filtros (opcional) */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setRegionFilter("GLOBAL");
                setSelectedRegions([]);
                setSelectedSupplies([]);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>


      {/* Loading / Erro */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.loadingMovements')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          role="alert"
        >
          <strong className="font-semibold">{t('common.error')}: </strong>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <EcommerceMetrics data={filteredMovements} regionFilter={regionFilter} />
            <MonthlySalesChart data={filteredMovements} regionFilter={regionFilter} />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <MonthlyTarget data={filteredMovements} regionFilter={regionFilter} />
          </div>

          <div className="col-span-12">
            <StatisticsChart data={filteredMovements} regionFilter={regionFilter} />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <DemographicCard />
          </div>

          <div className="col-span-12 xl:col-span-7">
            <RecentOrders />
          </div>
        </div>
      )}
    </>
  );
}
