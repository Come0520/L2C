export type PointsTransactionType = 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'expire' | 'refund' | 'pending' | 'confirm';
export type PointsRuleType = 'fixed' | 'percentage';

export interface PointsAccount {
    id: string;
    user_id: string;
    total_points: number;
    available_points: number;
    frozen_points: number;
    pending_points: number; // 新增: 在途积分
    created_at: string;
    updated_at: string;
}

export interface PointsTransaction {
    id: string;
    account_id: string; // 保持为account_id,在服务层映射
    amount: number;
    type: PointsTransactionType;
    source_type: string;
    source_id?: string;
    description?: string;
    created_at: string;
}

export interface PointsRule {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: PointsRuleType;
    value: number;
    is_active: boolean;
    start_time?: string;
    end_time?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// 积分商城相关类型
// ============================================

export type MallProductCategory = 'electronics' | 'home' | 'gift_card' | 'special' | 'other';

export interface MallProduct {
    id: string;
    name: string;
    description?: string;
    category: MallProductCategory;
    points_required: number;
    stock_quantity: number;
    image_url?: string;
    is_available: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type MallOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface MallOrder {
    id: string;
    user_id: string;
    product_id: string;
    product_name: string;
    points_spent: number;
    status: MallOrderStatus;
    tracking_number?: string;
    shipping_address?: string;
    contact_phone?: string;
    remark?: string;
    created_at: string;
    updated_at: string;
    // 关联查询字段(可选)
    product?: MallProduct;
}

export interface CreateMallOrderParams {
    product_id: string;
    shipping_address: string;
    contact_phone: string;
    remark?: string;
}

// ============================================
// 积分系数管理相关类型
// ============================================

export type CoefficientRuleStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'expired';
export type ApprovalStatus = 'pending_channel' | 'pending_leader' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalSubStatus = 'pending' | 'approved' | 'rejected';

export interface CoefficientRule {
    id: string;
    rule_code: string;
    rule_name: string;
    description?: string;
    
    // 适用范围
    product_category?: string;
    product_model?: string;
    region_code?: string;
    store_id?: string;
    
    // 系数
    base_coefficient: number;
    time_coefficient: number;
    final_coefficient: number;
    
    // 生效时间
    start_time: string;
    end_time: string;
    
    // 状态
    status: CoefficientRuleStatus;
    
    // 审批信息
    approval_id?: string;
    approved_by?: string;
    approved_at?: string;
    
    // 创建信息
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CoefficientApproval {
    id: string;
    approval_no: string;
    title: string;
    reason: string;
    rule_ids: string[];
    
    // 审批状态
    status: ApprovalStatus;
    
    // 渠道负责人审批
    channel_approver_id?: string;
    channel_approval_status?: ApprovalSubStatus;
    channel_approval_comment?: string;
    channel_approved_at?: string;
    
    // 领导审批
    leader_approver_id?: string;
    leader_approval_status?: ApprovalSubStatus;
    leader_approval_comment?: string;
    leader_approved_at?: string;
    
    // 最终结果
    final_status?: string;
    final_approved_at?: string;
    
    // 提交信息
    submitted_by: string;
    submitted_by_role: string;
    submitted_at: string;
    
    created_at: string;
    updated_at: string;
    
    // 关联查询(可选)
    rules?: CoefficientRule[];
}

export interface CreateCoefficientRuleParams {
    rule_name: string;
    description?: string;
    product_category?: string;
    product_model?: string;
    region_code?: string;
    store_id?: string;
    base_coefficient: number;
    time_coefficient: number;
    start_time: string;
    end_time: string;
}

export interface CreateApprovalParams {
    title: string;
    reason: string;
    rule_ids: string[];
}

export interface ApproveParams {
    approval_id: string;
    approved: boolean;
    comment?: string;
}
