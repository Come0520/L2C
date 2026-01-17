import { read, utils } from 'xlsx';
import { z } from 'zod';
import { ValidationResult } from './types';

/**
 * 解析解析 Excel 文件为原始 JSON 数据
 */
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = utils.sheet_to_json(worksheet) as Record<string, unknown>[];
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
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
                errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
                rowNumber: index + 2,
                raw: row,
            };
        }
    });
}
