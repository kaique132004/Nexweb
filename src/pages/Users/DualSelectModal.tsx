import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

interface Option {
  id: string | number;
  label: string;
}

interface DualSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  allOptions: Option[];
  initialSelectedIds?: Array<string | number>;
  onSave: (selectedIds: Array<string | number>) => void;
}

const DualSelectModal: React.FC<DualSelectModalProps> = ({
  isOpen,
  onClose,
  title = "Manage Items",
  allOptions,
  initialSelectedIds = [],
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>(
    initialSelectedIds
  );

  const [markedAvailableIds, setMarkedAvailableIds] = useState<
    Array<string | number>
  >([]);
  const [markedSelectedIds, setMarkedSelectedIds] = useState<
    Array<string | number>
  >([]);

  // Sempre que abrir o modal ou initialSelectedIds mudar, sincroniza o estado interno
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setMarkedAvailableIds([]);
      setMarkedSelectedIds([]);
    }
  }, [isOpen, initialSelectedIds]);

  // Normaliza para string para evitar problemas string/number
  const { available, selected } = useMemo(() => {
    const selectedSet = new Set(selectedIds.map(String));
    return {
      available: allOptions.filter((opt) => !selectedSet.has(String(opt.id))),
      selected: allOptions.filter((opt) => selectedSet.has(String(opt.id))),
    };
  }, [allOptions, selectedIds]);

  const toggleMarked = (id: string | number, list: "available" | "selected") => {
    if (list === "available") {
      setMarkedAvailableIds((prev) =>
        prev.map(String).includes(String(id))
          ? prev.filter((x) => String(x) !== String(id))
          : [...prev, id]
      );
    } else {
      setMarkedSelectedIds((prev) =>
        prev.map(String).includes(String(id))
          ? prev.filter((x) => String(x) !== String(id))
          : [...prev, id]
      );
    }
  };

  const handleAdd = () => {
    if (markedAvailableIds.length === 0) return;
    setSelectedIds((prev) =>
      Array.from(new Set([...prev.map(String), ...markedAvailableIds.map(String)]))
    );
    setMarkedAvailableIds([]);
  };

  const handleRemove = () => {
    if (markedSelectedIds.length === 0) return;
    const removeSet = new Set(markedSelectedIds.map(String));
    setSelectedIds((prev) => prev.filter((id) => !removeSet.has(String(id))));
    setMarkedSelectedIds([]);
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-[#1e1e1e] lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>

        {/* Corpo */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Lista de disponíveis */}
          <div className="flex-1">
            <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Disponíveis
            </h5>
            <div className="custom-scrollbar max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-[#121212]">
              {available.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">
                  Nenhum item disponível
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {available.map((opt) => (
                    <li
                      key={opt.id}
                      onClick={() => toggleMarked(opt.id, "available")}
                      className={`cursor-pointer px-3 py-2 text-xs text-gray-800 dark:text-gray-100 ${
                        markedAvailableIds.map(String).includes(String(opt.id))
                          ? "bg-blue-50 dark:bg-blue-500/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Botões de seta */}
          <div className="flex flex-row items-center justify-center gap-2 lg:flex-col">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={markedAvailableIds.length === 0}
            >
              {">"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemove}
              disabled={markedSelectedIds.length === 0}
            >
              {"<"}
            </Button>
          </div>

          {/* Lista de selecionados */}
          <div className="flex-1">
            <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Selecionados
            </h5>
            <div className="custom-scrollbar max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-[#121212]">
              {selected.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">
                  Nenhum item selecionado
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selected.map((opt) => (
                    <li
                      key={opt.id}
                      onClick={() => toggleMarked(opt.id, "selected")}
                      className={`cursor-pointer px-3 py-2 text-xs text-gray-800 dark:text-gray-100 ${
                        markedSelectedIds.map(String).includes(String(opt.id))
                          ? "bg-blue-50 dark:bg-blue-500/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {opt.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DualSelectModal;
