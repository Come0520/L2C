// Export inferred type for Ticket Detail
import { getTicketDetail, getAfterSalesTickets } from './actions';

type ActionResponse = Awaited<ReturnType<typeof getTicketDetail>>;
export type TicketDetail = NonNullable<NonNullable<ActionResponse['data']>['data']>;
export type LiabilityNotice = NonNullable<TicketDetail['notices']>[number];

type ListActionResponse = Awaited<ReturnType<typeof getAfterSalesTickets>>;
export type TicketListItem = NonNullable<ListActionResponse['data']>[number];
