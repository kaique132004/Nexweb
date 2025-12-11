// CountryMap.tsx
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import { useEffect, useState } from "react";
import { authFetch } from "../../api/apiAuth";
import { API_ENDPOINTS } from "../../api/endpoint";
import type { TransactionResponse } from "../tables/SupplyList/ConsumptionsTable";
import type { RegionAPI } from "../Regions/RegionFormModal";

interface CountryMapProps {
  mapColor?: string;
  // "GLOBAL" = sem filtro; qualquer outro = filtrar por country_code
  countryCode?: string | "GLOBAL";
}

interface Marker {
  latLng: [number, number];
  name: string;
  style: Record<string, any>;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor, countryCode }) => {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [regions, setRegions] = useState<RegionAPI[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transactionRes, regionRes] = await Promise.all([
          authFetch<TransactionResponse[]>(`${API_ENDPOINTS.transaction}/list`),
          authFetch<RegionAPI[]>(`${API_ENDPOINTS.region}`),
        ]);

        if (transactionRes) setTransactions(transactionRes);
        if (regionRes) setRegions(regionRes);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const markers: Marker[] = regions
    // só regiões que aparecem em transações
    .filter(region =>
      transactions.some(tx => tx.region_code === region.region_code)
    )
    // se tiver filtro de país, aplica
    .filter(region =>
      countryCode && countryCode !== "GLOBAL"
        ? region.country_name === countryCode
        : true
    )
    // só com coordenadas válidas
    .filter(region => !!region.latitude && !!region.longitude)
    .map(region => {
      const lat = Number(String(region.latitude).replace(",", "."));
      const lon = Number(String(region.longitude).replace(",", "."));
      const latLng: [number, number] = [lat, lon];

      return {
        latLng,
        name: region.city_name || region.region_code,
        style: {
          fill: "#465FFF",
          borderWidth: 1,
          borderColor: "white",
        },
      };
    })
    .filter(m => !Number.isNaN(m.latLng[0]) && !Number.isNaN(m.latLng[1]));

  // console.log("MARKERS FINAL:", markers);

  if (loading) {
    return <p className="text-center text-gray-500">Carregando mapa...</p>;
  }

  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markers={markers}
      markersSelectable={true}
      markersSelectableOne={true}
      markerStyle={{
        initial: {
          fill: "#465FFF",
          r: 4,
        } as any,
      }}
      zoomOnScroll={true}
      zoomMax={12}
      zoomMin={1}
      zoomAnimate
      zoomStep={1.5}
      regionStyle={{
        initial: {
          fill: mapColor || "#D0D5DD",
          fillOpacity: 1,
          stroke: "none",
        },
        hover: {
          fillOpacity: 0.7,
          cursor: "pointer",
          fill: "#465fff",
        },
        selected: {
          fill: "#465FFF",
        },
      }}
      selectedRegions={
        countryCode && countryCode !== "GLOBAL" ? [countryCode] : []
      }
    />
  );
};

export default CountryMap;
