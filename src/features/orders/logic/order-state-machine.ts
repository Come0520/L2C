import { orderStatusEnum } from '@/shared/api/schema';

// Helper to get type from Enum
// Helper to get type from Enum
type OrderStatus = typeof orderStatusEnum.enumValues[number];

export class OrderStateMachine {
    private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
        'DRAFT': ['PENDING_MEASURE', 'CANCELLED'],
        'PENDING_MEASURE': ['MEASURED', 'CANCELLED'],
        'MEASURED': ['QUOTED', 'CANCELLED'],
        'QUOTED': ['SIGNED', 'CANCELLED', 'DRAFT'],
        'SIGNED': ['PAID', 'CANCELLED'],
        'PAID': ['PENDING_PRODUCTION', 'PENDING_PO', 'CANCELLED'],
        'PENDING_PO': ['PENDING_PRODUCTION', 'CANCELLED'],
        'PENDING_PRODUCTION': ['IN_PRODUCTION', 'CANCELLED'],
        'IN_PRODUCTION': ['PENDING_DELIVERY', 'CANCELLED'],
        'PENDING_DELIVERY': ['PENDING_INSTALL', 'CANCELLED'],
        'PENDING_INSTALL': ['INSTALLATION_COMPLETED', 'CANCELLED'], // Install -> Completed (Wait for check)

        'INSTALLATION_COMPLETED': ['PENDING_CONFIRMATION', 'INSTALLATION_REJECTED', 'COMPLETED', 'CANCELLED'],
        // Can go to PENDING_CONFIRMATION (Wait for Customer), 
        // or directly COMPLETED (if no confirmation needed? Rule says Wait-for-Customer)

        'PENDING_CONFIRMATION': ['COMPLETED', 'INSTALLATION_REJECTED', 'CANCELLED'],
        'INSTALLATION_REJECTED': ['PENDING_INSTALL', 'CANCELLED'], // Re-install

        'COMPLETED': [],
        'PAUSED': ['IN_PRODUCTION', 'PENDING_PRODUCTION'], // Add PAUSED transitions
        'PENDING_APPROVAL': ['PENDING_PRODUCTION', 'CANCELLED'],
        'CANCELLED': []
    };

    /**
     * 验证状态流转是否合法
     * @param current 当前状态
     * @param next 目标状态
     * @returns boolean 是否合法
     */
    static validateTransition(current: OrderStatus, next: OrderStatus): boolean {
        // Allow self-transition (e.g. updating other fields)
        if (current === next) return true;

        const allowed = this.transitions[current] || [];
        return allowed.includes(next);
    }

    /**
     * 获取指定状态下允许的下一个动作状态
     */
    static getNextStates(current: OrderStatus): OrderStatus[] {
        return this.transitions[current] || [];
    }

    /**
     * 是否可以取消
     */
    static canCancel(current: OrderStatus): boolean {
        return current !== 'COMPLETED' && current !== 'CANCELLED';
    }
}
