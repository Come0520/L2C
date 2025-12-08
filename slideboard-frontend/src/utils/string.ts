// 字符串相关工具函数

/**
 * 截断字符串
 * @param text - 字符串
 * @param maxLength - 最大长度
 * @param suffix - 后缀 (默认: '...')
 * @returns 截断后的字符串
 */
export function truncateString(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 * @param text - 字符串
 * @returns 首字母大写的字符串
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 转换为驼峰命名
 * @param value - 字符串
 * @returns 驼峰命名的字符串
 */
export function toCamelCase(value: string): string {
  return value.replace(/[-_](.)/g, (substring, nextChar) => {
    void substring;
    return nextChar.toUpperCase();
  });
}

/**
 * 转换为蛇形命名
 * @param value - 字符串
 * @returns 蛇形命名的字符串
 */
export function toSnakeCase(value: string): string {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}
