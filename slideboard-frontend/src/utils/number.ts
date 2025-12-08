// 数字相关工具函数

/**
 * 格式化数字，添加千分位分隔符
 * @param value - 数字
 * @returns 格式化后的数字字符串
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/**
 * 格式化百分比
 * @param value - 数值
 * @param decimals - 小数位数 (默认: 1)
 * @returns 百分比字符串
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}
