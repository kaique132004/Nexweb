import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { authFetch } from "../../../api/apiAuth";
import { API_ENDPOINTS } from "../../../api/endpoint";

interface RegionTableProps {
    onEditRegion?: (user: RegionAPI) => void;
}


export interface RegionAPI {
    id: string;
    region_code: string;
    region_name: string;
    city_name: string;
    country_name: string;
    state_name: string;
    address_code: string;
    responsible_name: string;
    is_active: boolean;
    contains_agents_local: boolean;
    latitude: string | null;
    longitude: string | null;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    region: RegionAPI | null;
}


export default function RegionTable({ onEditRegion }: RegionTableProps) {
    const [regions, setRegions] = useState<RegionAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        region: null,
    });

    useEffect(() => {
        let cancelled = false;

        const loadRegions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await authFetch<RegionAPI[]>(`${API_ENDPOINTS.region}`);
                if (!cancelled && data) {
                    setRegions(data);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message ?? "Error to load regions");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadRegions();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const handleClick = () => {
            setContextMenu((prev) =>
                prev.visible ? { ...prev, visible: false, region: null } : prev
            );
        };

        if (contextMenu.visible) {
            document.addEventListener("click", handleClick);
        }

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [contextMenu.visible]);

    const handleRowContextMenu = (
        e: React.MouseEvent<HTMLTableRowElement>,
        region: RegionAPI
    ) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            region,
        });
    };

    const getStatusLabel = (region: RegionAPI) => {
        if (region.is_active) return "Active";
        return "Inactive";
    };

    const handleToggleActive = (region: RegionAPI) => {
        console.log("Active/Disable region", region);
        // aqui você faz o PUT/PATCH na API e atualiza o estado
    };

    const handleEditUser = (user: RegionAPI) => {
        onEditRegion?.(user);
    };

    const getStatusColor = (
        region: RegionAPI
    ): "success" | "warning" | "error" => {
        if (region.is_active) return "success";
        return "warning";
    };

    if (loading) {
        return (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="p-4 text-gray-500 text-theme-sm">Loading Regions...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5">
                <div className="p-4 text-red-700 text-theme-sm">
                    Error to load regions: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white relative">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Region Code
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Region Name
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                City
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                State
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Country
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Address Code
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Responsible
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Contains Local Agents
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Coordinates
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {regions.map((region) => (
                            <TableRow
                                key={region.id}
                                onContextMenu={(e) => handleRowContextMenu(e, region)}

                                className="cursor-default hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                {/* Region Code */}
                                <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800">
                                    {region.region_code}
                                </TableCell>

                                {/* Region Name */}
                                <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm">
                                    {region.region_name}
                                </TableCell>

                                {/* City */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.city_name}
                                </TableCell>

                                {/* State */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.state_name}
                                </TableCell>

                                {/* Country */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.country_name}
                                </TableCell>

                                {/* Address Code */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.address_code}
                                </TableCell>

                                {/* Responsible */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.responsible_name}
                                </TableCell>

                                {/* Status */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    <Badge size="sm" color={getStatusColor(region)}>
                                        {getStatusLabel(region)}
                                    </Badge>
                                </TableCell>

                                {/* Contains Local Agents */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                                    {region.contains_agents_local ? "Yes" : "No"}
                                </TableCell>

                                {/* Coordinates */}
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm ">
                                    {region.latitude != null && region.longitude != null
                                        ? `${region.latitude}, ${region.longitude}`
                                        : "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Context menu */}
            {contextMenu.visible && contextMenu.region && (
                <div
                    style={{
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                    className="fixed z-50 min-w-40 rounded-md border border-gray-200 bg-white text-xs shadow-lg dark:border-white/10 dark:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 dark:border-white/5 dark:text-gray-400">
                        {contextMenu.region.region_code} {contextMenu.region.region_name}
                    </div>

                    <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        onClick={() => handleEditUser(contextMenu.region!)}
                    >
                        Edit Region
                    </button>
                    <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        onClick={() => handleToggleActive(contextMenu.region!)}
                    >
                        {contextMenu.region.is_active ? "Disable Region" : "Enable Region"}
                    </button>

                </div>
            )}
        </div>
    );
}
