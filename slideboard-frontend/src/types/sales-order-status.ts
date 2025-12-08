/**
 * 销售单25状态流转系统
 * 
 * 根据核心需求文档定义完整的29个状态 (26个核心状态 + 3个异常状态)
 * 分为5个阶段：线索阶段(5) + 订单/测量阶段(12) + 安装阶段(5) + 财务阶段(4) + 异常状态(3)
 */

// ==================== 状态枚举定义 ====================

export enum SalesOrderStatus {
    // ===== 线索阶段 (5个状态) =====
    PENDING_ASSIGNMENT = 'pending_assignment',           // 1. 待分配
    PENDING_FOLLOW_UP = 'pending_tracking',              // 2. 待跟踪
    FOLLOWING_UP = 'tracking',                           // 3. 跟踪中
    DRAFT_SIGNED = 'draft_signed',                       // 4. 草签
    EXPIRED = 'expired',                                 // 5. 已失效

    // ===== 测量阶段 (6个状态) =====
    PENDING_MEASUREMENT = 'pending_measurement',         // 6. 待测量
    MEASURING_PENDING_ASSIGNMENT = 'measuring_pending_assignment',  // 7. 测量中-待分配
    MEASURING_ASSIGNING = 'measuring_assigning',         // 8. 测量中-分配中
    MEASURING_PENDING_VISIT = 'measuring_pending_visit', // 9. 测量中-待上门
    MEASURING_PENDING_CONFIRMATION = 'measuring_pending_confirmation', // 10. 测量中-待确认
    PLAN_PENDING_CONFIRMATION = 'plan_pending_confirmation', // 11. 方案待确认

    // ===== 订单处理阶段 (6个状态) =====
    PENDING_PUSH = 'pending_push',                       // 12. 待推单
    PENDING_ORDER = 'pending_order',                     // 13. 待下单
    IN_PRODUCTION = 'in_production',                     // 14. 生产中
    STOCK_PREPARED = 'stock_prepared',                   // 15. 备货完成
    PENDING_SHIPMENT = 'pending_shipment',               // 16. 待发货
    SHIPPED = 'shipped',                                 // 17. 已发货

    // ===== 安装阶段 (5个状态) =====
    INSTALLING_PENDING_ASSIGNMENT = 'installing_pending_assignment', // 18. 安装中-待分配
    INSTALLING_ASSIGNING = 'installing_assigning',       // 19. 安装中-分配中
    INSTALLING_PENDING_VISIT = 'installing_pending_visit', // 20. 安装中-待上门
    INSTALLING_PENDING_CONFIRMATION = 'installing_pending_confirmation', // 21. 安装中-待确认
    DELIVERED = 'delivered',                             // 22. 已交付

    // ===== 财务阶段 (4个状态) =====
    PENDING_RECONCILIATION = 'pending_reconciliation',   // 23. 待对账
    PENDING_INVOICE = 'pending_invoice',                 // 24. 待开发票
    PENDING_PAYMENT = 'pending_payment',                 // 25. 待回款
    COMPLETED = 'completed',                             // 26. 已完成

    // ===== 异常状态 (3个状态) =====
    CANCELLED = 'cancelled',                             // 27. 已取消
    SUSPENDED = 'suspended',                             // 28. 暂停
    EXCEPTION = 'exception',                             // 29. 异常
}

// ==================== 状态分类 ====================

export enum StatusCategory {
    LEAD = 'LEAD',           // 线索阶段
    ORDER = 'ORDER',         // 订单阶段
    FINANCE = 'FINANCE',     // 财务阶段
    EXCEPTION = 'EXCEPTION', // 异常状态
}

// ==================== 状态元数据 ====================

export interface StatusMetadata {
    code: SalesOrderStatus;
    name: string;
    category: StatusCategory;
    order: number;
    color: string;
    description: string;
    nextStatuses: SalesOrderStatus[]; // 可流转到的下一状态
    requiredFields?: string[];        // 流转所需字段
    requiredFiles?: string[];         // 流转所需文件
    permissions?: string[];           // 需要的权限
}

export const STATUS_METADATA: Record<SalesOrderStatus, StatusMetadata> = {
    // ===== 线索阶段 =====
    [SalesOrderStatus.PENDING_ASSIGNMENT]: {
        code: SalesOrderStatus.PENDING_ASSIGNMENT,
        name: '待分配',
        category: StatusCategory.LEAD,
        order: 1,
        color: '#94A3B8',
        description: '线索待分配给销售人员',
        nextStatuses: [SalesOrderStatus.PENDING_FOLLOW_UP, SalesOrderStatus.CANCELLED, SalesOrderStatus.EXPIRED],
    },

    [SalesOrderStatus.PENDING_FOLLOW_UP]: {
        code: SalesOrderStatus.PENDING_FOLLOW_UP,
        name: '待跟踪',
        category: StatusCategory.LEAD,
        order: 2,
        color: '#60A5FA',
        description: '已分配，等待销售跟踪',
        nextStatuses: [
            SalesOrderStatus.FOLLOWING_UP,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.EXPIRED,
        ],
    },

    [SalesOrderStatus.FOLLOWING_UP]: {
        code: SalesOrderStatus.FOLLOWING_UP,
        name: '跟踪中',
        category: StatusCategory.LEAD,
        order: 3,
        color: '#3B82F6',
        description: '销售正在跟踪线索',
        nextStatuses: [
            SalesOrderStatus.DRAFT_SIGNED,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.EXPIRED,
        ],
    },

    [SalesOrderStatus.DRAFT_SIGNED]: {
        code: SalesOrderStatus.DRAFT_SIGNED,
        name: '草签',
        category: StatusCategory.LEAD,
        order: 4,
        color: '#8B5CF6',
        description: '完成草签，准备进入订单阶段',
        nextStatuses: [SalesOrderStatus.PENDING_MEASUREMENT, SalesOrderStatus.CANCELLED, SalesOrderStatus.EXPIRED],
    },

    [SalesOrderStatus.EXPIRED]: {
        code: SalesOrderStatus.EXPIRED,
        name: '已失效',
        category: StatusCategory.LEAD,
        order: 5,
        color: '#6B7280',
        description: '线索已过期失效',
        nextStatuses: [],
    },

    // ===== 测量阶段 =====
    [SalesOrderStatus.PENDING_MEASUREMENT]: {
        code: SalesOrderStatus.PENDING_MEASUREMENT,
        name: '待测量',
        category: StatusCategory.ORDER,
        order: 6,
        color: '#10B981',
        description: '等待安排测量',
        nextStatuses: [SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    [SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT]: {
        code: SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT,
        name: '测量中-待分配',
        category: StatusCategory.ORDER,
        order: 7,
        color: '#14B8A6',
        description: '待分配测量师',
        nextStatuses: [SalesOrderStatus.MEASURING_ASSIGNING, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    [SalesOrderStatus.MEASURING_ASSIGNING]: {
        code: SalesOrderStatus.MEASURING_ASSIGNING,
        name: '测量中-分配中',
        category: StatusCategory.ORDER,
        order: 8,
        color: '#06B6D4',
        description: '正在分配测量师',
        nextStatuses: [
            SalesOrderStatus.MEASURING_PENDING_VISIT,
            SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.SUSPENDED,
        ],
    },

    [SalesOrderStatus.MEASURING_PENDING_VISIT]: {
        code: SalesOrderStatus.MEASURING_PENDING_VISIT,
        name: '测量中-待上门',
        category: StatusCategory.ORDER,
        order: 9,
        color: '#0EA5E9',
        description: '测量师待上门测量',
        nextStatuses: [SalesOrderStatus.MEASURING_PENDING_CONFIRMATION, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    [SalesOrderStatus.MEASURING_PENDING_CONFIRMATION]: {
        code: SalesOrderStatus.MEASURING_PENDING_CONFIRMATION,
        name: '测量中-待确认',
        category: StatusCategory.ORDER,
        order: 10,
        color: '#3B82F6',
        description: '测量完成，待销售确认',
        nextStatuses: [
            SalesOrderStatus.PLAN_PENDING_CONFIRMATION,
            SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.SUSPENDED,
        ],
        requiredFiles: ['measurement_report', 'measurement_photos'],
    },

    [SalesOrderStatus.PLAN_PENDING_CONFIRMATION]: {
        code: SalesOrderStatus.PLAN_PENDING_CONFIRMATION,
        name: '方案待确认',
        category: StatusCategory.ORDER,
        order: 11,
        color: '#6366F1',
        description: '方案待客户确认',
        nextStatuses: [
            SalesOrderStatus.PENDING_PUSH,
            SalesOrderStatus.MEASURING_PENDING_CONFIRMATION,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.SUSPENDED,
        ],
    },

    // ===== 订单处理阶段 =====
    [SalesOrderStatus.PENDING_PUSH]: {
        code: SalesOrderStatus.PENDING_PUSH,
        name: '待推单',
        category: StatusCategory.ORDER,
        order: 12,
        color: '#8B5CF6',
        description: '方案确认后，待推单到圣都',
        nextStatuses: [SalesOrderStatus.PENDING_ORDER, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
        requiredFiles: ['plan_confirmation_photos'],
    },

    [SalesOrderStatus.PENDING_ORDER]: {
        code: SalesOrderStatus.PENDING_ORDER,
        name: '待下单',
        category: StatusCategory.ORDER,
        order: 13,
        color: '#A855F7',
        description: '订单客服确认采购需求后，待下单',
        nextStatuses: [SalesOrderStatus.IN_PRODUCTION, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
        requiredFiles: ['push_order_screenshot'],
    },

    [SalesOrderStatus.IN_PRODUCTION]: {
        code: SalesOrderStatus.IN_PRODUCTION,
        name: '生产中',
        category: StatusCategory.ORDER,
        order: 14,
        color: '#EC4899',
        description: '生产单已下，正在生产',
        nextStatuses: [SalesOrderStatus.STOCK_PREPARED, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED, SalesOrderStatus.EXCEPTION],
        requiredFields: ['production_order_nos'],
    },

    [SalesOrderStatus.STOCK_PREPARED]: {
        code: SalesOrderStatus.STOCK_PREPARED,
        name: '备货完成',
        category: StatusCategory.ORDER,
        order: 15,
        color: '#F472B6',
        description: '所有生产单备货完成',
        nextStatuses: [SalesOrderStatus.PENDING_SHIPMENT, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED, SalesOrderStatus.EXCEPTION],
    },

    [SalesOrderStatus.PENDING_SHIPMENT]: {
        code: SalesOrderStatus.PENDING_SHIPMENT,
        name: '待发货',
        category: StatusCategory.ORDER,
        order: 16,
        color: '#00BCD4',
        description: '所有生产单已备货，等待发货',
        nextStatuses: [SalesOrderStatus.SHIPPED, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED, SalesOrderStatus.EXCEPTION],
    },

    [SalesOrderStatus.SHIPPED]: {
        code: SalesOrderStatus.SHIPPED,
        name: '已发货',
        category: StatusCategory.ORDER,
        order: 17,
        color: '#2196F3',
        description: '货物已发出',
        nextStatuses: [SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    // ===== 安装阶段 =====
    [SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT]: {
        code: SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT,
        name: '安装中-待分配',
        category: StatusCategory.ORDER,
        order: 18,
        color: '#FB7185',
        description: '待分配安装师',
        nextStatuses: [SalesOrderStatus.INSTALLING_ASSIGNING, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    [SalesOrderStatus.INSTALLING_ASSIGNING]: {
        code: SalesOrderStatus.INSTALLING_ASSIGNING,
        name: '安装中-分配中',
        category: StatusCategory.ORDER,
        order: 19,
        color: '#F87171',
        description: '正在分配安装师',
        nextStatuses: [
            SalesOrderStatus.INSTALLING_PENDING_VISIT,
            SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.SUSPENDED,
        ],
    },

    [SalesOrderStatus.INSTALLING_PENDING_VISIT]: {
        code: SalesOrderStatus.INSTALLING_PENDING_VISIT,
        name: '安装中-待上门',
        category: StatusCategory.ORDER,
        order: 20,
        color: '#EF4444',
        description: '安装师待上门安装',
        nextStatuses: [SalesOrderStatus.INSTALLING_PENDING_CONFIRMATION, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
        requiredFields: ['installation_notes'],
    },

    [SalesOrderStatus.INSTALLING_PENDING_CONFIRMATION]: {
        code: SalesOrderStatus.INSTALLING_PENDING_CONFIRMATION,
        name: '安装中-待确认',
        category: StatusCategory.ORDER,
        order: 21,
        color: '#DC2626',
        description: '安装完成，待销售确认',
        nextStatuses: [
            SalesOrderStatus.DELIVERED,
            SalesOrderStatus.INSTALLING_PENDING_VISIT,
            SalesOrderStatus.CANCELLED,
            SalesOrderStatus.SUSPENDED,
        ],
        requiredFiles: ['installation_photos'],
    },

    [SalesOrderStatus.DELIVERED]: {
        code: SalesOrderStatus.DELIVERED,
        name: '已交付',
        category: StatusCategory.ORDER,
        order: 22,
        color: '#4CAF50',
        description: '安装确认交付',
        nextStatuses: [SalesOrderStatus.PENDING_RECONCILIATION, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    // ===== 财务阶段 =====
    [SalesOrderStatus.PENDING_RECONCILIATION]: {
        code: SalesOrderStatus.PENDING_RECONCILIATION,
        name: '待对账',
        category: StatusCategory.FINANCE,
        order: 23,
        color: '#B91C1C',
        description: '安装确认完成，待对账',
        nextStatuses: [SalesOrderStatus.PENDING_INVOICE, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
    },

    [SalesOrderStatus.PENDING_INVOICE]: {
        code: SalesOrderStatus.PENDING_INVOICE,
        name: '待开发票',
        category: StatusCategory.FINANCE,
        order: 24,
        color: '#7C3AED',
        description: '待财务开具发票',
        nextStatuses: [SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
        permissions: ['finance'],
    },

    [SalesOrderStatus.PENDING_PAYMENT]: {
        code: SalesOrderStatus.PENDING_PAYMENT,
        name: '待回款',
        category: StatusCategory.FINANCE,
        order: 25,
        color: '#6D28D9',
        description: '发票已开具，待回款',
        nextStatuses: [SalesOrderStatus.COMPLETED, SalesOrderStatus.CANCELLED, SalesOrderStatus.SUSPENDED],
        requiredFields: ['invoice_no'],
        permissions: ['finance'],
    },

    [SalesOrderStatus.COMPLETED]: {
        code: SalesOrderStatus.COMPLETED,
        name: '已完成',
        category: StatusCategory.FINANCE,
        order: 26,
        color: '#10B981',
        description: '回款完成，订单完结',
        nextStatuses: [SalesOrderStatus.SUSPENDED],
    },

    // ===== 异常状态 =====
    [SalesOrderStatus.CANCELLED]: {
        code: SalesOrderStatus.CANCELLED,
        name: '已取消',
        category: StatusCategory.EXCEPTION,
        order: 27,
        color: '#6B7280',
        description: '订单已取消',
        nextStatuses: [],
    },

    [SalesOrderStatus.SUSPENDED]: {
        code: SalesOrderStatus.SUSPENDED,
        name: '暂停',
        category: StatusCategory.EXCEPTION,
        order: 28,
        color: '#F59E0B',
        description: '订单暂停处理',
        nextStatuses: [
            // 线索阶段恢复状态
            SalesOrderStatus.PENDING_ASSIGNMENT,
            SalesOrderStatus.PENDING_FOLLOW_UP,
            SalesOrderStatus.FOLLOWING_UP,
            SalesOrderStatus.DRAFT_SIGNED,
            
            // 订单阶段恢复状态
            SalesOrderStatus.PENDING_MEASUREMENT,
            SalesOrderStatus.MEASURING_PENDING_ASSIGNMENT,
            SalesOrderStatus.MEASURING_ASSIGNING,
            SalesOrderStatus.MEASURING_PENDING_VISIT,
            SalesOrderStatus.MEASURING_PENDING_CONFIRMATION,
            SalesOrderStatus.PLAN_PENDING_CONFIRMATION,
            SalesOrderStatus.PENDING_PUSH,
            SalesOrderStatus.PENDING_ORDER,
            SalesOrderStatus.IN_PRODUCTION,
            SalesOrderStatus.STOCK_PREPARED,
            SalesOrderStatus.PENDING_SHIPMENT,
            SalesOrderStatus.SHIPPED,
            SalesOrderStatus.INSTALLING_PENDING_ASSIGNMENT,
            SalesOrderStatus.INSTALLING_ASSIGNING,
            SalesOrderStatus.INSTALLING_PENDING_VISIT,
            SalesOrderStatus.INSTALLING_PENDING_CONFIRMATION,
            SalesOrderStatus.DELIVERED,
            SalesOrderStatus.PENDING_RECONCILIATION,
            
            // 财务阶段恢复状态
            SalesOrderStatus.PENDING_INVOICE,
            SalesOrderStatus.PENDING_PAYMENT,
            SalesOrderStatus.COMPLETED,
            
            // 异常状态
            SalesOrderStatus.CANCELLED
        ],
    },

    [SalesOrderStatus.EXCEPTION]: {
        code: SalesOrderStatus.EXCEPTION,
        name: '异常',
        category: StatusCategory.EXCEPTION,
        order: 29,
        color: '#EF4444',
        description: '订单异常',
        nextStatuses: [SalesOrderStatus.FOLLOWING_UP, SalesOrderStatus.CANCELLED],
    },
};

// ==================== 辅助函数 ====================

/**
 * 验证状态流转是否合法
 */
export function canTransitionTo(
    currentStatus: SalesOrderStatus,
    targetStatus: SalesOrderStatus
): boolean {
    const metadata = STATUS_METADATA[currentStatus];
    return metadata.nextStatuses.includes(targetStatus);
}

/**
 * 获取状态的显示名称
 */
export function getStatusName(status: SalesOrderStatus): string {
    return STATUS_METADATA[status]?.name || status;
}

/**
 * 获取从当前状态到目标状态的流转路径 (BFS)
 */
export function getStatusTransitionPath(
    startStatus: SalesOrderStatus,
    endStatus: SalesOrderStatus
): SalesOrderStatus[] | null {
    if (startStatus === endStatus) return [startStatus];

    const queue: Array<{ status: SalesOrderStatus; path: SalesOrderStatus[] }> = [
        { status: startStatus, path: [startStatus] }
    ];
    const visited = new Set<SalesOrderStatus>([startStatus]);

    while (queue.length > 0) {
        const { status, path } = queue.shift()!;

        const metadata = STATUS_METADATA[status];
        if (!metadata) continue;

        for (const nextStatus of metadata.nextStatuses) {
            if (nextStatus === endStatus) {
                return [...path, nextStatus];
            }

            if (!visited.has(nextStatus)) {
                visited.add(nextStatus);
                queue.push({
                    status: nextStatus,
                    path: [...path, nextStatus]
                });
            }
        }
    }

    return null;
}
