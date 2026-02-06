import { NextResponse } from 'next/server';

/**
 * 小程序配置 API
 * 
 * GET /api/miniprogram/config
 * 返回：模板消息ID、房间类型配置、枚举选项等
 * 
 * 解决硬编码问题：所有选项列表从此 API 统一获取
 */
export async function GET() {
  // ========== 房间类型配置 ==========
  const roomTypes = [
    { key: 'LIVING_ROOM', label: '客厅' },
    { key: 'MASTER_BEDROOM', label: '主卧' },
    { key: 'SECOND_BEDROOM', label: '次卧' },
    { key: 'STUDY', label: '书房' },
    { key: 'BALCONY', label: '阳台' },
    { key: 'KIDS_ROOM', label: '儿童房' },
    { key: 'DINING_ROOM', label: '餐厅' },
    { key: 'GUEST_ROOM', label: '客卧' },
  ];
  const defaultRooms = ['客厅', '主卧'];

  // ========== 角色选项（对应 userRoleEnum） ==========
  const roles = [
    { value: 'ADMIN', label: '管理员' },
    { value: 'SALES', label: '销售' },
    { value: 'MANAGER', label: '经理' },
    { value: 'WORKER', label: '师傅' },
    { value: 'FINANCE', label: '财务' },
    { value: 'SUPPLY', label: '供应链' },
  ];

  // ========== 意向等级选项（对应 customerLevelEnum） ==========
  const intentionLevels = [
    { value: 'A', label: 'A - 高意向' },
    { value: 'B', label: 'B - 中意向' },
    { value: 'C', label: 'C - 低意向' },
    { value: 'D', label: 'D - 无意向' },
  ];

  // ========== 线索状态选项（对应 leadStatusEnum） ==========
  const leadStatuses = [
    { value: 'PENDING_ASSIGNMENT', label: '待分配', color: '#ef4444' },
    { value: 'PENDING_FOLLOWUP', label: '待跟进', color: '#f59e0b' },
    { value: 'FOLLOWING_UP', label: '跟进中', color: '#3b82f6' },
    { value: 'WON', label: '已成交', color: '#10b981' },
    { value: 'INVALID', label: '无效', color: '#6b7280' },
    { value: 'VOID', label: '已作废', color: '#9ca3af' },
  ];

  // ========== 跟进活动类型（对应 leadActivityTypeEnum） ==========
  const activityTypes = [
    { value: 'PHONE_CALL', label: '电话沟通' },
    { value: 'WECHAT_CHAT', label: '微信沟通' },
    { value: 'STORE_VISIT', label: '到店拜访' },
    { value: 'HOME_VISIT', label: '上门拜访' },
    { value: 'QUOTE_SENT', label: '发送报价' },
    { value: 'SYSTEM', label: '系统记录' },
  ];

  // ========== 报价单状态（对应 quoteStatusEnum） ==========
  const quoteStatuses = [
    { value: 'DRAFT', label: '草稿', color: '#6b7280' },
    { value: 'PENDING_APPROVAL', label: '待审批', color: '#f59e0b' },
    { value: 'APPROVED', label: '已批准', color: '#3b82f6' },
    { value: 'PENDING_CUSTOMER', label: '待确认', color: '#8b5cf6' },
    { value: 'ACCEPTED', label: '已接受', color: '#10b981' },
    { value: 'REJECTED', label: '已拒绝', color: '#ef4444' },
    { value: 'LOCKED', label: '已锁定', color: '#6366f1' },
    { value: 'ORDERED', label: '已转单', color: '#059669' },
    { value: 'EXPIRED', label: '已过期', color: '#9ca3af' },
  ];

  // ========== 订单状态（对应 orderStatusEnum） ==========
  const orderStatuses = [
    { value: 'DRAFT', label: '草稿', color: '#6b7280' },
    { value: 'PENDING_MEASURE', label: '待测量', color: '#f59e0b' },
    { value: 'MEASURED', label: '已测量', color: '#3b82f6' },
    { value: 'QUOTED', label: '已报价', color: '#8b5cf6' },
    { value: 'SIGNED', label: '已签约', color: '#10b981' },
    { value: 'PAID', label: '已付款', color: '#059669' },
    { value: 'PENDING_PO', label: '待下单', color: '#f97316' },
    { value: 'PENDING_PRODUCTION', label: '待生产', color: '#eab308' },
    { value: 'IN_PRODUCTION', label: '生产中', color: '#0ea5e9' },
    { value: 'HALTED', label: '已暂停', color: '#ef4444' },
    { value: 'PENDING_DELIVERY', label: '待配送', color: '#14b8a6' },
    { value: 'PENDING_INSTALL', label: '待安装', color: '#6366f1' },
    { value: 'INSTALLATION_COMPLETED', label: '安装完成', color: '#22c55e' },
    { value: 'PENDING_CONFIRMATION', label: '待验收', color: '#a855f7' },
    { value: 'INSTALLATION_REJECTED', label: '验收驳回', color: '#dc2626' },
    { value: 'COMPLETED', label: '已完成', color: '#16a34a' },
    { value: 'CANCELLED', label: '已取消', color: '#9ca3af' },
  ];

  // ========== 任务状态（测量/安装任务） ==========
  const taskStatuses = [
    { value: 'PENDING_DISPATCH', label: '待派单', color: '#6b7280' },
    { value: 'DISPATCHING', label: '派单中', color: '#f59e0b' },
    { value: 'PENDING_VISIT', label: '待上门', color: '#3b82f6' },
    { value: 'PENDING_CONFIRM', label: '待确认', color: '#8b5cf6' },
    { value: 'COMPLETED', label: '已完成', color: '#10b981' },
    { value: 'CANCELLED', label: '已取消', color: '#9ca3af' },
  ];

  // ========== 售后服务类型 ==========
  const serviceTypes = [
    { value: 'REPAIR', label: '维修' },
    { value: 'RETURN', label: '退货' },
    { value: 'EXCHANGE', label: '换货' },
    { value: 'COMPLAINT', label: '投诉' },
    { value: 'CONSULTATION', label: '咨询' },
  ];

  // ========== 售后工单状态（对应 afterSalesStatusEnum） ==========
  const afterSalesStatuses = [
    { value: 'PENDING', label: '待处理', color: '#f59e0b' },
    { value: 'INVESTIGATING', label: '调查中', color: '#3b82f6' },
    { value: 'PROCESSING', label: '处理中', color: '#8b5cf6' },
    { value: 'PENDING_VISIT', label: '待上门', color: '#6366f1' },
    { value: 'PENDING_CALLBACK', label: '待回访', color: '#14b8a6' },
    { value: 'PENDING_VERIFY', label: '待验收', color: '#a855f7' },
    { value: 'CLOSED', label: '已关闭', color: '#10b981' },
    { value: 'REJECTED', label: '已拒绝', color: '#ef4444' },
  ];

  // ========== 邀请状态 ==========
  const inviteStatuses = [
    { value: 'PENDING', label: '待接受' },
    { value: 'JOINED', label: '已加入' },
    { value: 'EXPIRED', label: '已过期' },
  ];

  // ========== 支付方式（对应 paymentMethodEnum） ==========
  const paymentMethods = [
    { value: 'CASH', label: '现金' },
    { value: 'WECHAT', label: '微信支付' },
    { value: 'ALIPAY', label: '支付宝' },
    { value: 'BANK', label: '银行转账' },
  ];

  // ========== 装修进度（对应 decorationProgressEnum） ==========
  const decorationProgress = [
    { value: 'WATER_ELECTRIC', label: '水电阶段' },
    { value: 'MUD_WOOD', label: '泥木阶段' },
    { value: 'INSTALLATION', label: '安装阶段' },
    { value: 'PAINTING', label: '油漆阶段' },
    { value: 'COMPLETED', label: '已完工' },
  ];

  return NextResponse.json({
    success: true,
    data: {
      // 微信模板消息
      templates: {
        tenantApproved: process.env.WECHAT_TEMPLATE_TENANT_APPROVED || '',
        tenantRejected: process.env.WECHAT_TEMPLATE_TENANT_REJECTED || '',
        orderStatus: process.env.WECHAT_TEMPLATE_ORDER_STATUS || '',
        taskAssign: process.env.WECHAT_TEMPLATE_TASK_ASSIGN || '',
      },
      // 房间类型配置
      roomTypes,
      defaultRooms,
      // ========== 枚举选项（解决硬编码） ==========
      enums: {
        roles,
        intentionLevels,
        leadStatuses,
        activityTypes,
        quoteStatuses,
        orderStatuses,
        taskStatuses,
        serviceTypes,
        afterSalesStatuses,
        inviteStatuses,
        paymentMethods,
        decorationProgress,
      },
    },
  });
}
