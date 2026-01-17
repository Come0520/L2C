/**
 * 统一业务类型定义
 * 用于前端组件和页面，确保类型安全
 */

// ========== 基础类型 ==========

/**
 * 客户基础信息（不含地址关联）
 */
export interface CustomerBase {
    id: string;
    tenantId: string;
    customerNo: string;
    name: string;
    phone: string;
    phoneSecondary?: string | null;
    wechat?: string | null;
    level?: string | null;
    lifecycleStage?: string;
    pipelineStatus?: string;
    notes?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

/**
 * 客户地址
 */
export interface CustomerAddress {
    id: string;
    customerId: string;
    label?: string | null;
    address: string;
    isDefault?: boolean | null;
    district?: string | null;
    city?: string | null;
    province?: string | null;
}

/**
 * 工人/师傅基础信息
 */
export interface WorkerBase {
    id: string;
    name: string | null;
    phone?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
}

// ========== 测量任务相关类型 ==========

/**
 * 测量单明细项
 */
export interface MeasureItem {
    id: string;
    sheetId: string;
    roomName?: string | null;
    windowType?: string | null;
    width?: string | null;
    height?: string | null;
    remark?: string | null;
}

/**
 * 测量单
 */
export interface MeasureSheet {
    id: string;
    taskId: string;
    round?: number | null;
    variant?: string | null;
    sketchMap?: string | null;
    items?: MeasureItem[];
    createdAt?: Date | null;
}

/**
 * 测量任务完整类型（包含关联）
 * 对应 getMeasureTaskById 返回的数据结构
 */
export interface MeasureTaskWithRelations {
    id: string;
    tenantId: string;
    measureNo: string;
    status: string | null;
    type?: string | null;
    customerId: string;
    leadId?: string | null;
    remark?: string | null;
    scheduledAt?: Date | null;
    checkInAt?: Date | null;
    checkOutAt?: Date | null;

    // 关联数据 - 使用正确的关联名称
    customer: CustomerBase | null;
    assignedWorker: WorkerBase | null;  // 测量师傅
    lead?: { id: string; name: string } | null;
    sheets?: MeasureSheet[];

    createdAt?: Date | null;
    updatedAt?: Date | null;
    completedAt?: Date | null;
}

// ========== 安装任务相关类型 ==========

/**
 * 安装任务完整类型（包含关联）
 * 对应 getInstallTaskById 返回的数据结构
 */
export interface InstallTaskWithRelations {
    id: string;
    tenantId: string;
    taskNo: string;
    status: string | null;
    category?: string | null;
    sourceType?: string | null;
    orderId?: string | null;
    customerId: string;
    remark?: string | null;

    // 时间相关
    scheduledDate?: Date | string | null;
    scheduledTimeSlot?: string | null;
    actualStartAt?: Date | null;
    actualEndAt?: Date | null;
    checkInAt?: Date | null;

    // 费用相关
    laborFee?: string | null;
    actualLaborFee?: string | null;

    // 关联数据 - 使用正确的关联名称
    customer: CustomerBase | null;
    installer: WorkerBase | null;  // 安装师傅（不是 worker）
    sales?: WorkerBase | null;
    dispatcher?: WorkerBase | null;
    order?: {
        id: string;
        orderNo: string;
        quote?: {
            id: string;
            items?: unknown[];
        } | null;
    } | null;
    items?: unknown[];
    photos?: unknown[];

    createdAt?: Date | null;
    updatedAt?: Date | null;
    completedAt?: Date | null;
}

// ========== 工具函数类型 ==========

/**
 * 获取客户的默认地址
 * 由于地址在 customerAddresses 关联表中，需要单独查询
 */
export function getCustomerDefaultAddress(customer: CustomerBase & { addresses?: CustomerAddress[] }): string {
    if (!customer.addresses || customer.addresses.length === 0) {
        return '';
    }
    const defaultAddr = customer.addresses.find(a => a.isDefault);
    return defaultAddr?.address || customer.addresses[0]?.address || '';
}

/**
 * 格式化日期显示
 */
export function formatDateDisplay(date: Date | string | null | undefined): string {
    if (!date) return '未设置';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN');
}

/**
 * 格式化日期时间显示
 */
export function formatDateTimeDisplay(date: Date | string | null | undefined): string {
    if (!date) return '未设置';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-CN');
}
