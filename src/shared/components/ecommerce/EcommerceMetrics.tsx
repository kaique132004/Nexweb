import { useTranslation } from "react-i18next";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    BoxIconLine,
    GroupIcon,
} from "../../../assets/icons";
import Badge from "../ui/badge/Badge.tsx";

type Movement = {
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

type EcommerceMetricsProps = {
    data: Movement[];
    regionFilter: string;
    previousPeriodData?: Movement[];
};

export default function EcommerceMetrics({
    data,
    regionFilter = "GLOBAL",
    previousPeriodData,
}: EcommerceMetricsProps) {
    const { t } = useTranslation();

    const filtered = data.filter(m =>
        regionFilter === "GLOBAL" ? true : m.region_code === regionFilter
    );

    const outMovements = filtered.filter(m => m.type_entry === "OUT");
    const inMovements  = filtered.filter(m => m.type_entry === "IN");

    const totalConsumed  = outMovements.reduce((s, m) => s + m.quantity_amended, 0);
    const totalRestocked = inMovements.reduce((s, m) => s + m.quantity_amended, 0);
    const totalCost      = outMovements.reduce((s, m) => s + m.total_price, 0);
    const totalOrders    = outMovements.length;

    // Previous period comparisons
    let consumptionDelta: number | null = null;
    let ordersDelta:      number | null = null;
    let costDelta:        number | null = null;

    if (previousPeriodData && previousPeriodData.length > 0) {
        const prevFiltered = previousPeriodData.filter(m =>
            regionFilter === "GLOBAL" ? true : m.region_code === regionFilter
        );
        const prevOut = prevFiltered.filter(m => m.type_entry === "OUT");
        const prevConsumed = prevOut.reduce((s, m) => s + m.quantity_amended, 0);
        const prevOrders   = prevOut.length;
        const prevCost     = prevOut.reduce((s, m) => s + m.total_price, 0);

        if (prevConsumed > 0) consumptionDelta = ((totalConsumed - prevConsumed) / prevConsumed) * 100;
        if (prevOrders   > 0) ordersDelta      = ((totalOrders   - prevOrders)   / prevOrders)   * 100;
        if (prevCost     > 0) costDelta        = ((totalCost     - prevCost)     / prevCost)     * 100;
    }

    const ChangeBadge = ({ value }: { value: number | null }) => {
        if (value === null) return <Badge>N/A</Badge>;
        const positive = value >= 0;
        return (
            <Badge color={positive ? "success" : "error"}>
                {positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(value).toFixed(1)}%
            </Badge>
        );
    };

    const cards = [
        {
            icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
            label: t("dashboard.total", "Total Consumed") + (regionFilter !== "GLOBAL" ? ` (${regionFilter})` : ""),
            value: totalConsumed.toLocaleString("pt-BR"),
            badge: <ChangeBadge value={consumptionDelta} />,
        },
        {
            icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
            label: t("dashboard.movements", "OUT Transactions"),
            value: totalOrders.toLocaleString("pt-BR"),
            badge: <ChangeBadge value={ordersDelta} />,
        },
        {
            icon: (
                <svg className="size-6 text-gray-800 dark:text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: t("dashboard.total_cost", "Total Cost"),
            value: totalCost.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }),
            badge: <ChangeBadge value={costDelta} />,
        },
        {
            icon: (
                <svg className="size-6 text-gray-800 dark:text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
            label: t("dashboard.total_restocked", "Total Restocked (IN)"),
            value: totalRestocked.toLocaleString("pt-BR"),
            badge: null,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 md:gap-6">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#1e1e1e] dark:bg-white/3 md:p-6"
                >
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-[#1e1e1e]">
                        {card.icon}
                    </div>
                    <div className="flex items-end justify-between mt-5">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {card.label}
                            </span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                                {card.value}
                            </h4>
                        </div>
                        {card.badge}
                    </div>
                </div>
            ))}
        </div>
    );
}
