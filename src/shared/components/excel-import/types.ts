import { z } from 'zod';

/**
 * Excel 导入组件的属性
 */
export interface ExcelImporterProps<T extends Record<string, any>> {
    /**
     * Zod 校验模式，用于每行数据的校验
     */
    schema: z.ZodSchema<T>;
    /**
     * 导入成功的回调
     */
    onImport: (data: T[]) => Promise<void>;
    /**
     * 模板下载链接
     */
    templateUrl?: string;
    /**
     * 列映射配置，将 Excel 表头映射到数据 Key
     * 例如: { '姓名': 'name', '电话': 'phone' }
     */
    columnMapping: Record<string, keyof T>;
    /**
     * 标题
     */
    title?: string;
    /**
     * 描述文字
     */
    description?: string;
}

/**
 * 校验结果项
 */
export interface ValidationResult<T> {
    data: T | null;
    errors: string[] | null;
    rowNumber: number;
    raw: Record<string, any>;
}

/**
 * 导入状态
 */
export type ImporterState = 'idle' | 'parsing' | 'previewing' | 'importing' | 'success';
