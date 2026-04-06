
import { usePaginatedData } from "../../../hooks/usePaginatedData";
import { API_ENDPOINTS } from "../../../api/endpoint";
import {useEffect} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../../components/ui/table";
import Button from "../../../components/ui/button/Button.tsx";

// Interface para a estrutura de uma Região, baseada na sua RegionEntity
export interface Region {
    id: string; // Usando UUIDs conforme sua preferência, mas o backend usa Long. Vamos manter string para o frontend e converter se necessário.
    region_code: string; // Corrigido para regionCode
    region_name: string; // Corrigido para regionName
    city_name?: string;
    country_name?: string;
    address_code?: string;
    state_name?: string;
    responsible_name?: string;
    created_at: string; // LocalDateTime no backend, string no frontend
    updated_at: string; // LocalDateTime no backend, string no frontend
    created_by?: string;
    updated_by?: string;
    is_active: boolean; // Corrigido para isActive
    contains_agents_local: boolean;
    longitude?: number;
    latitude?: number;
    min_stock_alert: number;
    // users: any[]; // Não é necessário para o formulário ou tabela de listagem simples
}

interface RegionTableProps {
    onEditRegion: (region: Region) => void;
    refreshTrigger?: number; // Para forçar o refetch da tabela
}

export default function RegionTable({ onEditRegion, refreshTrigger }: RegionTableProps) {
    // const { t } = useTranslation(); // REMOVIDO
    const {
        data: regions,
        loading,
        error,
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        setCurrentPage,
        setPageSize,
        refetch,
    } = usePaginatedData<Region>(API_ENDPOINTS.region, [refreshTrigger]); // Passando refreshTrigger como dependência

    // Efeito para recarregar a tabela quando o refreshTrigger muda
    useEffect(() => {

    }, []);(() => {
        if (refreshTrigger !== undefined) { // Apenas refetch se o trigger for explicitamente alterado
            refetch();
        }
    }, [refreshTrigger, refetch]);


    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Loading data...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="mb-4 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                role="alert"
            >
                <strong className="font-semibold">Error: </strong>
                {error}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Code
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Name
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                City
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Country
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Status
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {regions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-5 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No data available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            regions.map((region) => (
                                <TableRow key={region.id}>
                                    <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm dark:text-gray-200">
                                        {region.region_code}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm dark:text-gray-200">
                                        {region.region_name}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                        {region.city_name || "-"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                        {region.country_name || "-"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        {region.is_active ? (
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Inactive
                      </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEditRegion(region)}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginação */}
            {totalElements > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-400">
              Rows per page:
            </span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage + 1 === totalPages}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}