import { z } from 'zod';
import { type Transaction } from '@/shared/api/db';

// ==================== Types ====================

/**
 * 审批步骤接口（扁平化后的节点）
 */
export interface ApprovalStep {
    /** 步骤序号/顺序 */
    order: number;
    /** 步骤名称 */
    name: string;
    /** 审批人类型：ROLE(角色), USER(具体用户), CREATOR_MANAGER(发起人主管) */
    approverType: 'ROLE' | 'USER' | 'CREATOR_MANAGER';
    /** 审批人标识值（userId 或 roleId） */
    approverValue: string;
    /** 是否必须审批（此步骤不可跳过） */
    required: boolean;
}

/**
 * 审批流动图节点类型
 */
export type NodeType = 'start' | 'end' | 'approver' | 'condition' | 'parallel';

/**
 * 审批流程设计器中的节点接口
 */
export interface ApprovalNode {
    /** 节点唯一标识 */
    id: string;
    /** 节点类型 */
    type: NodeType;
    /** 节点数据配置 */
    data: {
        /** 显示名称 */
        label: string;
        /** 审批人类型（仅限 approver 节点） */
        approverType?: 'ROLE' | 'USER' | 'CREATOR_MANAGER';
        /** 审批人标识值 */
        approverValue?: string;
        /** 审批模式：ANY(任一通过), ALL(全部通过), MAJORITY(半数通过) */
        approverMode?: 'ANY' | 'ALL' | 'MAJORITY';
        /** 条件表达式（仅限 condition 节点） */
        condition?: string;
    };
    /** 在画板中的视觉坐标 */
    position: { x: number; y: number };
}

/**
 * 审批流程设计器中的边接口
 */
export interface ApprovalEdge {
    /** 边唯一标识 */
    id: string;
    /** 源节点 ID */
    source: string;
    /** 目标节点 ID */
    target: string;
    /** 边线条类型 */
    type: 'default' | 'smoothstep';
    /** 分支标签（如条件节点的 "是"、"否"） */
    label?: string;
}

/**
 * 完整审批流程图形定义
 */
export interface ApprovalFlowDefinition {
    /** 节点集合 */
    nodes: ApprovalNode[];
    /** 边集合 */
    edges: ApprovalEdge[];
}

/**
 * 审批实例接口
 */
export interface ApprovalInstance {
    /** 实例唯一标识 */
    id: string;
    /** 租户 ID */
    tenantId: string;
    /** 关联流程定义 ID */
    flowId: string | null;
    /** 模块名称（如 QUOTE, ORDER） */
    module: string;
    /** 业务实体 ID */
    entityId: string;
    /** 实例状态: PENDING, APPROVED, REJECTED 等 */
    status: string | null;
    /** 当前执行步骤序号 */
    currentStep: number | null;
    /** 发起人 ID */
    applicantId: string | null;
    /** 发起时间 */
    appliedAt: Date | null;
    /** 完成时间 */
    completedAt: Date | null;
    /** 最终截止时间 */
    deadlineAt: Date | null;
    /** 最近一次提醒时间 */
    remindedAt: Date | null;
}

/**
 * 审批相关通知参数
 */
export interface NotificationParams {
    /** 租户 ID */
    tenantId: string;
    /** 接收用户 ID */
    userId: string;
    /** 通知标题 */
    title: string;
    /** 通知正文内容 */
    content: string;
    /** 附加元数据 */
    metadata?: Record<string, unknown>;
    /** 可选的事务上下文 */
    tx?: Transaction;
}

/**
 * 系统级会话接口，用于替代常规用户 Session 执行自动化操作
 */
export interface SystemSession {
    user: {
        id: string;
        tenantId: string;
        name: string;
        role: string;
    };
    expires: string;
}

// ==================== Schemas ====================

/**
 * 提交审批的输入校验 Schema
 */
export const submitApprovalSchema = z.object({
    /** 流程定义 ID */
    flowId: z.string(),
    /** 业务实体 ID */
    entityId: z.string(),
    /** 业务实体类型编码 */
    entityType: z.string(),
    /** 申请人 ID（默认为当前会话用户） */
    applicantId: z.string().optional(),
});

/**
 * 处理审批任务的输入校验 Schema
 */
export const processApprovalSchema = z.object({
    /** 审批实例 ID */
    instanceId: z.string(),
    /** 执行操作：通过、驳回 */
    action: z.enum(['APPROVE', 'REJECT']),
    /** 审批意见评论 */
    comment: z.string().optional(),
});
