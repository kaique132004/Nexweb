import type { TransactionResponse } from "../shared/types/transaction";

// ─── Column config shared with ExportModal ────────────────────────────────────

export interface ExportColumnDef {
  key: string;
  label: string;
  defaultChecked: boolean;
}

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: "supply",   label: "Supply",        defaultChecked: true  },
  { key: "user",     label: "User",          defaultChecked: true  },
  { key: "region",   label: "Region",        defaultChecked: true  },
  { key: "type",     label: "Type",          defaultChecked: true  },
  { key: "before",   label: "Qty Before",    defaultChecked: false },
  { key: "quantity", label: "Qty Amended",   defaultChecked: true  },
  { key: "after",    label: "Qty After",     defaultChecked: false },
  { key: "price",    label: "Total Price",   defaultChecked: true  },
  { key: "date",     label: "Date",          defaultChecked: true  },
  { key: "obs",      label: "Observations",  defaultChecked: false },
];

// ─── Cell resolver ────────────────────────────────────────────────────────────

function resolveCell(key: string, tx: TransactionResponse): string {
  switch (key) {
    case "supply":   return tx.supply_name ?? "-";
    case "user":     return tx.username ?? "-";
    case "region":   return tx.region_code ?? "-";
    case "type":     return tx.type_entry ?? "-";
    case "before":   return tx.quantity_before != null ? String(tx.quantity_before) : "-";
    case "quantity": return tx.quantity_amended != null ? String(tx.quantity_amended) : "-";
    case "after":    return tx.quantity_after != null ? String(tx.quantity_after) : "-";
    case "price":    return tx.total_price != null ? tx.total_price.toFixed(2) : "-";
    case "date":
      if (!tx.created_at) return "-";
      return new Date(tx.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    case "obs":      return tx.obs_alter || "-";
    default:         return "-";
  }
}

// ─── PDF generator (jsPDF loaded lazily so Vite doesn't choke on boot) ───────

export async function generateTransactionsPDF(
  rows: TransactionResponse[],
  selectedKeys: string[],
  filename: string,
): Promise<void> {
  // jsPDF is pre-bundled by Vite (optimizeDeps.include) so the dynamic
  // import resolves cleanly and keeps it out of the main bundle.
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const selectedCols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // ── Header bar ──
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 297, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Consumption Report — Nexventory", 14, 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const generated = `Generated: ${new Date().toLocaleString("pt-BR")}   |   ${rows.length} record(s)`;
  doc.text(generated, 297 - 14, 12, { align: "right" });

  // ── Table ──
  autoTable(doc, {
    startY: 24,
    head: [selectedCols.map((c) => c.label)],
    body: rows.map((row) => selectedCols.map((c) => resolveCell(c.key, row))),
    styles: {
      fontSize: 8,
      cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    columnStyles: selectedKeys.includes("obs")
      ? { [selectedKeys.indexOf("obs")]: { cellWidth: 45 } }
      : {},
    didDrawPage: (data) => {
      const pageCount = (doc as unknown as { internal: { getNumberOfPages(): number } })
        .internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        297 / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" },
      );
    },
  });

  doc.save(filename);
}
