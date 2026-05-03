import { useEffect, useRef, useState, type MouseEvent} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "./index.tsx";
import {usePaginatedData} from "../../../../hooks/usePaginatedData.ts";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ColumnDef<T> = {
    key: string;
    label: string;
    className?: string;
    headerClassName?: string;
    render?: (row: T) => React.ReactNode;
}

export type ContextMenuAction<T> = {
    label: string | ((row: T) => string);
    onClick: (row: T) => void;
    hidden?: (row: T) => boolean;
    danger?: boolean;
}

export type DataTableProps<T extends object> = {
    endpoint: string;
    columns: ColumnDef<T>[];
    rowKey: keyof T;
    refreshTrigger?: number;
    onRowClick?: (row: T) => void;
    rowClassName?: (row: T) => string;
    contextMenuActions?: ContextMenuAction<T>[];
    contextMenuTitle?: (row: T) => string;
    emptyMessage?: string;
    loadingMessage?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

type ContextMenuState<T> = {
    visible: boolean;
    x: number;
    y: number;
    row: T | null;
}

export function DataTable<T extends object>({
                                                endpoint,
                                                columns,
                                                rowKey,
                                                refreshTrigger,
                                                onRowClick,
                                                rowClassName,
                                                contextMenuActions,
                                                contextMenuTitle,
                                                emptyMessage = "No data available.",
                                                loadingMessage = "Loading data...",
                                            }: DataTableProps<T>) {
    const {
        data,
        loading,
        error,
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        setCurrentPage,
        setPageSize,
        refetch,
    } = usePaginatedData<T>(endpoint, [refreshTrigger]);

    const [contextMenu, setContextMenu] = useState<ContextMenuState<T>>({
        visible: false,
        x: 0,
        y: 0,
        row: null,
    });

    const menuRef = useRef<HTMLDivElement>(null);

    // Fecha o context menu ao clicar fora
    useEffect(() => {
        if (!contextMenu.visible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu((prev) => ({...prev, visible: false, row: null}));
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [contextMenu.visible]);

    // Fecha ao rolar a página
    useEffect(() => {
        if (!contextMenu.visible) return;
        const handleScroll = () =>
            setContextMenu((prev) => ({...prev, visible: false, row: null}));
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, [contextMenu.visible]);

    // Refetch quando trigger muda
    useEffect(() => {
        if (refreshTrigger !== undefined) refetch();
    }, [refreshTrigger]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0);
    };

    const handleRowContextMenu = (
        e: React.MouseEvent<HTMLTableRowElement, React.MouseEvent>,
        row: T
    ) => {
        if (!contextMenuActions?.length) return;
        e.preventDefault();

        // Ajusta posição para não sair da tela
        const menuWidth = 180;
        const menuHeight = contextMenuActions.length * 36 + 40;
        const x =
            e.clientX + menuWidth > window.innerWidth
                ? e.clientX - menuWidth
                : e.clientX;
        const y =
            e.clientY + menuHeight > window.innerHeight
                ? e.clientY - menuHeight
                : e.clientY;

        setContextMenu({visible: true, x, y, row});
    };

    const handleActionClick = (action: ContextMenuAction<T>, row: T) => {
        setContextMenu((prev) => ({...prev, visible: false, row: null}));
        action.onClick(row);
    };

    // ─── Loading ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div
                        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"/>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {loadingMessage}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Error ─────────────────────────────────────────────────────────────────

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

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-black/5 dark:bg-white/3">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.key}
                                    isHeader
                                    className={
                                        col.headerClassName ??
                                        "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    }
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHeader>

                    {/* Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow
                                    key={String(row[rowKey])}
                                    onContextMenu={(e: MouseEvent<HTMLTableRowElement, MouseEvent>) => handleRowContextMenu(e, row)}
                                    onClick={() => onRowClick?.(row)}
                                    className={[
                                        contextMenuActions?.length || onRowClick
                                            ? "cursor-pointer"
                                            : "cursor-default",
                                        "hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
                                        rowClassName?.(row) ?? "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.key}
                                            className={
                                                col.className ??
                                                "px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300"
                                            }
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String(
                                                    (row as Record<string, unknown>)[col.key] ?? "-"
                                                )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginação */}
            {totalElements > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Rows per page:
            </span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            {[5, 10, 20, 50].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-400 dark:text-gray-500">
              {totalElements} total
            </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(0)}
                            disabled={currentPage === 0}
                            className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            «
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage + 1 >= totalPages}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages - 1)}
                            disabled={currentPage + 1 >= totalPages}
                            className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            »
                        </button>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu.visible && contextMenu.row && contextMenuActions?.length && (
                <div
                    ref={menuRef}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="fixed z-50 min-w-[160px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenuTitle && (
                        <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 dark:border-white/5 dark:text-gray-400">
                            {contextMenuTitle(contextMenu.row)}
                        </div>
                    )}
                    {contextMenuActions
                        .filter((action) => !action.hidden?.(contextMenu.row!))
                        .map((action, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleActionClick(action, contextMenu.row!)}
                                className={[
                                    "flex w-full items-center px-3 py-2 text-left text-xs",
                                    action.danger
                                        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {typeof action.label === "function"
                                    ? action.label(contextMenu.row!)
                                    : action.label}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}