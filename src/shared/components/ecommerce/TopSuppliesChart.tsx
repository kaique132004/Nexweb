import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Movement = {
    id: number;
    supply_name: string;
    supply_id: number;
    quantity_amended: number;
    total_price: number;
    type_entry: "IN" | "OUT";
    region_code: string;
};

type TopSuppliesChartProps = {
    data: Movement[];
};

const COLORS = [
    "#465FFF","#FF6B6B","#FFB81C","#4ECDC4","#45B7D1",
    "#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F",
];

export default function TopSuppliesChart({ data }: TopSuppliesChartProps) {
    const { t } = useTranslation();

    const { labels, series, tableRows } = useMemo(() => {
        const totals = new Map<string, { qty: number; cost: number }>();

        data.forEach(m => {
            if (m.type_entry !== "OUT") return;
            const prev = totals.get(m.supply_name) ?? { qty: 0, cost: 0 };
            totals.set(m.supply_name, {
                qty:  prev.qty  + m.quantity_amended,
                cost: prev.cost + m.total_price,
            });
        });

        const sorted = Array.from(totals.entries())
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 10);

        const totalQty = sorted.reduce((s, [, v]) => s + v.qty, 0);

        return {
            labels:    sorted.map(([name]) => name),
            series:    sorted.map(([, v])  => v.qty),
            tableRows: sorted.map(([name, v], idx) => ({
                name,
                qty:  v.qty,
                cost: v.cost,
                pct:  totalQty > 0 ? ((v.qty / totalQty) * 100).toFixed(1) : "0",
                color: COLORS[idx % COLORS.length],
            })),
        };
    }, [data]);

    const options: ApexOptions = {
        chart: {
            type: "donut",
            fontFamily: "Outfit, sans-serif",
            toolbar: { show: false },
        },
        colors: COLORS,
        labels,
        legend: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: "70%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: t("dashboard.total_consumed", "Total"),
                            formatter: (w) => {
                                const total = w.globals.seriesTotals.reduce(
                                    (a: number, b: number) => a + b, 0
                                );
                                return total.toLocaleString("pt-BR");
                            },
                        },
                    },
                },
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) =>
                    `${val.toLocaleString("pt-BR")} ${t("dashboard.units", "units")}`,
            },
        },
        stroke: { width: 0 },
    };

    if (series.length === 0) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
                <p className="text-sm text-gray-400">
                    {t("dashboard.no_data", "No consumption data available.")}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h3 className="font-semibold text-gray-800 dark:text-white/90">
                    {t("dashboard.top_supplies_title", "Top Consumed Supplies")}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                    {t("dashboard.top_supplies_sub", "Top 10 by quantity consumed (OUT)")}
                </p>
            </div>

            <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
                {/* Donut chart */}
                <div className="mx-auto w-full max-w-[200px] shrink-0">
                    <Chart
                        options={options}
                        series={series}
                        type="donut"
                        height={200}
                    />
                </div>

                {/* Legend / table */}
                <div className="min-w-0 flex-1">
                    <div className="custom-scrollbar max-h-[200px] overflow-y-auto">
                        {tableRows.map((row, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between py-1.5 text-sm"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: row.color }}
                                    />
                                    <span className="truncate text-gray-700 dark:text-gray-300">
                                        {row.name}
                                    </span>
                                </div>
                                <div className="ml-3 shrink-0 text-right">
                                    <span className="font-semibold text-gray-800 dark:text-white/80">
                                        {row.qty.toLocaleString("pt-BR")}
                                    </span>
                                    <span className="ml-1 text-xs text-gray-400">
                                        ({row.pct}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
