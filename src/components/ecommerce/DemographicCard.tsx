import { useState, useMemo, useEffect } from "react";
// import { Dropdown } from "../ui/dropdown/Dropdown";
// import { DropdownItem } from "../ui/dropdown/DropdownItem";
// import { MoreDotIcon } from "../../assets/icons";
import CountryMap from "./CountryMap";
import type { RegionAPI } from "../Regions/RegionFormModal";
import type { TransactionResponse } from "../tables/SupplyList/ConsumptionsTable";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import { useTranslation } from "react-i18next";

type ViewMode = "GLOBAL" | "REGIONAL";

interface StatItem {
  id: string;         // chave de agrupamento (país ou região)
  label: string;      // nome exibido (país ou cidade/região)
  quantity: number;   // quantidade consumida (soma de quantity_amended)
  percentage: number; // % da quantidade total
}

type DemographicCardProps = {
  data: TransactionResponse[];
  regionFilter?: string;
};

export default function DemographicCard({
  data,
  regionFilter = "GLOBAL",
}: DemographicCardProps) {
  // const [isOpen, setIsOpen] = useState(false);
  const [viewMode] = useState<ViewMode>("GLOBAL");
  const [selectedCountry] = useState<string | "GLOBAL">("GLOBAL");
  const [regions, setRegions] = useState<RegionAPI[]>([]);
  const {t} = useTranslation();

  // Buscar regiões ao montar o componente
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await authFetch<RegionAPI[]>(`${API_ENDPOINTS.region}`);
        if (response) {
          const regionsData = await response;
          setRegions(regionsData);
        }
      } catch (error) {
        console.error("Erro ao buscar regiões:", error);
      }
    };
    fetchRegions();
  }, []);

  // Filtrar transações
  const transactions = useMemo(() => {
    return data.filter((item) => {
      if (item.type_entry !== "OUT") return false;
      if (regionFilter !== "GLOBAL" && item.region_code !== regionFilter) {
        return false;
      }
      return true;
    });
  }, [data, regionFilter]);


  // function toggleDropdown() {
  //   setIsOpen(!isOpen);
  // }

  // function closeDropdown() {
  //   setIsOpen(false);
  // }

  const effectiveCountryCode = viewMode === "GLOBAL" ? "GLOBAL" : selectedCountry;

  // Mapa rápido de region_code -> RegionAPI
  const regionByCode = useMemo(() => {
    const map = new Map<string, RegionAPI>();
    regions.forEach((r) => {
      if (r.region_code) {
        map.set(r.region_code, r);
      }
    });
    return map;
  }, [regions]);

  /**
   * Cálculo das estatísticas:
   * - GLOBAL: agrupa por país (country_name) e soma quantity_amended
   * - REGIONAL: agrupa por região (region_code) dentro do país selecionado e soma quantity_amended
   */
  const stats: StatItem[] = useMemo(() => {
    if (!transactions.length || !regions.length) return [];

    // mapa id -> { label, quantity }
    const grouped = new Map<string, { label: string; quantity: number }>();

    if (viewMode === "GLOBAL") {
      // Agrupa por country_name (consumo total por país)
      transactions
        .filter((t) => t.type_entry === "OUT")
        .forEach((tx) => {
          const region = regionByCode.get(tx.region_code);
          if (!region || !region.country_name) return;

          const id = region.country_name;
          const prev = grouped.get(id)?.quantity ?? 0;
          const qtyToAdd = tx.quantity_amended ?? 0;

          grouped.set(id, {
            label: region.country_name,
            quantity: prev + qtyToAdd,
          });
        });
    } else {
      // REGIONAL: agrupa por região dentro do país selecionado
      transactions
        .filter((t) => t.type_entry === "OUT")
        .forEach((tx) => {
          const region = regionByCode.get(tx.region_code);
          if (!region || !region.country_name) return;

          // Se um país específico estiver selecionado, filtra por ele
          if (
            selectedCountry !== "GLOBAL" &&
            region.country_name !== selectedCountry
          ) {
            return;
          }

          const id = region.region_code;
          const label = region.city_name || region.region_code;
          const prev = grouped.get(id)?.quantity ?? 0;
          const qtyToAdd = tx.quantity_amended ?? 0;

          grouped.set(id, {
            label,
            quantity: prev + qtyToAdd,
          });
        });
    }

    const entries = Array.from(grouped.entries()).map(
      ([id, { label, quantity }]) => ({
        id,
        label,
        quantity,
        percentage: 0,
      })
    );

    const total = entries.reduce((sum, item) => sum + item.quantity, 0);
    if (!total) return [];

    const withPercent = entries.map((item) => ({
      ...item,
      percentage: Math.round((item.quantity / total) * 100),
    }));

    // Ordena desc por quantidade consumida
    withPercent.sort((a, b) => b.quantity - a.quantity);

    // Limita a 5 principais
    return withPercent.slice(0, 5);
  }, [transactions, regions, regionByCode, viewMode, selectedCountry]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {t("dashboard.supply_usage")}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {t("dashboard.supply_usage_sub")}
          </p>
        </div>
        {/* <div className="relative inline-block">
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
        </div> */}
      </div>

      {/* MAPA */}
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap countryCode={effectiveCountryCode} />
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-5">
        {stats.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="items-center w-full rounded-full max-w-8">
                {/* espaço pra bandeira/ícone se quiser */}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-theme-sm">
                  {item.label}
                </p>
                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                  {item.quantity.toLocaleString("pt-BR")} {t("common.units_consumed")}
                </span>
              </div>
            </div>
            <div className="flex w-full max-w-[140px] items-center gap-3">
              <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                <div
                  className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="font-medium text-gray-800 text-theme-sm">
                {item.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
