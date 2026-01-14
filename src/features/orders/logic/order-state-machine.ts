
// Import types from schema if possible, or define locally to match
import { orderStatusEnum } from '@/shared/api/schema';

// Extract the enum values type
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export class OrderStateMachine {
    private static transitions: Record<OrderStatus, OrderStatus[]> = {
        'PENDING_PO': ['IN_PRODUCTION', 'CANCELLED'],
        'IN_PRODUCTION': ['PENDING_DELIVERY', 'CANCELLED'],
        'PENDING_DELIVERY': ['DISPATCHING', 'CANCELLED'],
        'DISPATCHING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['PENDING_INSTALL', 'CANCELLED'],
        'PENDING_INSTALL': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': ['CLOSED'],
        'CLOSED': [],
        'CANCELLED': []
    };

    /**
     * 校验状态流转是否合�?
     * @param current 当前状�?
     * @param next 目标状�?
     * @returns boolean 是否合法
     * @throws Error 如果流转非法
     */
    static validateTransition(current: OrderStatus, next: OrderStatus): boolean {
        // Allow self-transition (e.g. updating other fields)
        if (current === next) return true;

        const allowed = this.transitions[current] || [];
        if (!allowed.includes(next)) {
            throw new Error('Invalid transition');
        }

        // Final guard against cancellation if map is somehow wrong
        if (next === 'CANCELLED' && !this.canCancel(current)) {
            throw new Error('Invalid transition');
        }

        return true;
    }

    /**
     * 获取指定状态下允许的下一个动�?状�?
     */
    static getNextStates(current: OrderStatus): OrderStatus[] {
        return this.transitions[current] || [];
    }

    /**
     * 检查是否可以取�?
     */
    static canCancel(current: OrderStatus): boolean {
        const nonCancellable: OrderStatus[] = ['COMPLETED', 'CLOSED', 'CANCELLED'];
        return !nonCancellable.includes(current);
    }
}
