/**
 * 智能预警系统 - 预警类型配置
 * 
 * 定义了 8 种预警类型及其触发规则
 */

export type WarningType =
    | 'TIMEOUT_ASSIGNMENT'           // 待分配超时
    | 'TIMEOUT_FOLLOW_UP'           // 待跟踪超时
    | 'TIMEOUT_LONG_NO_UPDATE'      // 长期未跟进
    | 'TIMEOUT_MEASUREMENT'         // 待测量超时
    | 'HIGH_INTENT_NO_FOLLOW_UP'    // 高意向无跟进（新增）
    | 'BUDGET_OVERRUN'              // 预算超支（新增）
    | 'CHURN_RISK'                  // 流失风险（新增）
    | 'COMPETITOR_THREAT';          // 竞品威胁（新增）

export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Warning {
    id: string;
    type: WarningType;
    severity: WarningSeverity;
    leadId?: string;
    orderId?: string;
    title: string;
    message: string;
    actionRequired: string;
    createdAt: Date;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}

/**
 * 预警规则配置
 */
export const WARNING_RULES: Record<WarningType, {
    title: string;
    description: string;
    severity: WarningSeverity;
    checkInterval: number; // 检查间隔（分钟）
}> = {
    TIMEOUT_ASSIGNMENT: {
        title: '待分配超时',
        description: '线索待分配超过24小时',
        severity: 'high',
        checkInterval: 60,
    },
    TIMEOUT_FOLLOW_UP: {
        title: '待跟踪超时',
        description: '线索待跟踪超过48小时',
        severity: 'high',
        checkInterval: 120,
    },
    TIMEOUT_LONG_NO_UPDATE: {
        title: '长期未跟进',
        description: '跟踪中的线索7天内无更新',
        severity: 'medium',
        checkInterval: 1440, // 每天
    },
    TIMEOUT_MEASUREMENT: {
        title: '待测量超时',
        description: '待测量订单超过48小时',
        severity: 'high',
        checkInterval: 120,
    },
    HIGH_INTENT_NO_FOLLOW_UP: {
        title: '高意向无跟进',
        description: '评分>80的线索3天内无跟进记录',
        severity: 'critical',
        checkInterval: 360, // 每6小时
    },
    BUDGET_OVERRUN: {
        title: '预算超支',
        description: '订单实际金额超出预算120%',
        severity: 'medium',
        checkInterval: 720, // 每12小时
    },
    CHURN_RISK: {
        title: '流失风险',
        description: '客户30天内无互动记录',
        severity: 'medium',
        checkInterval: 1440, // 每天
    },
    COMPETITOR_THREAT: {
        title: '竞品威胁',
        description: '备注中出现竞品关键词',
        severity: 'high',
        checkInterval: 60,
    },
};

/**
 * 竞品关键词列表
 */
export const COMPETITOR_KEYWORDS = [
    '摩力克',
    '欧尚',
    '金蝉',
    '美居乐',
    '如鱼得水',
    '其他品牌',
    '价格更低',
    '去看看别家',
];

/**
 * 客户端预警检测函数
 */

/**
 * 检测高意向无跟进
 */
export function detectHighIntentNoFollowUp(lead: any): Warning | null {
    if (!lead.score || lead.score <= 80) return null;
    if (!lead.lastFollowUpAt) return null;

    const daysSinceFollowUp = (Date.now() - new Date(lead.lastFollowUpAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceFollowUp > 3) {
        return {
            id: `warning-${lead.id}-high-intent`,
            type: 'HIGH_INTENT_NO_FOLLOW_UP',
            severity: 'critical',
            leadId: lead.id,
            title: '高意向线索需要跟进',
            message: `线索「${lead.name}」评分 ${lead.score}，但已 ${Math.floor(daysSinceFollowUp)} 天无跟进记录`,
            actionRequired: '立即安排跟进',
            createdAt: new Date(),
            metadata: {
                score: lead.score,
                daysSinceFollowUp: Math.floor(daysSinceFollowUp),
            },
        };
    }

    return null;
}

/**
 * 检测预算超支
 */
export function detectBudgetOverrun(order: any): Warning | null {
    if (!order.budgetMax || !order.actualAmount) return null;

    const overrunPercentage = (order.actualAmount / order.budgetMax) * 100;

    if (overrunPercentage > 120) {
        return {
            id: `warning-${order.id}-budget`,
            type: 'BUDGET_OVERRUN',
            severity: 'medium',
            orderId: order.id,
            title: '订单预算超支',
            message: `订单「${order.orderNumber}」实际金额 ¥${order.actualAmount.toLocaleString()}，超出预算 ${(overrunPercentage - 100).toFixed(1)}%`,
            actionRequired: '与客户确认调整方案',
            createdAt: new Date(),
            metadata: {
                budget: order.budgetMax,
                actualAmount: order.actualAmount,
                overrunPercentage: overrunPercentage.toFixed(1),
            },
        };
    }

    return null;
}

/**
 * 检测流失风险
 */
export function detectChurnRisk(customer: any): Warning | null {
    if (!customer.lastInteractionAt) return null;

    const daysSinceInteraction = (Date.now() - new Date(customer.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceInteraction > 30) {
        return {
            id: `warning-${customer.id}-churn`,
            type: 'CHURN_RISK',
            severity: 'medium',
            leadId: customer.leadId,
            title: '客户流失风险',
            message: `客户「${customer.name}」已 ${Math.floor(daysSinceInteraction)} 天无互动`,
            actionRequired: '主动联系客户，了解需求',
            createdAt: new Date(),
            metadata: {
                daysSinceInteraction: Math.floor(daysSinceInteraction),
            },
        };
    }

    return null;
}

/**
 * 检测竞品威胁
 */
export function detectCompetitorThreat(lead: any): Warning | null {
    if (!lead.notes && !lead.remarks) return null;

    const text = `${lead.notes || ''} ${lead.remarks || ''}`.toLowerCase();
    const foundKeywords = COMPETITOR_KEYWORDS.filter(keyword =>
        text.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
        return {
            id: `warning-${lead.id}-competitor`,
            type: 'COMPETITOR_THREAT',
            severity: 'high',
            leadId: lead.id,
            title: '竞品威胁',
            message: `线索「${lead.name}」备注中提到竞品：${foundKeywords.join('、')}`,
            actionRequired: '准备竞品对比资料，突出优势',
            createdAt: new Date(),
            metadata: {
                detectedKeywords: foundKeywords,
            },
        };
    }

    return null;
}
