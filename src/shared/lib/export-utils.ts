import { utils, writeFile } from 'xlsx';

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
                    : row[col.accessorKey];
            formattedRow[col.header] = value;
        });
        return formattedRow;
    });
}

export function exportToExcel<T>(
    data: T[],
    columns: ExportColumn<T>[],
    filename: string
) {
    const formattedData = formatDataForExport(data, columns);
    const worksheet = utils.json_to_sheet(formattedData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    writeFile(workbook, `${filename}.xlsx`);
}
