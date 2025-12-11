import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../assets/icons";
import { useState, useMemo } from "react";

type Movement = {
  id: number;
  username: string;
  supply_name: string;
  supply_id: number;
  quantity_amended: number;
  quantity_before: number;
  quantity_after: number;
  created: string; // ISO string
  region_id: number;
  region_code: string;
  price_unit: number;
  total_price: number;
  type_entry: "IN" | "OUT";
  obs_alter: string | null;
};

type MonthlySalesChartProps = {
  data: Movement[];
  regionFilter?: string; // "GLOBAL" ou region_code
};

const monthShortNames = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

export default function MonthlySalesChart({
  data,
}: MonthlySalesChartProps) {


  const [isOpen, setIsOpen] = useState(false);

  // filtro: "GLOBAL" ou um region_code (ex.: "GRU", "GIG")
  const [regionFilter, setRegionFilter] = useState<"GLOBAL" | string>("GLOBAL");

  // Descobre quais regiões existem no response
  const regionCodes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.region_code) set.add(item.region_code);
    });
    return Array.from(set).sort();
  }, [data]);

  // Processa os dados de acordo com o filtro
  const { categories, seriesData } = useMemo(() => {
    const totalsByMonth: Record<string, number> = {};

    data.forEach((item) => {
      if (item.type_entry !== "OUT") return;

      if (regionFilter !== "GLOBAL" && item.region_code !== regionFilter) {
        return;
      }

      const d = new Date(item.created);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      // quantidade consumida
      totalsByMonth[key] =
        (totalsByMonth[key] || 0) + item.quantity_amended;
    });

    const sortedKeys = Object.keys(totalsByMonth).sort();
    const categories = sortedKeys.map((key) => {
      const [year, monthStr] = key.split("-");
      const monthIndex = Number(monthStr) - 1;
      return `${monthShortNames[monthIndex]} ${year}`;
    });


    const seriesData = sortedKeys.map((key) => totalsByMonth[key]);

    return { categories, seriesData };
  }, [data, regionFilter]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: -30,
        style: {
          fontSize: "11px",
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: "Quantidade consumida",
      },
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) =>
          `${val.toLocaleString("en-US")} unidades`,
      },
 },
  };

  const series = [
    {
      name:
        regionFilter === "GLOBAL"
          ? "Consumo (Global)"
          : `Consumo (${regionFilter})`,
      data: seriesData,
    },
  ];

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800">
            Monthly Consumption
          </h3>
          <p className="text-xs text-gray-500">
            Quantidade consumida por mês ({regionFilter === "GLOBAL" ? "Global" : regionFilter})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de região */}
          <select
            value={regionFilter}
            onChange={(e) =>
              setRegionFilter(
                e.target.value === "GLOBAL" ? "GLOBAL" : e.target.value
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
          >
            <option value="GLOBAL">Global</option>
            {regionCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          {/* Dropdown já existente */}
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
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
