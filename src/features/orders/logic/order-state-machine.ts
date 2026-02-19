import { orderStatusEnum } from '@/shared/api/schema';

// 辅助类型：从 Enum 中提取订单状态类型
type OrderStatus = typeof orderStatusEnum.enumValues[number];

export class OrderStateMachine {
    private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
        'DRAFT': ['PENDING_MEASURE', 'CANCELLED'],
        'PENDING_MEASURE': ['MEASURED', 'CANCELLED'],
        'MEASURED': ['QUOTED', 'CANCELLED'],
        'QUOTED': ['SIGNED', 'CANCELLED', 'DRAFT'],
        'SIGNED': ['PAID', 'CANCELLED', 'HALTED'],
        'PAID': ['PENDING_PRODUCTION', 'PENDING_PO', 'CANCELLED', 'HALTED'],
        'PENDING_PO': ['PENDING_PRODUCTION', 'CANCELLED', 'HALTED'],
        'PENDING_PRODUCTION': ['IN_PRODUCTION', 'CANCELLED', 'HALTED'], // Allow Halt from Pending Production
        'IN_PRODUCTION': ['PENDING_DELIVERY', 'CANCELLED', 'HALTED'], // Allow Halt from In Production
        'PENDING_DELIVERY': ['PENDING_INSTALL', 'CANCELLED', 'HALTED'], // 允许叫停
        'PENDING_INSTALL': ['INSTALLATION_COMPLETED', 'CANCELLED', 'HALTED'],

        'INSTALLATION_COMPLETED': ['PENDING_CONFIRMATION', 'INSTALLATION_REJECTED', 'COMPLETED', 'CANCELLED'],
        'PENDING_CONFIRMATION': ['COMPLETED', 'INSTALLATION_REJECTED', 'CANCELLED'],
        'INSTALLATION_REJECTED': ['PENDING_INSTALL', 'CANCELLED'], // Re-install

        'COMPLETED': [], // Final state

        // PAUSED 已废弃，保留为终态以满足类型约束（数据库枚举仍含此值）
        'PAUSED': [],

        // HALTED 可以恢复到生产状态或取消（合并了已废弃的 PAUSED 状态）
        'HALTED': ['IN_PRODUCTION', 'PENDING_PRODUCTION', 'CANCELLED'],

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
     * 获取当前状态下可能的自动流转目标
     * 例如：某些状态在满足时间或数据条件后可自动跳过
     */
    static getAutoTransition(current: OrderStatus): OrderStatus | null {
        switch (current) {
            case 'INSTALLATION_COMPLETED':
                return 'COMPLETED'; // 验收完成后可自动结案（配合 T+N 策略）
            case 'PENDING_DELIVERY':
                // 如果是虚拟商品或无需物流，可考虑自动跳过（此处留作扩展）
                return null;
            default:
                return null;
        }
    }

    /**
     * 是否可以取消
     */
    static canCancel(current: OrderStatus): boolean {
        return current !== 'COMPLETED' && current !== 'CANCELLED';
    }
}
