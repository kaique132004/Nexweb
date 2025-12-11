import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../assets/icons";

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

type MonthlyTargetProps = {
  data: Movement[];
  regionFilter?: string; // "GLOBAL" ou region_code
};

export default function MonthlyTarget({
  data,
  regionFilter = "GLOBAL",
}: MonthlyTargetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const {
    currentMonthConsumption,
    previousMonthConsumption,
    progressPercentReal,
  } = useMemo(() => {
    let current = 0;
    let previous = 0;

    data.forEach((item) => {
      if (item.type_entry !== "OUT") return;
      if (regionFilter !== "GLOBAL" && item.region_code !== regionFilter) {
        return;
      }

      const d = new Date(item.created);
      const year = d.getFullYear();
      const month = d.getMonth();

      const isCurrent = year === currentYear && month === currentMonth;
      const isPrevSameYear = year === currentYear && month === currentMonth - 1;
      const isPrevDecLastYear =
        currentMonth === 0 && year === currentYear - 1 && month === 11;
      const isPrevious = isPrevSameYear || isPrevDecLastYear;

      if (isCurrent) {
        current += item.quantity_amended;
      }

      if (isPrevious) {
        previous += item.quantity_amended;
      }
    });

    let progressPercentReal = 0;

    if (previous > 0) {
      // 100% = mesmo uso do mês passado; >100 = usou mais; <100 = usou menos
      progressPercentReal = (current / previous) * 100;
    } else if (current > 0) {
      // se não teve consumo no mês passado mas tem agora, define como 150% simbólico
      progressPercentReal = 150;
    }

    return {
      currentMonthConsumption: current,
      previousMonthConsumption: previous,
      progressPercentReal,
    };
  }, [data, regionFilter, currentYear, currentMonth]);

  // Valor clamped para o radial (0–100), mas guardando o real pra label
  const progressClamped = Math.max(
    0,
    Math.min(100, progressPercentReal || 0)
  );
  const series = [Number(progressClamped.toFixed(2))];

  // Diferença percentual: +X% ou -Y% (bom quando é negativo)
  let diffPercent: number | null = null;
  if (previousMonthConsumption > 0) {
    diffPercent =
      ((currentMonthConsumption - previousMonthConsumption) /
        previousMonthConsumption) *
      100;
  }

  const isLessUsage = diffPercent !== null && diffPercent < 0; // menos uso = bom pois gasto menor

  const diffLabel =
    diffPercent === null
      ? "N/A"
      : `${diffPercent >= 0 ? "+" : ""}${diffPercent.toFixed(1)}%`;

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "32px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function () {
              if (
                !progressPercentReal ||
                !Number.isFinite(progressPercentReal)
              ) {
                return "0%";
              }
              // aqui mostra o valor real, então pode aparecer 120%, 80% etc.
              return `${progressPercentReal.toFixed(1)}%`;
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-[#1e1e1e] dark:bg-white/3">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-[#1e1e1e] sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Target
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-[#FFB81C]">
              Comparação com o mês anterior (
              {regionFilter === "GLOBAL" ? "Global" : regionFilter})
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          {/* Badge de variação: se consumo caiu, isso é "bom" */}
          <span
            className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
              diffPercent === null
                ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
                : isLessUsage
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
            }`}
          >
            {diffLabel}
          </span>
        </div>

        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Mês atual consumiu{" "}
          <strong>{currentMonthConsumption.toLocaleString("pt-BR")}</strong>{" "}
          unidades, comparado com{" "}
          <strong>{previousMonthConsumption.toLocaleString("pt-BR")}</strong>{" "}
          no mês anterior (
          {progressPercentReal
            ? `${progressPercentReal.toFixed(1)}% do mês anterior`
            : "sem histórico suficiente"}
          ). Menor uso significa menor gasto com suprimentos.
        </p>
      </div>
    </div>
  );
}
