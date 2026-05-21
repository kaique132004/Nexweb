import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Movement = {
    id: number;
    supply_name: string;
    supply_id: number;
    quantity_amended: number;
    created_at: string;
    region_code: string;
    type_entry: "IN" | "OUT";
};

type MonthlySalesChartProps = {
    data: Movement[];
    regionFilter?: string;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MonthlySalesChart({ data, regionFilter = "GLOBAL" }: MonthlySalesChartProps) {
    const { t } = useTranslation();

    const { categories, outSeries, inSeries } = useMemo(() => {
        const outByMonth: Record<string, number> = {};
        const inByMonth:  Record<string, number> = {};

        data.forEach(m => {
            if (regionFilter !== "GLOBAL" && m.region_code !== regionFilter) return;

            const d     = new Date(m.created_at);
            const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

            if (m.type_entry === "OUT") {
                outByMonth[key] = (outByMonth[key] ?? 0) + m.quantity_amended;
            } else if (m.type_entry === "IN") {
                inByMonth[key]  = (inByMonth[key]  ?? 0) + m.quantity_amended;
            }
        });

        const allKeys = Array.from(
            new Set([...Object.keys(outByMonth), ...Object.keys(inByMonth)])
        ).sort();

        const categories = allKeys.map(key => {
            const [year, month] = key.split("-");
            return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
        });

        return {
            categories,
            outSeries: allKeys.map(k => outByMonth[k] ?? 0),
            inSeries:  allKeys.map(k => inByMonth[k]  ?? 0),
        };
    }, [data, regionFilter]);

    const options: ApexOptions = {
        colors: ["#465fff", "#22c55e"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 200,
            toolbar: { show: false },
            stacked: false,
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "55%",
                borderRadius: 4,
                borderRadiusApplication: "end",
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 3, colors: ["transparent"] },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks:  { show: false },
            labels: {
                rotate: -30,
                style: { fontSize: "11px" },
            },
        },
        yaxis: {
            title: { text: t("dashboard.quantity", "Quantity") },
            labels: { style: { fontSize: "11px" } },
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "left",
            fontFamily: "Outfit",
        },
        grid: { yaxis: { lines: { show: true } } },
        fill:    { opacity: 1 },
        tooltip: {
            x: { show: true },
            y: {
                formatter: (val: number) => `${val.toLocaleString("pt-BR")} ${t("dashboard.units", "units")}`,
            },
        },
    };

    const series = [
        {
            name: t("dashboard.consumed_out", "Consumed (OUT)"),
            data: outSeries,
        },
        {
            name: t("dashboard.restocked_in", "Restocked (IN)"),
            data: inSeries,
        },
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {t("dashboard.monthly_consumption", "Monthly Consumption")}
                </h3>
                <p className="text-xs text-gray-500">
                    {t("dashboard.monthly_consumption_sub", "OUT vs IN per month")}
                    {regionFilter !== "GLOBAL" && ` · ${regionFilter}`}
                </p>
            </div>
            <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
                    <Chart options={options} series={series} type="bar" height={200} />
                </div>
            </div>
        </div>
    );
}
