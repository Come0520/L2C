/**
 * 财务配置类型定义
 * 单独文件避免循环依赖
 */

export interface FinanceConfig {
    allow_difference: boolean;
    max_difference_amount: number;
    difference_handling: 'AUTO_ADJUST' | 'MANUAL_RECORD' | 'FORBIDDEN';
    allow_rounding: boolean;
    rounding_mode: 'ROUND_DOWN' | 'ROUND_HALF_UP';
    rounding_unit: 'YUAN' | 'JIAO' | 'FEN';
}

// 默认配置
export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
    allow_difference: false,
    max_difference_amount: 100,
    difference_handling: 'MANUAL_RECORD',
    allow_rounding: false,
    rounding_mode: 'ROUND_HALF_UP',
    rounding_unit: 'YUAN',
};

// 内存缓存（用于服务端缓存）
export const configCache = new Map<string, { config: FinanceConfig; expireAt: number }>();
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
