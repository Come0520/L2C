import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'SALES', 'MANAGER', 'WORKER', 'FINANCE', 'SUPPLY']);

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
    'CURTAIN_ACCESSORY'
]);

export const orderStatusEnum = pgEnum('order_status', [
    'DRAFT',
    'PENDING_MEASURE',
    'MEASURED',
    'QUOTED',
    'SIGNED',
    'PAID',
    'PENDING_PRODUCTION',
    'IN_PRODUCTION',
    'PENDING_DELIVERY',
    'PENDING_INSTALL',
    'COMPLETED',
    'CANCELLED'
]);

export const quoteStatusEnum = pgEnum('quote_status', [
    'DRAFT',
    'SUBMITTED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
]);

export const quotePlanTypeEnum = pgEnum('quote_plan_type', ['ECONOMIC', 'COMFORT', 'LUXURY']);

export const customerTypeEnum = pgEnum('customer_type', ['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER']);
export const customerLevelEnum = pgEnum('customer_level', ['A', 'B', 'C', 'D']);
export const settlementTypeEnum = pgEnum('settlement_type', ['CASH', 'TRANSFER']);
export const roomTypeEnum = pgEnum('room_type', ['LIVING_ROOM', 'BEDROOM', 'DINING_ROOM', 'STUDY', 'BALCONY', 'BATHROOM', 'KITCHEN', 'OTHER']);
export const headerProcessTypeEnum = pgEnum('header_process_type', ['HOOK', 'PUNCH', 'FIXED_PLEAT']);

export const customerLifecycleStageEnum = pgEnum('customer_lifecycle_stage', ['LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST']);

export const customerPipelineStatusEnum = pgEnum('customer_pipeline_status', [
    'UNASSIGNED',
    'PENDING_FOLLOWUP',
    'PENDING_MEASUREMENT',
    'PENDING_QUOTE',
    'QUOTE_SENT',
    'IN_PRODUCTION',
    'PENDING_DELIVERY',
    'PENDING_INSTALLATION',
    'COMPLETED'
]);


export const leadStatusEnum = pgEnum('lead_status', [
    'PENDING_ASSIGNMENT',
    'PENDING_FOLLOWUP',
    'FOLLOWING_UP',
    'INVALID',
    'WON',
    'VOID' // Keeping VOID for backward compatibility if needed, or remove if strictly following new reqs. Req said INVALID. But code had VOID. I'll add INVALID and keep VOID if code uses it, or map. Let's stick to Requirements: INVALID. But existing code uses VOID. I will add both or migrate. Code `voidLead` uses VOID. I'll add both for now to be safe.
]);


export const intentionLevelEnum = pgEnum('intention_level', ['HIGH', 'MEDIUM', 'LOW']);

export const leadActivityTypeEnum = pgEnum('lead_activity_type', [
    'PHONE_CALL',
    'WECHAT_CHAT',
    'STORE_VISIT',
    'HOME_VISIT',
    'QUOTE_SENT',
    'SYSTEM'
]);


export const channelTypeEnum = pgEnum('channel_type', ['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY']);
export const channelLevelEnum = pgEnum('channel_level', ['S', 'A', 'B', 'C']);
export const commissionTypeEnum = pgEnum('commission_type', ['FIXED', 'TIERED']);
export const cooperationModeEnum = pgEnum('cooperation_mode', ['BASE_PRICE', 'COMMISSION']);
export const channelSettlementTypeEnum = pgEnum('channel_settlement_type', ['PREPAY', 'MONTHLY']);

// Measurement Enums
export const measureTaskStatusEnum = pgEnum('measure_task_status', [
    'PENDING',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
]);

export const feeCheckStatusEnum = pgEnum('fee_check_status', [
    'NONE', // No fee required (e.g. exempted or policy)
    'PENDING', // Fee needed but not paid
    'PAID', // Fee paid
    'WAIVED', // Fee waived by manager
    'REFUNDED'
]);

export const measureSheetStatusEnum = pgEnum('measure_sheet_status', [
    'DRAFT',
    'CONFIRMED',
    'ARCHIVED'
]);

export const windowTypeEnum = pgEnum('window_type', [
    'STRAIGHT',
    'L_SHAPE',
    'U_SHAPE',
    'ARC'
]);

export const installTypeEnum = pgEnum('install_type', [
    'TOP',
    'SIDE'
]);

export const wallMaterialEnum = pgEnum('wall_material', [
    'CONCRETE',
    'WOOD',
    'GYPSUM'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
    'CASH',
    'WECHAT',
    'ALIPAY',
    'BANK'
]);

export const paymentScheduleStatusEnum = pgEnum('payment_schedule_status', [
    'PENDING',
    'PAID'
]);

// After Sales Enums
export const afterSalesStatusEnum = pgEnum('after_sales_status', [
    'PENDING',
    'INVESTIGATING',
    'PROCESSING',
    'PENDING_VISIT',
    'PENDING_CALLBACK',
    'PENDING_VERIFY',
    'CLOSED',
    'REJECTED'
]);

export const liablePartyTypeEnum = pgEnum('liable_party_type', [
    'COMPANY',
    'FACTORY',
    'INSTALLER',
    'MEASURER',
    'LOGISTICS',
    'CUSTOMER'
]);

export const liabilityStatusEnum = pgEnum('liability_status', [
    'DRAFT',
    'PENDING_CONFIRM',
    'CONFIRMED',
    'DISPUTED',
    'ARBITRATED'
]);

export const liabilityReasonCategoryEnum = pgEnum('liability_reason_category', [
    'PRODUCTION_QUALITY',
    'CONSTRUCTION_ERROR',
    'DATA_ERROR',
    'SALES_ERROR',
    'LOGISTICS_ISSUE',
    'CUSTOMER_REASON'
]);

// [NEW] Enums from Schema RFC
export const decorationProgressEnum = pgEnum('decoration_progress', [
    'WATER_ELECTRIC',
    'MUD_WOOD',
    'INSTALLATION',
    'PAINTING',
    'COMPLETED'
]);

export const orderSettlementTypeEnum = pgEnum('order_settlement_type', [
    'PREPAID',
    'CREDIT',
    'CASH'
]);

export const poTypeEnum = pgEnum('po_type', [
    'FINISHED',
    'FABRIC',
    'STOCK'
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
    'IN_APP',
    'EMAIL',
    'SMS',
    'WECHAT',
    'WECHAT',
    'LARK'
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
    'ERROR'
]);

export const poFinishedStatusEnum = pgEnum('po_finished_status', [
    'DRAFT',
    'IN_PRODUCTION',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
]);

export const poFabricStatusEnum = pgEnum('po_fabric_status', [
    'DRAFT',
    'IN_PRODUCTION',
    'DELIVERED',
    'STOCKED',
    'CANCELLED'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
    'PENDING',
    'PARTIAL',
    'PAID'
]);

export const workOrderStatusEnum = pgEnum('work_order_status', [
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
]);


export const measureTypeEnum = pgEnum('measure_type', [
    'QUOTE_BASED',
    'BLIND',
    'SALES_SELF'
]);

// Installation Enums
export const installTaskSourceTypeEnum = pgEnum('install_task_source_type', [
    'ORDER',
    'AFTER_SALES',
    'REWORK'
]);

export const installTaskCategoryEnum = pgEnum('install_task_category', [
    'CURTAIN',
    'WALLCLOTH',
    'OTHER'
]);

export const installTaskStatusEnum = pgEnum('install_task_status', [
    'PENDING_DISPATCH',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
]);

export const installItemIssueCategoryEnum = pgEnum('install_item_issue_category', [
    'NONE',
    'MISSING',
    'DAMAGED',
    'WRONG_SIZE'
]);

export const installPhotoTypeEnum = pgEnum('install_photo_type', [
    'BEFORE',
    'AFTER',
    'DETAIL'
]);

