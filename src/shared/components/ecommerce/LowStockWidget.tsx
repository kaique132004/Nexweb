import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SupplyOption } from "../../types/supply.ts";

interface LowStockWidgetProps {
    supplies: SupplyOption[];
}

interface LowStockEntry {
    supply_name: string;
    region_code: string;
    quantity: number;
    min_stock_alert: number;
    is_critical: boolean;
}

export default function LowStockWidget({ supplies }: LowStockWidgetProps) {
    const { t } = useTranslation();

    const items: LowStockEntry[] = useMemo(() =>
        supplies
            .filter(s => s.is_active)
            .flatMap(supply =>
                supply.regional_prices
                    .filter(rp => rp.quantity <= rp.min_stock_alert)
                    .map(rp => ({
                        supply_name: supply.supply_name,
                        region_code: rp.region_code,
                        quantity: rp.quantity,
                        min_stock_alert: rp.min_stock_alert,
                        is_critical: rp.quantity === 0,
                    }))
            )
            .sort((a, b) => a.quantity - b.quantity),
        [supplies]
    );

    const criticalCount = items.filter(i => i.is_critical).length;
    const warningCount  = items.length - criticalCount;

    if (items.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/10">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-center">
                    <p className="font-semibold text-green-700 dark:text-green-400">
                        {t("dashboard.low_stock_ok_title", "All supplies OK")}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                        {t("dashboard.low_stock_ok_sub", "No supply is below the minimum alert threshold.")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">
                        {t("dashboard.low_stock_title", "Low Stock Alerts")}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {criticalCount} {t("dashboard.critical", "critical")}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {warningCount} {t("dashboard.warning", "warning")}
                        </span>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="custom-scrollbar max-h-[300px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {items.map((item, idx) => {
                    const pct = item.min_stock_alert > 0
                        ? Math.round((item.quantity / item.min_stock_alert) * 100)
                        : 0;
                    return (
                        <div
                            key={idx}
                            className={`flex items-center justify-between px-5 py-3 ${
                                item.is_critical
                                    ? "bg-red-50/60 dark:bg-red-900/10"
                                    : "bg-amber-50/40 dark:bg-amber-900/5"
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                    {item.supply_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.region_code}
                                </p>
                                {/* Progress bar */}
                                <div className="mt-1.5 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            item.is_critical ? "bg-red-500" : "bg-amber-400"
                                        }`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="ml-4 shrink-0 text-right">
                                <p className={`text-sm font-bold ${
                                    item.is_critical
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-amber-600 dark:text-amber-400"
                                }`}>
                                    {item.quantity}
                                    <span className="ml-0.5 text-xs font-normal text-gray-500"> / {item.min_stock_alert}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    {item.is_critical ? t("dashboard.out_of_stock", "Out of stock") : `${pct}% ${t("dashboard.of_min", "of min")}`}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-2 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                    {items.length} {t("dashboard.supplies_below_threshold", "supplies below minimum threshold")}
                </p>
            </div>
        </div>
    );
}
