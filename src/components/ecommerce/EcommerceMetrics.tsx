import { useTranslation } from "react-i18next";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../assets/icons";
import Badge from "../ui/badge/Badge";

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

type EcommerceMetricsProps = {
  data: Movement[];
  regionFilter: string; // "GLOBAL" ou region_code
  previousPeriodData?: Movement[];
};

export default function EcommerceMetrics({
  data,
  regionFilter = "GLOBAL",
  previousPeriodData,
}: EcommerceMetricsProps) {
  const filteredData = data.filter((item) =>
    regionFilter === "GLOBAL" ? true : item.region_code === regionFilter
  );

  const outMovements = filteredData.filter(
    (item) => item.type_entry === "OUT"
  );

  const totalConsumed = outMovements.reduce(
    (sum, item) => sum + item.quantity_amended,
    0
  );

  const totalOrders = outMovements.length;
  const { t } = useTranslation();

  let consumptionChangePercent: number | null = null;
  let ordersChangePercent: number | null = null;

  if (previousPeriodData && previousPeriodData.length > 0) {
    const prevFiltered = previousPeriodData.filter((item) =>
      regionFilter === "GLOBAL" ? true : item.region_code === regionFilter
    );
    const prevOutMovements = prevFiltered.filter(
      (item) => item.type_entry === "OUT"
    );

    const prevTotalConsumed = prevOutMovements.reduce(
      (sum, item) => sum + item.quantity_amended,
      0
    );
    const prevTotalOrders = prevOutMovements.length;

    if (prevTotalConsumed > 0) {
      consumptionChangePercent =
        ((totalConsumed - prevTotalConsumed) / prevTotalConsumed) * 100;
    }

    if (prevTotalOrders > 0) {
      ordersChangePercent =
        ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100;
    }
  }

  const renderChangeBadge = (value: number | null) => {
    if (value === null) {
      return <Badge>N/A</Badge>;
    }

    const isPositive = value >= 0;
    const formatted = `${value.toFixed(2)}%`;

    return (
      <Badge color={isPositive ? "success" : "error"}>
        {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
        {formatted}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Total consumido */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#1e1e1e] dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-[#1e1e1e]">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.total")} ({regionFilter === "GLOBAL" ? "Global" : regionFilter})
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm">
              {totalConsumed.toLocaleString("pt-BR")}
            </h4>
          </div>
          {renderChangeBadge(consumptionChangePercent)}
        </div>
      </div>

      {/* Movimentos de saída */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#1e1e1e] dark:bg-white/3 md:p-6 dark:text-gray-800">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-[#1e1e1e]">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5 dark:text-gray-800">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.movements")}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm">
              {totalOrders.toLocaleString("pt-BR")}
            </h4>
          </div>
          {renderChangeBadge(ordersChangePercent)}
        </div>
      </div>
    </div>
  );
}
