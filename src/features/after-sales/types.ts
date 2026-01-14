
import {
    afterSalesTickets,
    liabilityNotices
} from '@/shared/api/schema';
import { InferSelectModel } from 'drizzle-orm';

export type Ticket = InferSelectModel<typeof afterSalesTickets>;
export type LiabilityNotice = InferSelectModel<typeof liabilityNotices>;

export type TicketDetail = Ticket & {
    customer?: {
        id: string;
        name: string | null;
        phone: string | null;
        defaultAddress: string | null;
    };
    order?: {
        orderNo: string;
    } | null;
    assignee?: {
        name: string | null;
    } | null;
    liabilityNotices: LiabilityNotice[];
};
