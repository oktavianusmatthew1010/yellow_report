import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportRowsToExcel = (rows, columns, filename) => {
  const data = rows.map((row) => {
    const flat = {};
    columns.forEach((column) => {
      flat[column.label] = row[column.key] ?? '';
    });
    return flat;
  });

  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportRowsToPdf = (rows, columns, filename, title) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title || 'Report', 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 30, 30] },
  });

  doc.save(`${filename}.pdf`);
};
