import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  accessorKey: keyof T | ((row: T) => unknown);
  id?: string;
}

export function formatDataForExport<T>(data: T[], columns: ExportColumn<T>[]) {
  return data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value =
        typeof col.accessorKey === 'function'
          ? col.accessorKey(row)
          : row[col.accessorKey as keyof T];
      formattedRow[col.header] = value;
    });
    return formattedRow;
  });
}

export async function exportToExcel<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  const formattedData = formatDataForExport(data, columns);
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.header,
    width: 20,
  }));

  worksheet.addRows(formattedData);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${filename}.xlsx`);
}
