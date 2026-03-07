/**
 * AI 效果图积分消耗计算工具
 *
 * 积分规则（2026-03-07 已确认）：
 * - 普通出图（Nano Banana 2）：2 点
 * - 自定义面料上传（非云展厅）：+1 点
 * - 首次重试（retryCount=1）：免费（0 点）
 * - 第 2 次及以上重试：恢复正常扣点
 * - 高清出图（Phase 3, ComfyUI）：5 点（当前为预留常量）
 */

/** 积分消耗常量，集中管理避免魔法数字 */
export const CREDIT_COSTS = {
    /** 基础出图费用（Nano Banana 普通质量） */
    BASE: 2,
    /** 自定义面料上传附加费（非云展厅面料需额外 1 点） */
    UPLOAD_SURCHARGE: 1,
    /** 高清出图费用（Phase 3 ComfyUI，当前预留） */
    HIGH_RES: 5,
} as const;

/** 计算积分消耗的入参 */
export interface CalculateCreditsCostParams {
    /** 面料来源：showroom=云展厅，upload=用户自己上传 */
    fabricSource: 'showroom' | 'upload';
    /** 当前是第几次重试（0=首次，1=第一次重试，2+=付费重试） */
    retryCount: number;
}

/**
 * 计算本次 AI 渲染消耗的积分数
 *
 * 规则：
 * 1. 基础费用 2 点
 * 2. 上传自定义面料额外 +1 点
 * 3. 首次重试（retryCount === 1）免费，返回 0
 * 4. retryCount >= 2 恢复正常扣点
 *
 * @param params 计算参数
 * @returns 本次消耗的积分数（整数）
 *
 * @example
 * // 云展厅面料首次出图 → 2 点
 * calculateCreditsCost({ fabricSource: 'showroom', retryCount: 0 }) // 2
 *
 * // 上传面料首次出图 → 3 点
 * calculateCreditsCost({ fabricSource: 'upload', retryCount: 0 }) // 3
 *
 * // 任意情况的首次重试 → 0 点（免费）
 * calculateCreditsCost({ fabricSource: 'upload', retryCount: 1 }) // 0
 */
export function calculateCreditsCost(params: CalculateCreditsCostParams): number {
    const { fabricSource, retryCount } = params;

    // 首次重试免费
    if (retryCount === 1) return 0;

    // 基础消耗
    let cost = CREDIT_COSTS.BASE;

    // 上传自定义面料附加费
    if (fabricSource === 'upload') {
        cost += CREDIT_COSTS.UPLOAD_SURCHARGE;
    }

    return cost;
}
