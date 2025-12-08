// 订单相关类型定义

// 订单状态枚举（从order-status常量导入使用）
import { OrderStatus } from '@/constants/order-status'

// 商品类别枚举
export type ProductCategory = 'curtain' | 'wallcovering' | 'background-wall' | 'window-cushion' | 'standard-product'

// 商品类别中文映射
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
    curtain: '窗帘',
    wallcovering: '墙布',
    'background-wall': '背景墙',
    'window-cushion': '飘窗垫',
    'standard-product': '标品'
}

// ========== 套餐相关类型 ==========

// 套餐商品类型


// 套餐商品类型中文映射
export const PACKAGE_ITEM_TYPE_LABELS: Record<PackageItemType, string> = {
    cloth: '布料',
    gauze: '纱料',
    track: '轨道'
}

// 套餐项定义
export interface PackageItem {
    type: PackageItemType      // 商品类型
    quota: number              // 额度（米数）
    basePrice: number          // 套餐基础单价
}

// 套餐定义
export interface PackageDefinition {
    id: string
    name: string               // 套餐名称，如 "K3套餐"
    price: number              // 套餐总价，如 3900
    items: PackageItem[]       // 套餐包含的项目
    description?: string       // 套餐描述
}

// 套餐使用情况
export interface PackageUsage {
    cloth: number              // 已用布料米数
    gauze: number              // 已用纱料米数
    track: number              // 已用轨道米数
}

// ========== 预定义套餐 ==========

export const K3_PACKAGE: PackageDefinition = {
    id: 'k3',
    name: 'K3套餐',
    price: 3900,
    description: '包含24米布料、24米纱料、24米轨道',
    items: [
        { type: 'cloth', quota: 24, basePrice: 180 },
        { type: 'gauze', quota: 24, basePrice: 100 },
        { type: 'track', quota: 24, basePrice: 50 }
    ]
}

export const AVAILABLE_PACKAGES: PackageDefinition[] = [
    K3_PACKAGE
    // 可以添加更多套餐
]

// ========== 商品项类型 ==========

// 导入自动生成的 API 类型
import { components } from './api-schema'

// 从 API Schema 提取并重命名类型
export type CurtainItem = Required<Omit<components['schemas']['CurtainItem'], 'packageType'>> & {
    packageType?: PackageItemType
}
export type OrderFormData = Omit<Required<components['schemas']['OrderFormData']>, 'spacePackages' | 'subtotals' | 'items' | 'packageUsage'> & {
    spacePackages: Record<string, string>
    subtotals: Record<ProductCategory, number>
    items?: CurtainItem[]
    packageUsage: PackageUsage
}

// 保留辅助类型别名
export type WallcoveringItem = CurtainItem
export type BackgroundWallItem = CurtainItem
export type WindowCushionItem = CurtainItem
export type StandardProductItem = CurtainItem

// 套餐商品类型 (手动保持与 OpenAPI Enum 一致，或从 generated type 提取)
export type PackageItemType = NonNullable<components['schemas']['CurtainItem']['packageType']>

// 空间选项
export const SPACE_OPTIONS = [
    { value: 'living-room', label: '客厅' },
    { value: 'bedroom', label: '卧室' },
    { value: 'study', label: '书房' },
    { value: 'dining-room', label: '餐厅' },
    { value: 'kitchen', label: '厨房' },
    { value: 'balcony', label: '阳台' },
    { value: 'bathroom', label: '卫生间' },
    { value: 'hallway', label: '走廊' },
    { value: 'other', label: '其他' }
]

// 创建空的商品项（更新后）
export const createEmptyItem = (category: ProductCategory, space: string = ''): CurtainItem => ({
    id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    space: space, // 支持初始化指定空间
    product: '',
    imageUrl: '', // [NEW]
    packageTag: undefined, // [NEW]
    isPackageItem: false,
    unit: '米', // [NEW]
    width: 0,
    height: 0,
    quantity: 1,
    unitPrice: 0,
    usageAmount: 0,
    amount: 0,
    remark: ''
})

// ========== 计算函数 ==========

// 计算商品的实际用量（米数）
export const calculateUsage = (item: CurtainItem): number => {
    // 窗帘用量 = 宽度 × 数量
    return item.width * item.quantity
}

// 计算商品金额（不考虑套餐逻辑）
export const calculateItemAmount = (item: Partial<CurtainItem>): number => {
    const quantity = item.quantity || 0
    const unitPrice = item.unitPrice || 0
    return Math.round(quantity * unitPrice * 100) / 100 // 保留两位小数
}

// 计算类别小计（不包含套餐品）
export const calculateCategorySubtotal = (items: CurtainItem[]): number => {
    return items
        .filter(item => !item.isPackageItem)
        .reduce((sum, item) => sum + (item.amount || 0), 0)
}

// 计算套餐使用量 (针对特定空间的商品列表)
export const calculatePackageUsage = (items: CurtainItem[]): PackageUsage => {
    const usage: PackageUsage = { cloth: 0, gauze: 0, track: 0 }

    items.forEach(item => {
        if (item.isPackageItem && item.packageType) {
            usage[item.packageType] += calculateUsage(item)
        }
    })

    return usage
}

// 计算套餐金额（基础套餐价 + 超出部分）
export const calculatePackageAmount = (
    packageDef: PackageDefinition,
    usage: PackageUsage
): { packageAmount: number; excessAmount: number } => {
    let totalExcess = 0

    // 检查每种类型是否超出额度
    packageDef.items.forEach(item => {
        const used = usage[item.type]
        if (used > item.quota) {
            const excess = used - item.quota
            totalExcess += excess * item.basePrice
        }
    })

    return {
        packageAmount: packageDef.price,
        excessAmount: Math.round(totalExcess * 100) / 100
    }
}

// 计算单个商品的升级补差价
export const calculateUpgradeAmount = (
    item: CurtainItem,
    packageDef: PackageDefinition
): { priceDifference: number; differenceAmount: number } => {
    if (!item.isPackageItem || !item.packageType) {
        return { priceDifference: 0, differenceAmount: 0 }
    }

    const packageItem = packageDef.items.find(p => p.type === item.packageType)
    if (!packageItem) {
        return { priceDifference: 0, differenceAmount: 0 }
    }

    // 单价差价
    const priceDiff = item.unitPrice - packageItem.basePrice

    // 如果客户选择的单价高于套餐单价，需要补差价
    if (priceDiff > 0) {
        const usage = calculateUsage(item)
        return {
            priceDifference: Math.round(priceDiff * 100) / 100,
            differenceAmount: Math.round(priceDiff * usage * 100) / 100
        }
    }

    return { priceDifference: 0, differenceAmount: 0 }
}

// 计算所有套餐品的总升级补差价
export const calculateTotalUpgradeAmount = (
    items: CurtainItem[],
    packageDef: PackageDefinition
): number => {
    return items
        .filter(item => item.isPackageItem)
        .reduce((sum, item) => {
            const { differenceAmount } = calculateUpgradeAmount(item, packageDef)
            return sum + differenceAmount
        }, 0)
}

// 计算总金额（包含所有逻辑）
export const calculateTotalAmount = (formData: OrderFormData): number => {
    let total = 0

    // 1. 套餐金额 (包含基础、超额、升级)
    total += formData.packageAmount
    total += formData.packageExcessAmount
    total += formData.upgradeAmount

    // 2. 非套餐商品金额
    total += formData.subtotals.curtain || 0
    total += formData.subtotals.wallcovering || 0
    total += formData.subtotals['background-wall'] || 0
    total += formData.subtotals['window-cushion'] || 0
    total += formData.subtotals['standard-product'] || 0

    return Math.round(total * 100) / 100
}

// ========== 基础订单类型 ==========

// 基础订单类型（所有订单共有的字段）
export interface BaseOrder {
    id: string
    salesNo: string
    surveyNo: string
    customerName: string
    customerPhone: string
    projectAddress: string
    leadNo: string
    designer: string
    sales: string
    amount: number
    draftAmount: number
    version: string
    status: OrderStatus
    createDate: string
    statusUpdatedAt: string
}

// 待测量订单类型
export interface PendingMeasurementOrder extends BaseOrder {
    surveyFiles?: UploadedFile[]
    waitingTime: string
    isOverdue: boolean
}

// 测量中-待分配订单类型
export interface MeasuringPendingAssignmentOrder extends BaseOrder {
    rooms: MeasurementRoom[]
    photos: string[]
    completedAt: string
    qualityScore?: {
        integrity: number
        accuracy: number
        photos: number
        standard: number
        total: number
        level: string
    }
}

// 测量中-分配中订单类型
export interface MeasuringAssignedOrder extends BaseOrder {
    assignedSurveyor: string
    assignedAt: string
    assignmentDuration: number
    surveyorStatus: 'pending_response' | 'viewed' | 'accepted' | 'rejected'
    surveyorResponseTime?: number
    rejectReason?: string
    lastCommunication?: string
    lastCommunicationTime?: string
    creator: string
}

// 测量中-待上门订单类型
export interface MeasuringPendingVisitOrder extends BaseOrder {
    surveyorName: string
    scheduledAt: string
    remainingTime: number
    measurementData?: {
        remark?: string
    }
}

// 测量中-待确认订单类型
export interface MeasuringPendingConfirmationOrder extends BaseOrder {
    surveyor: string
    surveyorPhone: string
    apptTime: string
    completedAt: string
    remainingTime: number
    data: {
        rooms: MeasurementRoom[]
        photos: string[]
        completedAt: string
        qualityScore?: {
            integrity: number
            accuracy: number
            photos: number
            standard: number
            total: number
            level: string
        }
    }
    history: {
        date: string
        surveyor: string
        status: string
        remark?: string
    }[]
}

// 测量房间类型
export interface MeasurementRoom {
    name: string
    length: number
    width: number
    height: number
    windows: string
    doors: string
    features: string[]
    remark: string
}

// 上传文件类型
export interface UploadedFile {
    id: string
    name: string
    url: string
    type?: string
    size?: number
    uploadedAt?: string
    uploadedBy?: string
}

// 订单API响应类型
export interface OrderResponse<T = BaseOrder> {
    code: number
    message: string
    data: {
        orders: T[]
        total: number
        page: number
        pageSize: number
    }
}

// 批量操作类型
export type BatchAction = 'urge' | 'batchUrge' | 'reassign' | 'cancel'

// 批量操作参数类型
export interface BatchActionParams {
    action: BatchAction
    orderIds: string[]
    reason?: string
}
