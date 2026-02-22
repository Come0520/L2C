import { z } from 'zod';

export type MeasureTaskStatus = 'PENDING_APPROVAL' | 'PENDING' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED';

export const MEASURE_STATUS_LABELS: Record<MeasureTaskStatus, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    PENDING: 'Pending',
    DISPATCHING: 'Dispatching',
    PENDING_VISIT: 'Pending Visit',
    PENDING_CONFIRM: 'Pending Confirm',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

export interface MeasureTask {
    id: string;
    measureNo: string | null;
    tenantId: string | null;
    orderId?: string;
    customerId: string | null;
    status: MeasureTaskStatus | string | null;
    scheduledAt: string | null;
    address?: string;
    rejectCount?: number | null;      // 驳回次数
    rejectReason?: string | null;     // 最近驳回原因
    customer?: {
        name: string | null;
        phone: string | null;
    } | null;
    lead?: {
        community: string | null;
        address: string | null;
    } | null;
    assignedWorker?: {
        id: string;
        name: string | null;
    } | null;
}

export const MeasureResultSchema = z.object({
    taskId: z.string().uuid(),
    data: z.record(z.string(), z.unknown())
});
