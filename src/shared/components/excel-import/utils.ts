import * as XLSX from 'xlsx';
import type { FieldMapping, ParsedRow } from './types';

/**
 * 解析 Excel 文件�?JSON 数组
 * @param file Excel 文件对象
 * @returns 解析后的原始行数�?
 */
export async function parseExcelFile(
    file: File
): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const binaryStr = evt.target?.result;
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);
                resolve(rawData as Record<string, unknown>[]);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsBinaryString(file);
    });
}

/**
 * 根据字段映射�?Excel 行转换为目标格式
 * @param row Excel 原始行数�?
 * @param mappings 字段映射配置
 * @param rowNumber 行号 (用于错误提示)
 * @returns 转换后的行数据和校验错误
 */
export function mapRowToFields(
    row: Record<string, unknown>,
    mappings: FieldMapping[]
): { data: Record<string, unknown>; errors: string[] } {
    const data: Record<string, unknown> = {};
    const errors: string[] = [];

    // 构建列名到字段的反向映射
    const columnToField = new Map<string, FieldMapping>();
    mappings.forEach((m) => columnToField.set(m.excelColumn, m));

    // 遍历映射配置进行转换
    for (const mapping of mappings) {
        const rawValue = row[mapping.excelColumn];

        // 必填校验
        if (
            mapping.required &&
            (rawValue === undefined || rawValue === null || rawValue === '')
        ) {
            errors.push(`缺少${mapping.excelColumn.replace(/\(.*\)/, '')}`);
            continue;
        }

        // 值转�?
        let value = rawValue;
        if (mapping.transform && rawValue !== undefined && rawValue !== null) {
            try {
                value = mapping.transform(rawValue);
            } catch {
                errors.push(`${mapping.excelColumn} 格式错误`);
                continue;
            }
        }

        data[mapping.fieldKey] = value;
    }

    return { data, errors };
}

/**
 * 批量解析并校�?Excel 数据
 * @param rawData Excel 原始数据
 * @param mappings 字段映射配置
 * @returns 解析后的行数据数�?
 */
export function parseAndMapRows(
    rawData: Record<string, unknown>[],
    mappings: FieldMapping[]
): ParsedRow[] {
    return rawData.map((row, index) => {
        const rowNumber = index + 2; // Excel 行号�?2 开�?(跳过表头)
        const { data, errors } = mapRowToFields(row, mappings);

        return {
            _rowNumber: rowNumber,
            _isValid: errors.length === 0,
            _errors: errors,
            ...data,
        };
    });
}

/**
 * 使用 Zod Schema 进行深度校验
 * @param rows 已解析的行数�?
 * @param schema Zod 校验 Schema (单条记录)
 * @returns 校验后的行数�?(更新 _isValid �?_errors)
 */
export function validateWithSchema(
    rows: ParsedRow[],
    schema: { safeParse: (data: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }
): ParsedRow[] {
    return rows.map((row) => {
        // 如果已有基础校验错误，跳�?Zod 校验
        if (!row._isValid) return row;

        // 提取数据字段 (去除内部属�?
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _rowNumber, _isValid, _errors, _isSuccess, ...data } = row;

        const result = schema.safeParse(data);
        if (!result.success) {
            const zodErrors = result.error?.issues.map((i) => i.message) || ['校验失败'];
            return {
                ...row,
                _isValid: false,
                _errors: [...row._errors, ...zodErrors],
            };
        }

        return row;
    });
}

/**
 * 生成 Excel 下载模板
 * @param mappings 字段映射配置
 * @param sampleData 示例数据 (可�?
 * @param fileName 文件�?(不含扩展�?
 */
export function generateTemplate(
    mappings: FieldMapping[],
    sampleData: Record<string, unknown>[] = [],
    fileName: string = '导入模板'
): void {
    const headers = mappings.map((m) => m.excelColumn);

    // 构建示例行数�?
    const rows = sampleData.map((item) => {
        const row: Record<string, unknown> = {};
        mappings.forEach((m) => {
            row[m.excelColumn] = item[m.fieldKey] ?? '';
        });
        return row;
    });

    // 创建工作�?
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');

    // 下载
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * 统计解析结果
 */
export function getParseStats(rows: ParsedRow[]): {
    total: number;
    valid: number;
    invalid: number;
} {
    const valid = rows.filter((r) => r._isValid).length;
    return {
        total: rows.length,
        valid,
        invalid: rows.length - valid,
    };
}
