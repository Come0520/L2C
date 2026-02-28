import { z } from 'zod';
import { type DbTransaction } from '@/shared/api/db';

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
  /** 业务实体类型编码 */
  entityType: string;
  /** 业务实体 ID */
  entityId: string;
  /** 实例状态: PENDING, APPROVED, REJECTED, CANCELED */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | null;
  /** 发起人 ID */
  requesterId: string;
  /** 申请说明 */
  comment?: string | null;
  /** 发起时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 完成时间 */
  completedAt?: Date | null;

  // Relations (Partial/Optional)
  flow?: {
    name: string;
    code: string;
  } | null;
  requester?: {
    name: string | null;
    email: string | null;
  } | null;
}

/**
 * 审批任务接口（待处理项）
 */
export interface ApprovalTask {
  /** 任务唯一标识 */
  id: string;
  /** 租户 ID */
  tenantId: string;
  /** 关联审批实例 ID */
  approvalId: string;
  /** 关联流程节点 ID */
  nodeId: string | null;
  /** 对应审批人 ID */
  approverId: string | null;
  /** 任务状态: PENDING, APPROVED, REJECTED */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  /** 审批意见 */
  comment?: string | null;
  /** 是否动力/加签任务 */
  isDynamic: boolean | null;
  /** 执行操作时间 */
  actionAt?: Date | null;
  /** 超时时间 */
  timeoutAt?: Date | null;
  /** 创建时间 */
  createdAt: Date;

  // Relations
  approval: ApprovalInstance;
  node: {
    name: string;
  };
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
  tx?: DbTransaction;
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
export const submitApprovalSchema = z
  .object({
    /** 流程定义编码 */
    flowCode: z.string().min(1, '流程编码不能为空'),
    /** 业务实体类型 */
    entityType: z.enum([
      'QUOTE',
      'ORDER',
      'PAYMENT_BILL',
      'RECEIPT_BILL',
      'MEASURE_TASK',
      'ORDER_CHANGE',
      'LEAD_RESTORE',
      'ORDER_CANCEL',
      'CUSTOMER_MERGE',
    ]),
    /** 业务实体 ID */
    entityId: z.string().uuid('无效的实体 ID'),
    /** 业务关联金额 */
    amount: z.union([z.string(), z.number()]).optional(),
    /** 申请备注 */
    comment: z.string().optional(),
    /** 租户 ID (可选，通常从 Session 获取) */
    tenantId: z.string().uuid().optional(),
    /** 发起人 ID (可选，通常从 Session 获取) */
    requesterId: z.string().uuid().optional(),
  })
  .passthrough(); // 允许额外的条件字段

/**
 * 处理审批任务的输入校验 Schema (processApproval)
 */
export const processApprovalSchema = z.object({
  /** 审批任务 ID (approval_tasks.id) */
  taskId: z.string().uuid('无效的任务 ID'),
  /** 执行操作：通过、驳回 */
  action: z.enum(['APPROVE', 'REJECT']),
  /** 审批意见评论 */
  comment: z.string().optional(),
});

/**
 * 审批加签输入校验 Schema
 */
export const addApproverSchema = z.object({
  /** 当前任务 ID */
  taskId: z.string().uuid('无效的任务 ID'),
  /** 目标加签用户 ID */
  targetUserId: z.string().uuid('无效的目标用户 ID'),
  /** 加签说明 */
  comment: z.string().optional(),
});

/**
 * 撤回审批实例的输入校验 Schema (withdrawApproval)
 */
export const withdrawApprovalSchema = z.object({
  /** 审批实例 ID */
  instanceId: z.string().uuid('无效的实例 ID'),
  /** 撤回原因评论 */
  reason: z.string().optional(),
});

/**
 * 撤销审批动作的输入校验 Schema (revokeApprovalAction)
 */
export const revokeApprovalSchema = z.object({
  /** 审批实例 ID */
  approvalId: z.string().uuid('无效的审批 ID'),
});

// ==================== Zod Schemas for Flow ====================
export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
  position: z.object({ x: z.number(), y: z.number() }),
});

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
});

export const createFlowSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

export const saveFlowDefinitionSchema = z.object({
  flowId: z.string(),
  definition: z.object({
    nodes: z.array(flowNodeSchema),
    edges: z.array(flowEdgeSchema),
  }),
});

export const publishFlowSchema = z.object({
  flowId: z.string(),
});

// ==================== Zod Schemas for Queries ====================
export const emptySchema = z.object({});

export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(10),
});

export const getApprovalDetailsSchema = z.object({
  id: z.string().uuid(),
});

// ==================== Zod Schemas for Templates ====================
export const initializeTemplatesSchema = z.object({});
