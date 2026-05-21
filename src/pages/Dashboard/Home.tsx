/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import EcommerceMetrics       from "../../shared/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart      from "../../shared/components/ecommerce/MonthlySalesChart";
import StatisticsChart        from "../../shared/components/ecommerce/StatisticsChart";
import MonthlyTarget          from "../../shared/components/ecommerce/MonthlyTarget";
import RecentOrders           from "../../shared/components/ecommerce/RecentOrders";
import DemographicCard        from "../../shared/components/ecommerce/DemographicCard";
import LowStockWidget         from "../../shared/components/ecommerce/LowStockWidget";
import TopSuppliesChart       from "../../shared/components/ecommerce/TopSuppliesChart";
import PageMeta               from "../../shared/components/common/PageMeta";
import { useEffect, useMemo, useState, useCallback } from "react";
import { API_ENDPOINTS }      from "../../api/endpoint";
import { authFetch, AuthFetchError } from "../../api/apiAuth";
import type { PageableResponse } from "../../shared/types/common.ts";
import type { SupplyOption }   from "../../shared/types/supply.ts";

export type Movement = {
    id: number;
    username: string;
    supply_name: string;
    supply_id: number;
    quantity_amended: number;
    quantity_before: number;
    quantity_after: number;
    created_at: string;
    region_id: number;
    region_code: string;
    price_unit: number;
    total_price: number;
    type_entry: "IN" | "OUT";
    obs_alter: string | null;
};

// ── helpers ──────────────────────────────────────────────────────────────────
function toISO(date: Date) {
    return date.toISOString().split("T")[0];
}

function daysAgo(n: number) {
    return toISO(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

// ── component ────────────────────────────────────────────────────────────────
export default function Home() {
    const { t } = useTranslation();

    // transactions
    const [movement, setMovement] = useState<Movement[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    // supplies (for low-stock widget)
    const [supplies, setSupplies] = useState<SupplyOption[]>([]);

    // filters — default: last 90 days
    const [startDate,       setStartDate]       = useState<string>(daysAgo(90));
    const [endDate,         setEndDate]         = useState<string>(toISO(new Date()));
    const [regionFilter,    setRegionFilter]    = useState<string>("GLOBAL");
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedSupplies,setSelectedSupplies]= useState<number[]>([]);

    // ── data loading ─────────────────────────────────────────────────────────

    const loadMovements = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const body: Record<string, any> = {};
            if (startDate) body.startDate = startDate;
            if (endDate)   body.endDate   = endDate;
            if (!startDate && !endDate) body.dateDays = 90;

            const response = await authFetch<Movement[] | PageableResponse<Movement>>(
                `${API_ENDPOINTS.transaction}/finder`,
                { method: "POST", body: JSON.stringify(body) }
            );

            if (response === null) {
                setMovement([]);
            } else if (Array.isArray(response)) {
                setMovement(response);
            } else if (Array.isArray((response as any).content)) {
                setMovement((response as PageableResponse<Movement>).content);
            } else {
                setMovement([]);
            }
        } catch (err: any) {
            console.error("Error loading movements:", err);
            if (err instanceof AuthFetchError) {
                if (err.status === 403) {
                    setError(t("dashboard.errorForbidden", "You do not have permission to view this data."));
                } else if (err.status === 401) {
                    setError(t("dashboard.errorLoading", "Session expired. Please log in again."));
                } else if (err.status >= 500) {
                    setError(t("dashboard.errorServer", "Server error. Please try again later."));
                } else {
                    setError(err.message || t("dashboard.errorLoading", "Failed to load data."));
                }
            } else {
                setError(err?.message || t("dashboard.errorLoading", "Failed to load data."));
            }
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, t]);

    const loadSupplies = useCallback(async () => {
        try {
            const response = await authFetch<PageableResponse<SupplyOption>>(
                `${API_ENDPOINTS.supply}/list?page=0&size=500`
            );
            if (response && Array.isArray(response.content)) {
                setSupplies(response.content);
            }
        } catch (err) {
            console.warn("Could not load supplies for stock widget:", err);
        }
    }, []);

    useEffect(() => { loadMovements(); }, [loadMovements]);
    useEffect(() => { loadSupplies();  }, [loadSupplies]);

    // ── derived state ─────────────────────────────────────────────────────────

    const regionCodes = useMemo(() => {
        const set = new Set<string>();
        movement.forEach(m => { if (m.region_code) set.add(m.region_code); });
        return Array.from(set).sort();
    }, [movement]);

    const supplyOptions = useMemo(() => {
        const map = new Map<number, string>();
        movement.forEach(m => { if (!map.has(m.supply_id)) map.set(m.supply_id, m.supply_name); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [movement]);

    const filteredMovements = useMemo(() => {
        return movement.filter(m => {
            if (regionFilter !== "GLOBAL" && m.region_code !== regionFilter) return false;
            if (selectedRegions.length  > 0 && !selectedRegions.includes(m.region_code))    return false;
            if (selectedSupplies.length > 0 && !selectedSupplies.includes(m.supply_id))     return false;
            return true;
        });
    }, [movement, regionFilter, selectedRegions, selectedSupplies]);

    // ── event handlers ────────────────────────────────────────────────────────

    const clearFilters = () => {
        setStartDate(daysAgo(90));
        setEndDate(toISO(new Date()));
        setRegionFilter("GLOBAL");
        setSelectedRegions([]);
        setSelectedSupplies([]);
    };

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <>
            <PageMeta title="Dashboard | Nexventory" description="Nexventory Application" />

            {/* ── FILTER CARD ──────────────────────────────────────────── */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1e1e1e] lg:p-6">
                <div className="mb-5">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        {t("dashboard.title", "Dashboard")}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t("dashboard.description", "Monitor supply usage and inventory status.")}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {/* Start date */}
                    <div className="flex flex-col">
                        <label className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t("dashboard.startDate", "Start Date")}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>

                    {/* End date */}
                    <div className="flex flex-col">
                        <label className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t("dashboard.endDate", "End Date")}
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        />
                    </div>

                    {/* Region (single) */}
                    <div className="flex flex-col">
                        <label className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t("dashboard.regionFilter", "Region")}
                        </label>
                        <select
                            value={regionFilter}
                            onChange={e => setRegionFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="GLOBAL">{t("dashboard.global", "All Regions")}</option>
                            {regionCodes.map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Regions (multi) */}
                    <div className="flex flex-col">
                        <label className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t("dashboard.regionsMulti", "Filter Regions")}
                            {selectedRegions.length > 0 && (
                                <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                    {selectedRegions.length}
                                </span>
                            )}
                        </label>
                        <select
                            multiple
                            value={selectedRegions}
                            onChange={e => setSelectedRegions(Array.from(e.target.selectedOptions).map(o => o.value))}
                            className="min-h-[38px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            {regionCodes.map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Supplies (multi) */}
                    <div className="flex flex-col">
                        <label className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                            {t("dashboard.supplies", "Supplies")}
                            {selectedSupplies.length > 0 && (
                                <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                    {selectedSupplies.length}
                                </span>
                            )}
                        </label>
                        <select
                            multiple
                            value={selectedSupplies.map(String)}
                            onChange={e => setSelectedSupplies(Array.from(e.target.selectedOptions).map(o => Number(o.value)))}
                            className="min-h-[38px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            {supplyOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        {loading
                            ? t("dashboard.loadingMovements", "Loading…")
                            : `${filteredMovements.length.toLocaleString("pt-BR")} ${t("dashboard.transactions_loaded", "transactions loaded")}`
                        }
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={clearFilters}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            {t("common.clear_filter", "Clear Filters")}
                        </button>
                        <button
                            onClick={loadMovements}
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t("common.loading", "Loading…") : t("common.apply", "Apply")}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── ERROR ────────────────────────────────────────────────── */}
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
                    <strong className="font-semibold">{t("common.error", "Error")}: </strong>
                    {error}
                </div>
            )}

            {/* ── LOADING ──────────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            {t("dashboard.loadingMovements", "Loading movements…")}
                        </p>
                    </div>
                </div>
            )}

            {/* ── DASHBOARD GRID ───────────────────────────────────────── */}
            {!loading && !error && (
                <div className="grid grid-cols-12 gap-4 md:gap-6">

                    {/* Row 1: KPI metrics (full width) */}
                    <div className="col-span-12">
                        <EcommerceMetrics data={filteredMovements} regionFilter={regionFilter} />
                    </div>

                    {/* Row 2: Monthly chart + Monthly target */}
                    <div className="col-span-12 xl:col-span-8">
                        <MonthlySalesChart data={filteredMovements} regionFilter={regionFilter} />
                    </div>
                    <div className="col-span-12 xl:col-span-4">
                        <MonthlyTarget data={filteredMovements} regionFilter={regionFilter} />
                    </div>

                    {/* Row 3: Low stock alerts + Top supplies */}
                    <div className="col-span-12 xl:col-span-5">
                        <LowStockWidget supplies={supplies} />
                    </div>
                    <div className="col-span-12 xl:col-span-7">
                        <TopSuppliesChart data={filteredMovements} />
                    </div>

                    {/* Row 4: Statistics chart (full width) */}
                    <div className="col-span-12">
                        <StatisticsChart data={filteredMovements} regionFilter={regionFilter} />
                    </div>

                    {/* Row 5: Demographic map + Recent orders */}
                    <div className="col-span-12 xl:col-span-5">
                        <DemographicCard data={filteredMovements} regionFilter={regionFilter} />
                    </div>
                    <div className="col-span-12 xl:col-span-7">
                        <RecentOrders />
                    </div>
                </div>
            )}
        </>
    );
}
