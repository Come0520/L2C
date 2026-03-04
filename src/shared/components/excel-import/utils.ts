import { Workbook } from 'exceljs';
import { z } from 'zod';
import { ValidationResult } from './types';

/**
 * 解析解析 Excel 文件为原始 JSON 数据
 */
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];

  const json: Record<string, unknown>[] = [];
  if (!worksheet) return json;

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value ? String(cell.value) : `Col${colNumber}`;
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 跳过表头
    const rowData: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value;
      }
    });
    json.push(rowData);
  });

  return json;
}

/**
 * 根据映射和 Schema 校验原始数据
 */
export function validateExcelData<T extends Record<string, unknown>>(
  rawRows: Record<string, unknown>[],
  columnMapping: Record<string, keyof T>,
  schema: z.ZodSchema<T>
): ValidationResult<T>[] {
  return rawRows.map((row, index) => {
    // 1. 根据映射转换 Key
    const mappedRow: Record<string, unknown> = {};
    Object.entries(columnMapping).forEach(([excelHeader, dataKey]) => {
      mappedRow[dataKey as string] = row[excelHeader];
    });

    // 2. 使用 Zod 校验
    const result = schema.safeParse(mappedRow);

    if (result.success) {
      return {
        data: result.data,
        errors: null,
        rowNumber: index + 2, // Excel 是 1-based，且有表头，所以 +2
        raw: row,
      };
    } else {
      return {
        data: null,
        errors: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`),
        rowNumber: index + 2,
        raw: row,
      };
    }
  });
}
