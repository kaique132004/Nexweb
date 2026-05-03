import React, { useState, useEffect } from "react";
import Button from "../../shared/components/ui/button/Button";
import type {TransactionFilters} from "../../shared/types/transaction.ts";

interface TransactionFilterModalProps {
  isOpen: boolean;
  closeModal: () => void;
  currentFilters: TransactionFilters;
  onApplyFilters: (filters: TransactionFilters) => void;
}

const TransactionFilterModal: React.FC<TransactionFilterModalProps> = ({
  isOpen,
  closeModal,
  currentFilters,
  onApplyFilters,
}) => {
  const [formData, setFormData] = useState<TransactionFilters>(currentFilters);

  // Sincroniza com os filtros atuais quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setFormData(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined, // remove se vazio
    }));
  };

  const handleApply = () => {
    onApplyFilters(formData);
    closeModal();
  };

  const handleClear = () => {
    const emptyFilters: TransactionFilters = {
        username: ""
    };
    setFormData(emptyFilters);
    onApplyFilters(emptyFilters);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Filter Transactions
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Date Range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Region Code */}
          <div>
            <label
              htmlFor="regionCode"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Region Code
            </label>
            <input
              type="text"
              id="regionCode"
              name="regionCode"
              value={formData.regionCode || ""}
              onChange={handleChange}
              placeholder="e.g., SP, RJ, MG"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Supply Name */}
          <div>
            <label
              htmlFor="supplyName"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Supply Name
            </label>
            <input
              type="text"
              id="supplyName"
              name="supplyName"
              value={formData.supplyName || ""}
              onChange={handleChange}
              placeholder="Search by supply name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Type Entry */}
          <div>
            <label
              htmlFor="typeEntry"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Transaction Type
            </label>
            <select
              id="typeEntry"
              name="typeEntry"
              value={formData.typeEntry || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All Types</option>
              <option value="in">In</option>
              <option value="out">Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Username (opcional) */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              User
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
              placeholder="Filter by username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={handleClear}>
            Clear Filters
          </Button>

          <Button size="sm" variant="outline" onClick={closeModal}>
            Cancel
          </Button>

          <Button size="sm" variant="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilterModal;
