/**
 * 财务配置工具函数
 * 这些是纯函数，不涉及数据库操作，可以在客户端和服务端使用
 */

import type { FinanceConfig } from './finance-config-types';
import { configCache } from './finance-config-types';

// 重新导出供其他模块就近导入
export { configCache };


/**
 * 清除配置缓存（配置更新后调用）
 */
export function clearFinanceConfigCache(tenantId: string): void {
    configCache.delete(tenantId);
}

import { Decimal } from 'decimal.js';

/**
 * 判断差额是否在允许范围内
 */
export function isWithinAllowedDifference(
    config: FinanceConfig,
    difference: number | string | Decimal
): boolean {
    const diff = new Decimal(difference);
    if (!config.allow_difference) {
        return diff.isZero();
    }
    return diff.abs().lte(config.max_difference_amount);
}

/**
 * 获取差异处理结果
 */
export function getDifferenceHandlingResult(
    config: FinanceConfig,
    difference: number | string | Decimal
): {
    allowed: boolean;
    action: 'NONE' | 'AUTO_ADJUST' | 'MANUAL_RECORD' | 'FORBIDDEN';
    message: string;
} {
    const diff = new Decimal(difference);

    // 无差异
    if (diff.isZero()) {
        return { allowed: true, action: 'NONE', message: '金额匹配' };
    }

    // 不允许差异
    if (!config.allow_difference) {
        return { allowed: false, action: 'FORBIDDEN', message: '不允许金额差异' };
    }

    // 差异超出允许范围
    const absDiff = diff.abs();
    if (absDiff.gt(config.max_difference_amount)) {
        return {
            allowed: false,
            action: 'FORBIDDEN',
            message: `差额 ${absDiff.toFixed(2)} 元超出允许范围 ${config.max_difference_amount} 元`,
        };
    }

    // 差异在允许范围内
    return {
        allowed: true,
        action: config.difference_handling,
        message: `差额 ${absDiff.toFixed(2)} 元，${config.difference_handling === 'AUTO_ADJUST' ? '自动调整' : '需人工确认'
            }`,
    };
}

/**
 * 根据配置进行抹零
 */
export function applyRounding(config: FinanceConfig, amount: number | string | Decimal): number {
    const amt = new Decimal(amount);
    if (!config.allow_rounding) {
        return amt.toNumber();
    }

    // 确定精度
    let precision: Decimal;
    switch (config.rounding_unit) {
        case 'YUAN':
            precision = new Decimal(1); // 精确到元
            break;
        case 'JIAO':
            precision = new Decimal(0.1); // 精确到角
            break;
        case 'FEN':
            precision = new Decimal(0.01); // 精确到分
            break;
        default:
            precision = new Decimal(1);
    }

    // 应用舍入模式
    if (config.rounding_mode === 'ROUND_DOWN') {
        // 向下取整： amt / precision 后的整数部分 * precision
        return amt.div(precision).floor().mul(precision).toNumber();
    } else {
        // ROUND_HALF_UP (四舍五入)
        return amt.div(precision).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).mul(precision).toNumber();
    }
}
