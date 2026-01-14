'use client';

// ==================== 校验 Schema 接口 ====================

/**
 * 校验 Schema 接口 (Zod 兼容)
 * 使用自定义接口而非直接依赖 ZodSchema 类型，增强版本兼容�?
 */
export interface ValidationSchema<T = unknown> {
    safeParse: (data: unknown) => {
        success: boolean;
        data?: T;
        error?: { issues: { message: string; path?: (string | number)[] }[] };
    };
}

// ==================== 字段映射 ====================

/**
 * Excel 列与目标字段的映射配�?
 */
export interface FieldMapping {
    /** Excel 列标�?(�?"产品名称") */
    excelColumn: string;
    /** 目标字段键名 (�?"name") */
    fieldKey: string;
    /** 是否必填 */
    required?: boolean;
    /** 值转换器 (如字符串转数�? */
    transform?: (value: unknown) => unknown;
}

// ==================== 预览表格配置 ====================

/**
 * 预览表格列配�?
 */
export interface PreviewColumn {
    /** 列标�?*/
    header: string;
    /** 数据字段�?*/
    accessorKey: string;
    /** 列宽 */
    width?: string;
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right';
    /** 自定义渲染器 */
    render?: (value: unknown, row: ParsedRow) => React.ReactNode;
}

// ==================== 解析结果 ====================

/**
 * 单行解析结果 (内部使用)
 */
export interface ParsedRow {
    /** Excel 原始行号 (�?2 开始，跳过表头) */
    _rowNumber: number;
    /** 校验是否通过 */
    _isValid: boolean;
    /** 校验错误列表 */
    _errors: string[];
    /** 导入是否成功 (导入后更�? */
    _isSuccess?: boolean;
    /** 解析后的数据 */
    [key: string]: unknown;
}

/**
 * 导入结果统计
 */
export interface ImportResult {
    /** 成功数量 */
    success: number;
    /** 失败数量 */
    failed: number;
    /** 错误详情 (可�? */
    errors?: { identifier: string; error: string }[];
}

// ==================== 核心配置 ====================

/**
 * Excel 导入组件配置
 * @template T 导入数据类型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExcelImportConfig<T = any> {
    /** 弹窗标题 */
    title: string;
    /** 弹窗描述 (可�? */
    description?: string;
    /** 字段映射配置 */
    fieldMappings: FieldMapping[];
    /** Zod 校验 Schema */
    validationSchema: ValidationSchema<T>;
    /** 导入处理函数 */
    onImport: (data: T[]) => Promise<ImportResult>;
    /** 模板示例数据 (可选，用于生成下载模板) */
    templateData?: Record<string, unknown>[];
    /** 模板文件�?(不含扩展�? */
    templateFileName?: string;
    /** 预览表格列配�?*/
    previewColumns: PreviewColumn[];
    /** 用于标识重复/失败行的字段 (�?"sku") */
    identifierField?: string;
}

// ==================== 组件 Props ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExcelImportDialogProps<T = any> {
    /** 导入配置 */
    config: ExcelImportConfig<T>;
    /** 触发器子元素 (可�? */
    children?: React.ReactNode;
    /** 导入成功后回�?*/
    onSuccess?: () => void;
}
