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

/**
 * 判断差额是否在允许范围内
 */
export function isWithinAllowedDifference(
    config: FinanceConfig,
    difference: number
): boolean {
    if (!config.allow_difference) {
        return difference === 0;
    }
    return Math.abs(difference) <= config.max_difference_amount;
}

/**
 * 获取差异处理结果
 */
export function getDifferenceHandlingResult(
    config: FinanceConfig,
    difference: number
): {
    allowed: boolean;
    action: 'NONE' | 'AUTO_ADJUST' | 'MANUAL_RECORD' | 'FORBIDDEN';
    message: string;
} {
    // 无差异
    if (difference === 0) {
        return { allowed: true, action: 'NONE', message: '金额匹配' };
    }

    // 不允许差异
    if (!config.allow_difference) {
        return { allowed: false, action: 'FORBIDDEN', message: '不允许金额差异' };
    }

    // 差异超出允许范围
    if (Math.abs(difference) > config.max_difference_amount) {
        return {
            allowed: false,
            action: 'FORBIDDEN',
            message: `差额 ${Math.abs(difference).toFixed(2)} 元超出允许范围 ${config.max_difference_amount} 元`,
        };
    }

    // 差异在允许范围内
    return {
        allowed: true,
        action: config.difference_handling,
        message: `差额 ${Math.abs(difference).toFixed(2)} 元，${config.difference_handling === 'AUTO_ADJUST' ? '自动调整' : '需人工确认'
            }`,
    };
}

/**
 * 根据配置进行抹零
 */
export function applyRounding(config: FinanceConfig, amount: number): number {
    if (!config.allow_rounding) {
        return amount;
    }

    // 确定精度
    let precision: number;
    switch (config.rounding_unit) {
        case 'YUAN':
            precision = 1; // 精确到元
            break;
        case 'JIAO':
            precision = 0.1; // 精确到角
            break;
        case 'FEN':
            precision = 0.01; // 精确到分
            break;
        default:
            precision = 1;
    }

    // 应用舍入模式
    if (config.rounding_mode === 'ROUND_DOWN') {
        return Math.floor(amount / precision) * precision;
    } else {
        // ROUND_HALF_UP (四舍五入)
        return Math.round(amount / precision) * precision;
    }
}
