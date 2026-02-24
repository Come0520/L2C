/**
 * 管理策略引擎 (Admin Policy Engine)
 * 
 * 设计意图：
 * 1. 为纯 RBAC 模型预留 ABAC 扩展能力
 * 2. 支持自定义策略规则（时间窗口、IP 白名单、操作频率等）
 */

import { logger } from '@/shared/lib/logger';

/** 策略决策结果 */
export type PolicyDecision =
    | { allowed: true }
    | { allowed: false; reason: string };

/** 策略上下文 — 描述一次权限检查的完整环境 */
export interface PolicyContext {
    userId: string;
    tenantId: string;
    action: string;         // 操作类型，如 'ROLE_UPDATE'
    resource: string;       // 目标资源，如 'roles'
    timestamp: Date;
    attributes?: Record<string, unknown>;  // ABAC 扩展属性 (如 IP, MFA 状态等)
}

/** 策略规则接口 */
export interface PolicyRule {
    name: string;
    description: string;
    evaluate: (ctx: PolicyContext) => Promise<PolicyDecision>;
}

/**
 * 策略评估器
 */
export class PolicyEngine {
    private static rules: PolicyRule[] = [];

    /** 注册策略规则 */
    static registerRule(rule: PolicyRule) {
        this.rules.push(rule);
    }

    /**
     * 执行策略评估
     * 采用“一票否决制”：任一规则拒绝则整体拒绝
     */
    static async evaluate(ctx: PolicyContext): Promise<PolicyDecision> {
        logger.info(`[PolicyEngine] 正在评估操作: ${ctx.action} 资源: ${ctx.resource} 用户: ${ctx.userId}`);

        for (const rule of this.rules) {
            const decision = await rule.evaluate(ctx);
            if (!decision.allowed) {
                logger.warn(`[PolicyEngine] 策略拒绝: ${rule.name}, 原因: ${decision.reason}`);
                return decision;
            }
        }

        return { allowed: true };
    }
}

// ========== 内置通用策略示例 (待具体实现) ==========

/** 时间窗口策略（演示 ABAC 潜力） */
export const WorkingHoursPolicy: PolicyRule = {
    name: 'WorkingHours',
    description: '限制非工作时间的高危管理操作',
    evaluate: async (ctx) => {
        const hour = ctx.timestamp.getHours();
        // 假设 23:00 - 06:00 为限制访问时间（仅供演示，实际可从租户配置读取）
        if (hour >= 23 || hour < 6) {
            return { allowed: false, reason: '非工作时间禁止执行敏感管理操作' };
        }
        return { allowed: true };
    }
};
