/**
 * 计算转化率（保留小数点后2位，返回百分比数值字符串）
 * @param fromCount 上一级数量
 * @param toCount 当前级数量
 * @returns 转化率字符串（例如 "75.00"），如无法计算则返回 null
 */
export function calculateConversionRate(fromCount: number, toCount: number): string | null {
  if (fromCount <= 0 || toCount < 0) return null;
  const rate = (toCount / fromCount) * 100;
  return rate > 100 ? '100.00' : rate.toFixed(2);
}

/**
 * 计算环比趋势（保留小数点后2位，返回百分比数值字符串）
 * @param current 本期数量或金额
 * @param previous 上期数量或金额
 * @returns 环比趋势字符串（如 "+15.50" 或 "-5.00"），如无法计算则返回 null
 */
export function calculateTrend(current: number, previous: number): string | null {
  if (previous <= 0) return null; // 无法计算有效环比
  const trend = ((current - previous) / previous) * 100;
  return trend.toFixed(2);
}

/**
 * 计算毛利率（保留小数点后2位，返回百分比金额或数值字符串）
 * @param revenue 营收金额
 * @param cost 成本金额
 * @returns [毛利, 毛利率百分比]
 */
export function calculateGrossMargin(revenue: number, cost: number): [string, string] {
  const profit = revenue - cost;
  if (revenue <= 0) return [profit.toFixed(2), '0.00'];
  const margin = (profit / revenue) * 100;
  return [profit.toFixed(2), margin.toFixed(2)];
}
