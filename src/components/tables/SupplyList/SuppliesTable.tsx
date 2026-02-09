import { useEffect, useState } from "react";
import { authFetch } from "../../../api/apiAuth";
import { API_ENDPOINTS } from "../../../api/endpoint";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import SupplyRegionalPricesModal from "../../Supply/SupplyRegionalPricesModal";

interface SuppliesTableProps {
    onEditSupply?: (supply: SupplyList) => void;
}

export interface RegionControlSupply {
    id: string;
    region_id: number;
    region_code: string;
    currency: string;
    supplier: string;
    price: number;
    quantity: number;
}

export interface SupplyList {
    id: string;
    supply_name: string;
    description: string;
    regional_prices: RegionControlSupply[];
    is_active: boolean;
    created_at: string;
    supply_images: string[];
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    supply: SupplyList | null;
}

export default function SuppliesTable({ onEditSupply }: SuppliesTableProps) {
    const [supplies, setSupplies] = useState<SupplyList[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // modal de regional prices
    const [regionalPricesModalOpen, setRegionalPricesModalOpen] = useState(false);
    const [selectedSupplyForPrices, setSelectedSupplyForPrices] = useState<SupplyList | null>(null);

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        supply: null,
    });

    let cancelled = false;

    const loadSupply = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await authFetch<SupplyList[]>(`${API_ENDPOINTS.supply}/list`);
            if (!cancelled && data) {
                setSupplies(data);
            }

        } catch (err: any) {
            if (!cancelled) setError(err.message ?? "Failed to load supplies.");
        } finally {
            if (!cancelled) setLoading(false);
        }
    };

    useEffect(() => {
        loadSupply();
    }, []);

    useEffect(() => {
        const handleClick = () => {
            setContextMenu((prev) =>
                prev.visible ? { ...prev, visible: false, user: null } : prev
            );
        };

        if (contextMenu.visible) {
            document.addEventListener("click", handleClick);
        }
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [contextMenu.visible]);

    const getStatus = (supply: SupplyList) => {
        if (supply.is_active) return "Active";
        return "Inactive";
    }

    const getStatusColor = (
        supply: SupplyList
    ): "success" | "warning" | "error" => {
        if (supply.is_active) return "success";
        return "warning";
    };

    const handleRowContextMenu = (
        e: React.MouseEvent<HTMLTableRowElement>,
        supply: SupplyList
    ) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            supply,
        });
    };

    const handleEditSupply = (supply: SupplyList) => {
        onEditSupply?.(supply);
    };

    const handleOpenRegionalPrices = (supply: SupplyList) => {
        setSelectedSupplyForPrices(supply);
        setRegionalPricesModalOpen(true);
        setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    const handleToggleActive = async (supply: SupplyList) => {
        // sua lógica de ativar/desativar aqui
        // ex: chamar API, depois atualizar lista
        setContextMenu((prev) => ({ ...prev, visible: false }));
        console.log("Toggling active for supply:", supply.id);
    };


    if (loading) {
        return (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white ">
                <div className="p-4 text-gray-500 text-theme-sm">Loading Supplies...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5">
                <div className="p-4 text-red-700 text-theme-sm">
                    Error to load supplies: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white relative">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Supply Name
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Description
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Created At
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Regional Prices
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {supplies.map((supply) => (
                            <TableRow
                                key={supply.id}
                                onContextMenu={(e) => handleRowContextMenu(e, supply)}

                                className="cursor-default hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800">
                                    {supply.supply_name}
                                </TableCell>

                                <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800">
                                    {supply.description}
                                </TableCell>

                                <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800">
                                    {new Date(supply.created_at).toLocaleString()}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                    <Badge size="sm" color={getStatusColor(supply)}>
                                        {getStatus(supply)}
                                    </Badge>
                                </TableCell>

                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                    {supply.regional_prices.map((rp) => (
                                        <div key={rp.id} className="mb-1">
                                            <span className="font-medium">{rp.region_code}:</span>{" "}
                                            {rp.currency} QTY: {rp.quantity}
                                        </div>
                                    ))}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {contextMenu.visible && contextMenu.supply && (
                <div
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="fixed z-50 min-w-40 rounded-md border border-gray-200 bg-white text-xs shadow-lg dark:border-white/10 dark:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 dark:border-white/5 dark:text-gray-400">
                        {contextMenu.supply.supply_name}
                    </div>

                    {/* Edit Supply */}
                    <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        onClick={() => handleEditSupply(contextMenu.supply!)}
                    >
                        Edit Supply
                    </button>

                    {/* Set Regional Prices */}
                    <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        onClick={() => handleOpenRegionalPrices(contextMenu.supply!)}
                    >
                        Set Regional Prices
                    </button>

                    {/* Enable/Disable */}
                    <button
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        onClick={() => handleToggleActive(contextMenu.supply!)}
                    >
                        {contextMenu.supply.is_active ? "Disable Supply" : "Enable Supply"}
                    </button>
                </div>
            )}


            {/* Modal para Regional Prices */}
            <SupplyRegionalPricesModal
                isOpen={regionalPricesModalOpen}
                closeModal={() => {
                    setRegionalPricesModalOpen(false);
                    setSelectedSupplyForPrices(null);
                }}
                supplyId={selectedSupplyForPrices?.id ?? ""}
                initialRegionalPrices={selectedSupplyForPrices?.regional_prices ?? []}
                onSaved={async () => {
                    await loadSupply();
                }}
            />

        </div>
    );
}