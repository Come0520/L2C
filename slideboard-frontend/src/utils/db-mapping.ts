/**
 * 数据库字段映射工具
 * 用于处理前端驼峰命名(camelCase)与数据库蛇形命名(snake_case)之间的转换
 */

/**
 * 将字符串转换为蛇形命名 (snake_case)
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 将字符串转换为驼峰命名 (camelCase)
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 将对象键转换为蛇形命名，用于写入数据库
 * @param data 前端数据对象
 * @param overrides 字段映射覆盖配置 { [frontendKey]: dbKey }
 * @returns 数据库格式对象
 */
export function toDbFields<T extends Record<string, any>>(
  data: T,
  overrides: Record<string, string | null> = {}
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // 如果在 overrides 中明确指定为 null，则跳过该字段（用于手动处理复杂字段）
    if (overrides[key] === null) {
      return;
    }

    // 如果有自定义映射键，使用自定义键
    if (overrides[key]) {
      result[overrides[key]!] = value;
      return;
    }

    // 默认转换为 snake_case
    const dbKey = toSnakeCase(key);
    result[dbKey] = value;
  });

  return result;
}

/**
 * 将数据库记录转换为前端驼峰命名对象
 * @param dbRecord 数据库记录
 * @param overrides 字段映射覆盖配置 { [dbKey]: frontendKey }
 * @returns 前端格式对象
 */
export function fromDbFields<T>(
  dbRecord: Record<string, any>,
  overrides: Record<string, string | null> = {}
): T {
  const result: any = {};

  Object.keys(dbRecord).forEach(key => {
    const value = dbRecord[key];

    // 如果在 overrides 中明确指定为 null，则跳过该字段
    if (overrides[key] === null) {
      return;
    }

    // 如果有自定义映射键，使用自定义键
    if (overrides[key]) {
      result[overrides[key]!] = value;
      return;
    }

    // 默认转换为 camelCase
    const frontendKey = toCamelCase(key);
    result[frontendKey] = value;
  });

  return result as T;
}
