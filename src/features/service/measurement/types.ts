import { z } from 'zod';

export type MeasureTaskStatus = 'PENDING' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED';

export const MEASURE_STATUS_LABELS: Record<MeasureTaskStatus, string> = {
    PENDING: 'Pending',
    DISPATCHING: 'Dispatching',
    PENDING_VISIT: 'Pending Visit',
    PENDING_CONFIRM: 'Pending Confirm',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

export interface MeasureTask {
    id: string;
    measureNo: string;
    tenantId: string;
    orderId?: string;
    customerId: string;
    status: MeasureTaskStatus;
    scheduledAt: Date;
    address: string;
    rejectCount?: number;      // 驳回次数
    rejectReason?: string;     // 最近驳回原因
    customer?: {
        name: string;
        phone: string;
    };
    lead?: {
        community?: string;
        address?: string;
    };
    assignedWorker?: {
        id: string;
        name: string;
    };
}

export const MeasureResultSchema = z.object({
    taskId: z.string().uuid(),
    data: z.any()
});
