import { DataTable, type ColumnDef } from "../../../components/ui/table/DataTable";
import { API_ENDPOINTS } from "../../../api/endpoint";
import Button from "../../../components/ui/button/Button";

export interface Region {
    id: string;
    region_code: string;
    region_name: string;
    city_name?: string;
    country_name?: string;
    is_active: boolean;
    // ... demais campos
}

interface RegionTableProps {
    onEditRegion: (region: Region) => void;
    refreshTrigger?: number;
}

export default function RegionTable({ onEditRegion, refreshTrigger }: RegionTableProps) {
    const columns: ColumnDef<Region>[] = [
        { key: "region_code", label: "Code" },
        { key: "region_name", label: "Name" },
        { key: "city_name", label: "City" },
        { key: "country_name", label: "Country" },
        {
            key: "is_active",
            label: "Status",
            render: (region) =>
                region.is_active ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Active
          </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            Inactive
          </span>
                ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (region) => (
                <Button size="sm" variant="outline" onClick={() => onEditRegion(region)}>
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <DataTable<Region>
            endpoint={API_ENDPOINTS.region}
            columns={columns}
            rowKey="id"
            refreshTrigger={refreshTrigger}
        />
    );
}