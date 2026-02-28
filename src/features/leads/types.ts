/**
 * 线索模块 - 类型定义
 *
 * 定义线索模块共有的接口类型，包括渠道信息、销售用户、
 * 以及各种对话框组件所需的 Props 接口。
 *
 * @module leads/types
 */

/** 渠道信息接口，用于线索来源标识 */
export interface Channel {
  id: string;
  name: string;
  isActive: boolean;
  /** 渠道类型，如 'ONLINE' | 'OFFLINE' | 'REFERRAL' 等 */
  type: string;
}

/** 销售用户信息接口，用于分配销售和联系人展示 */
export interface SalesUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

/** 分配线索对话框组件 Props */
export interface AssignLeadDialogProps {
  leadId: string;
  currentAssignedId?: string | null;
  /** 线索创建人 ID（用于推荐排序） */
  createdById?: string | null;
  /** 线索创建人名称 */
  createdByName?: string | null;
  /** 线索备注（显示给经理参考） */
  notes?: string | null;
  /** 客户名称 */
  customerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** 跟进记录对话框组件 Props */
export interface FollowupDialogProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** 线索评分结果类型，由评分模型计算返回 */
export interface LeadScoreResult {
  leadId: string;
  score: {
    source: number;
    intention: number;
    budget: number;
    total: number;
  };
  starRating: number;
  priorityLabel: string;
  breakdown: {
    sourceLabel: string;
    intentionLabel: string;
    budgetAmount: number;
  };
}
