// 用户类型定义
// 统一使用大写蛇形命名（UPPER_SNAKE_CASE）

/**
 * 用户角色类型
 * 命名规则: {类别}_{具体角色}
 */
export type UserRole =
    // 管理类角色 (LEAD_*)
    | 'LEAD_ADMIN'           // 系统管理员（最高权限）
    | 'LEAD_GENERAL'         // 普通领导
    | 'LEAD_VIEWER'          // 只读领导

    // 销售类角色
    | 'SALES_STORE'          // 驻店销售
    | 'SALES_REMOTE'         // 远程销售
    | 'SALES_CHANNEL'        // 渠道销售
    | 'LEAD_SALES'           // 销售主管
    | 'LEAD_CHANNEL'         // 渠道主管

    // 服务类角色
    | 'SERVICE_DISPATCH'     // 服务调度
    | 'SERVICE_MEASURE'      // 测量师
    | 'SERVICE_INSTALL'      // 安装师
    | 'DELIVERY_SERVICE'     // 订单客服
    | 'DESIGNER'             // 设计师

    // 审批类角色
    | 'APPROVER_BUSINESS'    // 业务审批人
    | 'APPROVER_FINANCIAL'   // 财务审批人
    | 'APPROVER_MANAGEMENT'  // 管理审批人

    // 财务/客户类角色
    | 'OTHER_FINANCE'        // 财务人员
    | 'OTHER_CUSTOMER'       // 客户
    | 'CUSTOMER'             // 客户（别名）

    // 合作伙伴角色
    | 'PARTNER_DESIGNER'     // 设计师
    | 'PARTNER_GUIDE'        // 导购

    // 基础用户角色（兼容旧数据）
    | 'user'                 // 基础用户（已废弃，请使用 USER_BASIC）
    | 'pro'                  // 专业用户（已废弃）
    | 'admin';               // 管理员（已废弃，请使用 LEAD_ADMIN）

/**
 * 用户接口
 */
export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: UserRole;
    avatar_url?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
    // 管理员 - 所有权限
    LEAD_ADMIN: ['all'],
    admin: ['all'],

    // 领导角色
    LEAD_GENERAL: ['lead_view', 'lead_manage', 'report_view'],
    LEAD_VIEWER: ['lead_view', 'report_view'],

    // 销售角色
    SALES_STORE: ['lead_create', 'lead_view', 'lead_track', 'quote_create', 'quote_view'],
    SALES_REMOTE: ['lead_create', 'lead_view', 'lead_track', 'quote_create', 'quote_view'],
    SALES_CHANNEL: ['lead_create', 'lead_view', 'lead_track', 'quote_create', 'quote_view'],
    LEAD_SALES: ['lead_create', 'lead_view', 'lead_manage', 'quote_create', 'quote_view', 'report_view'],
    LEAD_CHANNEL: ['lead_create', 'lead_view', 'lead_manage', 'quote_create', 'quote_view', 'report_view'],

    // 服务角色
    SERVICE_DISPATCH: ['service_assign', 'service_view', 'order_view'],
    SERVICE_MEASURE: ['service_measure', 'order_view'],
    SERVICE_INSTALL: ['service_install', 'order_view'],
    DELIVERY_SERVICE: ['order_view', 'order_update'],
    DESIGNER: ['design_view', 'design_create'],

    // 审批角色
    APPROVER_BUSINESS: ['approve_business'],
    APPROVER_FINANCIAL: ['approve_financial', 'finance_view'],
    APPROVER_MANAGEMENT: ['approve_management'],

    // 财务角色
    OTHER_FINANCE: ['finance_view', 'finance_approve'],

    // 客户角色
    OTHER_CUSTOMER: ['order_view'],
    CUSTOMER: ['order_view'],

    // 合作伙伴
    PARTNER_DESIGNER: ['design_view', 'design_create'],
    PARTNER_GUIDE: ['lead_view'],

    // 基础用户
    user: [],
    pro: ['lead_view'],
} as const;

/**
 * 角色中文名称
 */
export const ROLE_LABELS: Record<UserRole, string> = {
    LEAD_ADMIN: '系统管理员',
    LEAD_GENERAL: '领导',
    LEAD_VIEWER: '领导（只读）',
    SALES_STORE: '驻店销售',
    SALES_REMOTE: '远程销售',
    SALES_CHANNEL: '渠道销售',
    LEAD_SALES: '销售主管',
    LEAD_CHANNEL: '渠道主管',
    SERVICE_DISPATCH: '服务调度',
    SERVICE_MEASURE: '测量师',
    SERVICE_INSTALL: '安装师',
    DELIVERY_SERVICE: '订单客服',
    DESIGNER: '设计师',
    APPROVER_BUSINESS: '业务审批人',
    APPROVER_FINANCIAL: '财务审批人',
    APPROVER_MANAGEMENT: '管理审批人',
    OTHER_FINANCE: '财务',
    OTHER_CUSTOMER: '客户',
    CUSTOMER: '客户',
    PARTNER_DESIGNER: '设计师',
    PARTNER_GUIDE: '导购',
    user: '基础用户',
    pro: '专业用户',
    admin: '管理员',
};
