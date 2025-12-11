// src/components/tables/ConsumptionsTable/ConsumptionsTable.tsx
import React, { useEffect, useState } from "react";
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

export interface TransactionResponse {
  id: number;
  username: string;
  supply_name: string;
  quantity_amended: number;
  quantity_before: number;
  quantity_after: number;
  created: string;
  region_code: string;
  price_unit: number;
  total_price: number;
  type_entry: string;
  obs_alter: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tx: TransactionResponse | null;
}

interface ConsumptionsTableProps {
  // se no futuro quiser abrir modal de detalhes, etc
  onViewDetails?: (tx: TransactionResponse) => void;
}

export default function ConsumptionsTable({
  onViewDetails,
}: ConsumptionsTableProps) {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tx: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await authFetch<TransactionResponse[]>(
          `${API_ENDPOINTS.transaction}/list`, // ajuste o endpoint aqui
        );
        if (!cancelled && data) {
          setTransactions(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Error to load transactions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, []);

  // fecha o context menu ao clicar fora
  useEffect(() => {
    const handleClick = () => {
      setContextMenu((prev) =>
        prev.visible ? { ...prev, visible: false, tx: null } : prev,
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
    tx: TransactionResponse,
  ) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tx,
    });
  };

  const formatDateTime = (value: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const formatNumber = (value: number | null | undefined, decimals = 0) => {
    if (value === null || value === undefined) return "-";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getTypeColor = (
    tx: TransactionResponse,
  ): "success" | "warning" | "error" => {
    // exemplo simples: você pode ajustar a lógica
    if (tx.type_entry?.toLowerCase() === "in") return "success";
    if (tx.type_entry?.toLowerCase() === "out") return "error";
    return "warning";
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="p-4 text-gray-500 text-theme-sm">
          Loading Transactions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5">
        <div className="p-4 text-red-700 text-theme-sm">
          Error to load transactions: {error}
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
                User
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Supply
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Region
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Qty Before
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Qty Amended
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Qty After
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Unit Price
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total Price
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Type
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Observations
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {transactions.map((tx) => (
              <TableRow
                key={tx.id}
                onContextMenu={(e) => handleRowContextMenu(e, tx)}
                className="cursor-default hover:bg-gray-50 dark:hover:bg-white/5"
              >
                {/* User */}
                <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800">
                  {tx.username}
                </TableCell>

                {/* Supply */}
                <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm">
                  {tx.supply_name}
                </TableCell>

                {/* Region */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {tx.region_code}
                </TableCell>

                {/* Qty Before */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {tx.quantity_before}
                </TableCell>

                {/* Qty Amended */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {tx.quantity_amended}
                </TableCell>

                {/* Qty After */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {tx.quantity_after}
                </TableCell>

                {/* Unit Price */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {formatNumber(tx.price_unit)}
                </TableCell>

                {/* Total Price */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  {formatNumber(tx.total_price)}
                </TableCell>

                {/* Type */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                  <Badge size="sm" color={getTypeColor(tx)}>
                    {tx.type_entry}
                  </Badge>
                </TableCell>

                {/* Observations */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm max-w-[200px] truncate">
                  {tx.obs_alter || "-"}
                </TableCell>

                {/* Date */}
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm whitespace-nowrap">
                  {formatDateTime(tx.created)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Context menu opcional */}
      {contextMenu.visible && contextMenu.tx && (
        <div
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="fixed z-50 min-w-40 rounded-md border border-gray-200 bg-white text-xs shadow-lg dark:border-white/10 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 dark:border-white/5 dark:text-gray-400">
            {contextMenu.tx.supply_name} – {contextMenu.tx.username}
          </div>

          {onViewDetails && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
              onClick={() => onViewDetails(contextMenu.tx!)}
            >
              View Details
            </button>
          )}
        </div>
      )}
    </div>
  );
}
