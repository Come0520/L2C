/**
 * 商品成本计算工具
 *
 * 提供中心化的真实成本 (Internal Cost) 和利润计算方法。
 * 所有涉及成本的计算场景（报价、采购对账、利润报表）均应调用本模块，
 * 严禁各处自行计算，以确保公式版本一致。
 */

/**
 * 面料真实成本计算参数
 */
export interface InternalCostParams {
  /** 标准采购价（元/单位） */
  purchasePrice: number;
  /** 平摊物流成本（元/单位） */
  logisticsCost: number;
  /** 加工费（元/单位，按成品计） */
  processingCost: number;
  /** 面料损耗系数（0~1，例如 0.05 代表 5%） */
  lossRate: number;
}

/**
 * 计算真实成本 (Internal Cost)
 *
 * 公式：(采购价 + 物流成本) / (1 - 损耗率) + 加工费
 *
 * 设计理由：
 * - 损耗率作用于"面料 + 运费"：买回来的面料裁掉后，对应的货款和运费也已支出
 * - 加工费独立：加工费通常按成品数量与加工厂结算，不应被面料损耗放大
 *
 * @example
 * // 采购价 50 元/米，运费 2 元，损耗 5%，加工费 15 元
 * calculateInternalCost({
 *   purchasePrice: 50,
 *   logisticsCost: 2,
 *   processingCost: 15,
 *   lossRate: 0.05,
 * })
 * // => 69.74 (保留两位小数: (50+2)/(1-0.05) + 15 = 54.7368... + 15 = 69.7368...)
 *
 * @returns 真实成本（四舍五入到小数点后两位）
 * @throws 当损耗率 >= 1 时抛出错误（100% 损耗无意义）
 */
export function calculateInternalCost(params: InternalCostParams): number {
  const { purchasePrice, logisticsCost, processingCost, lossRate } = params;

  if (lossRate >= 1) {
    throw new Error(`损耗率不能 ≥ 100%，当前值: ${lossRate}`);
  }
  if (lossRate < 0) {
    throw new Error(`损耗率不能为负数，当前值: ${lossRate}`);
  }

  // 面料 + 运费 除以 (1 - 损耗率) = 含损耗的面料真实成本
  const materialCostWithLoss = (purchasePrice + logisticsCost) / (1 - lossRate);

  // 加工费独立叠加
  const totalCost = materialCostWithLoss + processingCost;

  // 四舍五入到两位小数
  return Math.round(totalCost * 100) / 100;
}

/**
 * 利润率计算参数
 */
export interface ProfitMarginParams {
  /** 真实成本 */
  internalCost: number;
  /** 销售单价（零售价或渠道价） */
  sellingPrice: number;
}

/**
 * 计算毛利率
 *
 * 公式：(销售单价 - 真实成本) / 销售单价 × 100
 *
 * @returns 毛利率百分比（如 42.86 表示 42.86%），四舍五入到两位小数
 * @throws 当销售价 <= 0 时抛出错误
 */
export function calculateGrossMargin(params: ProfitMarginParams): number {
  const { internalCost, sellingPrice } = params;

  if (sellingPrice <= 0) {
    throw new Error('销售单价必须大于 0');
  }

  const margin = ((sellingPrice - internalCost) / sellingPrice) * 100;
  return Math.round(margin * 100) / 100;
}

/**
 * 根据目标毛利率反推建议零售价
 *
 * 公式：真实成本 / (1 - 目标毛利率)
 *
 * @param internalCost - 真实成本
 * @param targetMarginRate - 目标毛利率（0~1，如 0.4 代表 40%）
 * @returns 建议零售价（四舍五入到两位小数）
 */
export function calculateSuggestedRetailPrice(
  internalCost: number,
  targetMarginRate: number
): number {
  if (targetMarginRate >= 1 || targetMarginRate < 0) {
    throw new Error(`目标毛利率需在 0~1 之间，当前值: ${targetMarginRate}`);
  }

  const suggestedPrice = internalCost / (1 - targetMarginRate);
  return Math.round(suggestedPrice * 100) / 100;
}
