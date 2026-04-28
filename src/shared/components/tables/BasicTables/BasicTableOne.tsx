import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import Badge from "../../../../components/ui/badge/Badge.tsx";
import { useTranslation } from "react-i18next";
import { usePaginatedData } from "../../../../hooks/usePaginatedData.ts"; // Importe o hook e a interface

// Interface para o tipo de dado que a tabela exibirá (Order)
interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

export default function BasicTableOne() {
  const { t } = useTranslation();

  // Use o hook usePaginatedData para buscar os dados
  // Substitua "/api/v2/orders" pelo endpoint real da sua API para esta tabela
  // Por exemplo, se for para listar usuários: API_ENDPOINTS.auth + "/users"
  const {
    data: orders,
    loading,
    error,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    setCurrentPage,
    setPageSize,
    refetch, // Se precisar de um botão para recarregar
  } = usePaginatedData<Order>("/api/v2/example-orders", [], { initialPageSize: 5 }); // Endpoint de exemplo, ajuste conforme necessário

  // Handlers de paginação
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0); // Resetar para a primeira página ao mudar o tamanho
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "success";
      case "Pending":
        return "warning";
      case "Cancel":
        return "error";
      default:
        return "info"; // Ou um default que faça sentido
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('common.loadingData')}
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
          <strong className="font-semibold">{t('common.error')}: </strong>
          {error}
        </div>
    );
  }

  return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('table.user')}
                </TableCell>
                <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('table.projectName')}
                </TableCell>
                <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('table.team')}
                </TableCell>
                <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('table.status')}
                </TableCell>
                <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {t('table.budget')}
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-5 py-4 text-center text-gray-500 dark:text-gray-400">
                      {t('table.noData')}
                    </TableCell>
                  </TableRow>
              ) : (
                  orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full">
                              <img
                                  width={40}
                                  height={40}
                                  src={order.user.image}
                                  alt={order.user.name}
                              />
                            </div>
                            <div>
                        <span className="block font-medium text-gray-800 text-theme-sm ">
                          {order.user.name}
                        </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {order.user.role}
                        </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {order.projectName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div className="flex -space-x-2">
                            {order.team.images.map((teamImage, index) => (
                                <div
                                    key={index}
                                    className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
                                >
                                  <img
                                      width={24}
                                      height={24}
                                      src={teamImage}
                                      alt={`Team member ${index + 1}`}
                                      className="w-full size-6"
                                  />
                                </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge size="sm" color={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {order.budget}
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
              {t('pagination.rowsPerPage')}:
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
                  {t('pagination.previous')}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-400">
              {t('pagination.page')} {currentPage + 1} {t('pagination.of')} {totalPages}
            </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage + 1 === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {t('pagination.next')}
                </button>
              </div>
            </div>
        )}
      </div>
  );
}