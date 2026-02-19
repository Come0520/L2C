/**
 * 系统设置工具函数
 * 纯函数，不包含 'use server' 指令，可安全地被任意模块导入
 */

/**
 * 解析配置值
 * 根据值类型将字符串形式的配置值转换为对应的 JS 类型
 */
export function parseSettingValue(value: string, valueType: string): unknown {
    switch (valueType) {
        case 'BOOLEAN':
            return value === 'true';
        case 'INTEGER':
            return parseInt(value, 10);
        case 'DECIMAL':
            return parseFloat(value);
        case 'JSON':
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        case 'ENUM':
        default:
            return value;
    }
}

/**
 * 校验配置值类型
 * 检查给定的值是否符合预期的配置值类型
 */
export function validateValueType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
        case 'BOOLEAN':
            return typeof value === 'boolean';
        case 'INTEGER':
            return Number.isInteger(Number(value));
        case 'DECIMAL':
            return !isNaN(Number(value));
        case 'JSON':
            return typeof value === 'object' || typeof value === 'string';
        case 'ENUM':
            return typeof value === 'string';
        default:
            return true;
    }
}
