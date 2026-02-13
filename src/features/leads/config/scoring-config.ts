/**
 * 线索评分配置
 * 
 * 将评分权重提取为可配置常量，便于后续：
 * 1. 通过系统设置界面调整
 * 2. 针对不同租户自定义
 * 3. A/B 测试不同评分模型
 */

// ============================================================
// 来源权重配置 (总分贡献: 0-30 分)
// ============================================================

/**
 * 渠道来源权重
 * 键为渠道类型代码，值为对应分数
 */
export const SOURCE_WEIGHTS: Record<string, number> = {
    REFERRAL: 30,        // 转介绍 - 最高质量来源
    REPEAT: 25,          // 老客户复购
    OFFLINE_EVENT: 20,   // 线下活动
    ONLINE_AD: 15,       // 线上广告
    PHONE_INQUIRY: 12,   // 电话咨询
    WALK_IN: 10,         // 自然进店
    OTHER: 5,            // 其他来源
} as const;

/** 默认来源分数（当无法匹配渠道时使用） */
export const DEFAULT_SOURCE_SCORE = 5;

/** 有渠道但类型未知时的分数 */
export const UNKNOWN_CHANNEL_SCORE = 15;

// ============================================================
// 意向度权重配置 (总分贡献: 0-35 分)
// ============================================================

/**
 * 意向度等级权重
 */
export const INTENTION_WEIGHTS: Record<string, number> = {
    HIGH: 35,     // 高意向
    MEDIUM: 20,   // 中意向
    LOW: 10,      // 低意向
} as const;

/** 默认意向度分数 */
export const DEFAULT_INTENTION_SCORE = 10;

// ============================================================
// 预算阈值配置 (总分贡献: 0-35 分)
// ============================================================

/**
 * 预算分数阈值
 * 按预算金额区间分配分数
 */
export const BUDGET_THRESHOLDS = [
    { min: 50000, score: 35 },  // ≥5万：满分
    { min: 20000, score: 28 },  // 2-5万
    { min: 10000, score: 20 },  // 1-2万
    { min: 5000, score: 12 },   // 5千-1万
    { min: 1, score: 5 },       // >0
    { min: 0, score: 0 },       // 无预算
] as const;

// ============================================================
// 评分等级配置
// ============================================================

/**
 * 星级评定阈值
 */
export const STAR_RATING_THRESHOLDS = [
    { minScore: 80, stars: 5 },
    { minScore: 60, stars: 4 },
    { minScore: 40, stars: 3 },
    { minScore: 20, stars: 2 },
    { minScore: 0, stars: 1 },
] as const;

/**
 * 优先级标签阈值
 */
export const PRIORITY_LABEL_THRESHOLDS = [
    { minScore: 70, label: '热门线索' },
    { minScore: 50, label: '优质线索' },
    { minScore: 30, label: '普通线索' },
    { minScore: 0, label: '待培育' },
] as const;

// ============================================================
// 工具函数
// ============================================================

/**
 * 根据预算计算分数
 */
export function calculateBudgetScore(budget: number): number {
    for (const threshold of BUDGET_THRESHOLDS) {
        if (budget >= threshold.min) {
            return threshold.score;
        }
    }
    return 0;
}

/**
 * 根据总分获取星级
 */
export function getStarRating(totalScore: number): number {
    for (const threshold of STAR_RATING_THRESHOLDS) {
        if (totalScore >= threshold.minScore) {
            return threshold.stars;
        }
    }
    return 1;
}

/**
 * 根据总分获取优先级标签
 */
export function getPriorityLabel(totalScore: number): string {
    for (const threshold of PRIORITY_LABEL_THRESHOLDS) {
        if (totalScore >= threshold.minScore) {
            return threshold.label;
        }
    }
    return '待培育';
}
