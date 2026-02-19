/**
 * 标品计算策略
 * P1-01 修复：实现真实的标品计算逻辑，替换空壳 Mock 实现
 */

import { BaseCalcStrategy, type CalcParams, type CalcResult } from './base-strategy';

/** 标品计算参数 */
export interface StandardCalcParams extends CalcParams {
    /** 数量 */
    quantity?: number;
    /** 单价 */
    unitPrice?: number;
}

/**
 * 标品计算策略
 * 适用于飘窗垫、配件、辅料等非窗帘/非墙纸墙布品类
 * 计算逻辑：subtotal = quantity × unitPrice
 */
export class StandardProductStrategy extends BaseCalcStrategy<StandardCalcParams, CalcResult> {
    calculate(params: StandardCalcParams): CalcResult {
        const quantity = params.quantity ?? 0;
        const unitPrice = params.unitPrice ?? 0;
        // 使用整数运算避免浮点精度问题
        const subtotal = Math.round(quantity * unitPrice * 100) / 100;
        return {
            usage: quantity,
            subtotal,
        };
    }
}
