import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'SALES',
  'MANAGER',
  'WORKER',
  'FINANCE',
  'SUPPLY',
]);

export const productCategoryEnum = pgEnum('product_category', [
  'CURTAIN',
  'WALLPAPER',
  'WALLCLOTH',
  'MATTRESS',
  'OTHER',
  'CURTAIN_FABRIC',
  'CURTAIN_SHEER',
  'CURTAIN_TRACK',
  'MOTOR',
  'CURTAIN_ACCESSORY',
  'WALLCLOTH_ACCESSORY', // 墙布辅料
  'WALLPANEL', // 墙咔
  'WINDOWPAD', // 飘窗垫
  'STANDARD', // 标品
  'SERVICE', // 服务/费用
  'BLIND', // 功能帘 (New)
  'SOFT_PACK', // 软/硬包 (New)
  'WALL_ACCESSORY', // 墙面辅料 (New)
  'PANEL_ACCESSORY', // 墙咔/软包附件 (New)
  'HARDWARE', // 五金 (New)
]);

// 商品类型枚举（成品/定制）
export const productTypeEnum = pgEnum('product_type', [
  'FINISHED', // 成品商品（直接采购）
  'CUSTOM', // 定制商品（需二次加工）
]);

// 套餐类型枚举
export const packageTypeEnum = pgEnum('package_type', [
  'QUANTITY', // 数量套餐
  'COMBO', // 组合套餐
  'CATEGORY', // 品类套餐
  'TIME_LIMITED', // 限时套餐
]);

// 套餐超出处理模式枚举
export const packageOverflowModeEnum = pgEnum('package_overflow_mode', [
  'FIXED_PRICE', // 固定单价（超出部分按设定单价）
  'IGNORE', // 不计费（封顶模式）
  'ORIGINAL', // 原价
  'DISCOUNT', // 折扣
]);

// 面料库存流水类型枚举
export const fabricInventoryLogTypeEnum = pgEnum('fabric_inventory_log_type', [
  'PURCHASE_IN', // 面料入库
  'PROCESSING_OUT', // 面料出库
  'ADJUSTMENT', // 库存调整
  'RETURN', // 面料退库
]);

export const orderStatusEnum = pgEnum('order_status', [
  'DRAFT',
  'PENDING_MEASURE',
  'MEASURED',
  'QUOTED',
  'SIGNED',
  'PAID',
  'PENDING_PO', // Waiting for Purchase Order generation
  'PENDING_PRODUCTION',
  'IN_PRODUCTION',
  'PAUSED', // Keeping for backward compatibility if needed, or migration
  'HALTED', // New standard halt status
  'PENDING_APPROVAL',
  'PENDING_DELIVERY',
  'PENDING_INSTALL',
  'INSTALLATION_COMPLETED', // Installed, waiting for customer acceptance
  'PENDING_CONFIRMATION', // Same as above, but explicit "Wait for Confirmation" state
  'INSTALLATION_REJECTED', // Customer rejected installation
  'COMPLETED',
  'CANCELLED',
]);

export const quoteStatusEnum = pgEnum('quote_status', [
  'DRAFT', // 草稿
  'PENDING_APPROVAL', // 待审批（风险触发）
  'APPROVED', // 已批准
  'PENDING_CUSTOMER', // 待客户确认
  'ACCEPTED', // 客户已接受
  'REJECTED', // 已拒绝/驳回
  'LOCKED', // 已锁定（转单前）
  'ORDERED', // 已转订单
  'EXPIRED', // 已过期
]);

export const quotePlanTypeEnum = pgEnum('quote_plan_type', ['ECONOMIC', 'COMFORT', 'LUXURY']);

export const customerTypeEnum = pgEnum('customer_type', [
  'INDIVIDUAL',
  'COMPANY',
  'DESIGNER',
  'PARTNER',
]);
export const customerLevelEnum = pgEnum('customer_level', ['A', 'B', 'C', 'D']);
export const settlementTypeEnum = pgEnum('settlement_type', ['CASH', 'TRANSFER']);
export const roomTypeEnum = pgEnum('room_type', [
  'LIVING_ROOM',
  'BEDROOM',
  'DINING_ROOM',
  'STUDY',
  'BALCONY',
  'BATHROOM',
  'KITCHEN',
  'OTHER',
]);
export const headerProcessTypeEnum = pgEnum('header_process_type', [
  'HOOK',
  'PUNCH',
  'FIXED_PLEAT',
]);

export const customerLifecycleStageEnum = pgEnum('customer_lifecycle_stage', [
  'LEAD',
  'OPPORTUNITY',
  'SIGNED',
  'DELIVERED',
  'LOST',
]);

export const customerPipelineStatusEnum = pgEnum('customer_pipeline_status', [
  'UNASSIGNED',
  'PENDING_FOLLOWUP',
  'PENDING_MEASUREMENT',
  'PENDING_QUOTE',
  'QUOTE_SENT',
  'IN_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_INSTALLATION',
  'COMPLETED',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'PENDING_ASSIGNMENT',
  'PENDING_FOLLOWUP',
  'FOLLOWING_UP',
  'INVALID',
  'WON',
  'VOID', // Keeping VOID for backward compatibility if needed, or remove if strictly following new reqs. Req said INVALID. But code had VOID. I'll add INVALID and keep VOID if code uses it, or map. Let's stick to Requirements: INVALID. But existing code uses VOID. I will add both or migrate. Code `voidLead` uses VOID. I'll add both for now to be safe.
]);

export const intentionLevelEnum = pgEnum('intention_level', ['HIGH', 'MEDIUM', 'LOW']);

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
  'PHONE_CALL',
  'WECHAT_CHAT',
  'STORE_VISIT',
  'HOME_VISIT',
  'QUOTE_SENT',
  'SYSTEM',
]);

export const channelCategoryEnum = pgEnum('channel_category', ['ONLINE', 'OFFLINE', 'REFERRAL']);
export const channelTypeEnum = pgEnum('channel_type', [
  'DECORATION_CO',
  'DESIGNER',
  'CROSS_INDUSTRY',
  'DOUYIN', // New
  'XIAOHONGSHU', // New
  'STORE', // New (Self-operated Store)
  'OTHER',
]);
export const channelLevelEnum = pgEnum('channel_level', ['S', 'A', 'B', 'C']);
export const commissionTypeEnum = pgEnum('commission_type', ['FIXED', 'TIERED']);
export const cooperationModeEnum = pgEnum('cooperation_mode', ['BASE_PRICE', 'COMMISSION']);
export const channelSettlementTypeEnum = pgEnum('channel_settlement_type', ['PREPAY', 'MONTHLY']);

// 佣金触发模式枚举
export const commissionTriggerModeEnum = pgEnum('commission_trigger_mode', [
  'ORDER_CREATED', // 订单创建时
  'ORDER_COMPLETED', // 订单完成时
  'PAYMENT_COMPLETED', // 收款完成时（默认）
]);

// Measurement Enums
export const measureTaskStatusEnum = pgEnum('measure_task_status', [
  'PENDING_APPROVAL',
  'PENDING',
  'DISPATCHING',
  'PENDING_VISIT',
  'PENDING_CONFIRM',
  'COMPLETED',
  'CANCELLED',
]);

export const feeCheckStatusEnum = pgEnum('fee_check_status', [
  'NONE', // No fee required (e.g. exempted or policy)
  'PENDING', // Fee needed but not paid
  'PAID', // Fee paid
  'WAIVED', // Fee waived by manager
  'REFUNDED',
]);

export const measureSheetStatusEnum = pgEnum('measure_sheet_status', [
  'DRAFT',
  'CONFIRMED',
  'ARCHIVED',
]);

export const windowTypeEnum = pgEnum('window_type', ['STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC']);

export const installTypeEnum = pgEnum('install_type', ['TOP', 'SIDE']);

export const wallMaterialEnum = pgEnum('wall_material', ['CONCRETE', 'WOOD', 'GYPSUM']);

export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'WECHAT', 'ALIPAY', 'BANK']);

export const paymentScheduleStatusEnum = pgEnum('payment_schedule_status', ['PENDING', 'PAID']);

// After Sales Enums
export const afterSalesStatusEnum = pgEnum('after_sales_status', [
  'PENDING',
  'INVESTIGATING',
  'PROCESSING',
  'PENDING_VISIT',
  'PENDING_CALLBACK',
  'PENDING_VERIFY',
  'CLOSED',
  'REJECTED',
]);

export const liablePartyTypeEnum = pgEnum('liable_party_type', [
  'COMPANY',
  'FACTORY',
  'INSTALLER',
  'MEASURER',
  'LOGISTICS',
  'CUSTOMER',
]);

export const liabilityStatusEnum = pgEnum('liability_status', [
  'DRAFT',
  'PENDING_CONFIRM',
  'CONFIRMED',
  'DISPUTED',
  'ARBITRATED',
]);

export const liabilityReasonCategoryEnum = pgEnum('liability_reason_category', [
  'PRODUCTION_QUALITY',
  'CONSTRUCTION_ERROR',
  'DATA_ERROR',
  'SALES_ERROR',
  'LOGISTICS_ISSUE',
  'CUSTOMER_REASON',
]);

// [NEW] Enums from Schema RFC
export const decorationProgressEnum = pgEnum('decoration_progress', [
  'WATER_ELECTRIC',
  'MUD_WOOD',
  'INSTALLATION',
  'PAINTING',
  'COMPLETED',
]);

export const orderSettlementTypeEnum = pgEnum('order_settlement_type', [
  'PREPAID',
  'CREDIT',
  'CASH',
]);

export const poTypeEnum = pgEnum('po_type', ['FINISHED', 'FABRIC', 'STOCK']);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'IN_APP',
  'EMAIL',
  'SMS',
  'WECHAT', // Official Account
  'WECHAT_MINI', // Mini Program
  'LARK',
  'SYSTEM',
]);

export const notificationTypeEnum = pgEnum('notification_type_enum', [
  'SYSTEM',
  'ORDER_STATUS',
  'APPROVAL',
  'ALERT',
  'MENTION',
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
]);

export const poFinishedStatusEnum = pgEnum('po_finished_status', [
  'DRAFT',
  'IN_PRODUCTION',
  'READY',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const poFabricStatusEnum = pgEnum('po_fabric_status', [
  'DRAFT',
  'IN_PRODUCTION',
  'DELIVERED',
  'STOCKED',
  'CANCELLED',
]);

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PARTIAL', 'PAID']);

export const workOrderStatusEnum = pgEnum('work_order_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
]);

export const measureTypeEnum = pgEnum('measure_type', ['QUOTE_BASED', 'BLIND', 'SALES_SELF']);

// Installation Enums
export const installTaskSourceTypeEnum = pgEnum('install_task_source_type', [
  'ORDER',
  'AFTER_SALES',
  'REWORK',
]);

export const installTaskCategoryEnum = pgEnum('install_task_category', [
  'CURTAIN',
  'WALLPAPER',
  'WALLCLOTH',
  'OTHER',
]);

export const installTaskStatusEnum = pgEnum('install_task_status', [
  'PENDING_DISPATCH',
  'DISPATCHING',
  'PENDING_ACCEPT',
  'PENDING_VISIT',
  'IN_PROGRESS',
  'PENDING_CONFIRM',
  'COMPLETED',
  'CANCELLED',
]);

export const installItemIssueCategoryEnum = pgEnum('install_item_issue_category', [
  'NONE',
  'MISSING',
  'DAMAGED',
  'WRONG_SIZE',
]);

export const installPhotoTypeEnum = pgEnum('install_photo_type', ['BEFORE', 'AFTER', 'DETAIL']);

// Approval Enums
export const approverRoleEnum = pgEnum('approver_role', [
  'STORE_MANAGER',
  'ADMIN', // Boss/Admin
  'FINANCE',
  'PURCHASING',
  'DISPATCHER',
]);

export const approvalNodeModeEnum = pgEnum('approval_node_mode', ['ANY', 'ALL', 'MAJORITY']);
export const approvalTimeoutActionEnum = pgEnum('approval_timeout_action', [
  'REMIND',
  'AUTO_PASS',
  'AUTO_REJECT',
]);
export const delegationTypeEnum = pgEnum('delegation_type', ['GLOBAL', 'FLOW']);

export const changeRequestTypeEnum = pgEnum('change_request_type', [
  'FIELD_CHANGE', // 现场变化
  'CUSTOMER_CHANGE', // 客户需求变化
  'STOCK_OUT', // 缺货
  'OTHER',
]);

export const changeRequestStatusEnum = pgEnum('change_request_status', [
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

// [NEW] 订单项状态枚举
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'PENDING', // 待处理
  'PROCESSING', // 处理中
  'PO_CONFIRMED', // 采购确认
  'PRODUCED', // 已生产
  'SHIPPED', // 已发货
  'DELIVERED', // 已送达
  'INSTALLED', // 已安装
  'COMPLETED', // 已完成
  'CANCELLED', // 已取消
]);

// [NEW] 采购单状态枚举
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'DRAFT', // 草稿
  'PENDING', // 待确认
  'CONFIRMED', // 已确认
  'IN_PRODUCTION', // 生产中
  'READY', // 待发货
  'SHIPPED', // 已发货
  'DELIVERED', // 已送达
  'COMPLETED', // 已完成
  'CANCELLED', // 已取消
]);

// [NEW] 渠道状态枚举
export const channelStatusEnum = pgEnum('channel_status', [
  'ACTIVE', // 活跃
  'SUSPENDED', // 暂停
  'TERMINATED', // 终止
]);

// [NEW] AR 对账单状态枚举
export const arStatementStatusEnum = pgEnum('ar_statement_status', [
  'PENDING_RECON', // 待对账
  'RECONCILED', // 已对账
  'INVOICED', // 已开票
  'PARTIAL', // 部分收款
  'PAID', // 已收款
  'PENDING_DELIVER', // 待发货
  'COMPLETED', // 已完成
  'BAD_DEBT', // 坏账
]);

// [NEW] 佣金状态枚举
export const commissionStatusEnum = pgEnum('commission_status', [
  'PENDING', // 待计算
  'CALCULATED', // 已计算
  'PAID', // 已支付
]);

// [NEW] 付款单/收款单状态枚举
export const billStatusEnum = pgEnum('bill_status', [
  'DRAFT', // 草稿
  'PENDING', // 待审批
  'APPROVED', // 已审批
  'PAID', // 已支付
  'REJECTED', // 已拒绝
  'CANCELLED', // 已取消
]);

// [NEW] 工单项状态枚举
export const workOrderItemStatusEnum = pgEnum('work_order_item_status', [
  'PENDING', // 待处理
  'PROCESSING', // 处理中
  'COMPLETED', // 已完成
  'CANCELLED', // 已取消
]);

// [NEW] 供应商类型枚举
export const supplierTypeEnum = pgEnum('supplier_type', [
  'SUPPLIER', // 供应商（面料、配件供应）
  'PROCESSOR', // 加工厂（窗帘加工）
  'BOTH', // 同时具备供应和加工能力
]);

// [NEW] Labor Pricing Enums
export const laborRateEntityTypeEnum = pgEnum('labor_rate_entity_type', ['TENANT', 'WORKER']);

export const laborCategoryEnum = pgEnum('labor_category', [
  'CURTAIN', // 窗帘安装
  'WALLPAPER', // 墙纸安装
  'WALLCLOTH', // 墙布安装
  'WALLPANEL', // 墙咔安装
  'MEASURE_LEAD', // 线索测量（销售/简单测量）
  'MEASURE_PRECISE', // 精准测量（技师上门）
  'OTHER',
]);

export const laborUnitTypeEnum = pgEnum('labor_unit_type', [
  'WINDOW', // 按窗户数
  'SQUARE_METER', // 按平米
  'FIXED', // 固定金额 (e.g. 起步费 component, though base_fee is separate column) - actually usually just WINDOW/SQUARE_METER for unit_price.
  // Let's stick to implementation plan: WINDOW, SQUARE_METER.
  // Maybe 'METER' for tracks? Plan says WINDOW/SQUARE_METER.
]);

// [NEW] 师傅技能类型枚举
export const workerSkillTypeEnum = pgEnum('worker_skill_type', [
  'MEASURE_CURTAIN', // 测量窗帘
  'INSTALL_CURTAIN', // 安装窗帘
  'MEASURE_WALLCLOTH', // 测量墙布
  'INSTALL_WALLCLOTH', // 安装墙布
  'MEASURE_WALLPANEL', // 测量墙咔
  'INSTALL_WALLPANEL', // 安装墙咔
]);
