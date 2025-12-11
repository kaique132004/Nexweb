import { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { type ChartRange } from "../common/ChartTab";

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

type StatisticsChartProps = {
  data: Movement[]; // response da API
  regionFilter?: string;
};

export default function StatisticsChart({
  data,
  regionFilter = "GLOBAL",
}: StatisticsChartProps) {
  const [range] = useState<ChartRange>("monthly");

  const filteredByRegion = useMemo(
    () =>
      data.filter((item) =>
        regionFilter === "GLOBAL" ? true : item.region_code === regionFilter
      ),
    [data, regionFilter]
  );

  const filteredByRange = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;

    if (range === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "quarterly") {
      const currentQuarter = Math.floor(now.getMonth() / 3); // 0-3
      const quarterStartMonth = currentQuarter * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
    } else if (range === "annually") {
      start = new Date(now.getFullYear(), 0, 1);
    }

    return filteredByRegion.filter((item) => {
      if (!start) return true;
      const created = new Date(item.created);
      return created >= start && created <= now;
    });
  }, [filteredByRegion, range]);

  const sorted = [...filteredByRange].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  const categories = sorted.map((item) =>
    new Date(item.created).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const seriesQuantityOut = sorted.map((item) =>
    item.type_entry === "OUT" ? item.quantity_amended : 0
  );

  const seriesTotalPriceOut = sorted.map((item) =>
    item.type_entry === "OUT" ? item.total_price : 0
  );

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
      y: {
        formatter: (val: number, opts) => {
          const seriesName = opts.seriesIndex === 0 ? "Qtd" : "Total";
          return `${seriesName}: ${val}`;
        },
      },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      labels: {
        rotate: -45,
        style: {
          fontSize: "10px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Quantidade OUT",
      data: seriesQuantityOut,
    },
    {
      name: "Total Price OUT", // remova se quiser só quantidade
      data: seriesTotalPriceOut,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Consumo ao longo do tempo
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
