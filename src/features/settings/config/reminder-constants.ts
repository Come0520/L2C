export type ReminderModule = 'LEAD' | 'ORDER' | 'MEASURE' | 'INSTALL' | 'AR' | 'AP';

export const STATUS_OPTIONS: Record<ReminderModule, { value: string; label: string }[]> = {
    LEAD: [
        { value: 'PENDING_DISPATCH', label: 'Pending Dispatch' },
        { value: 'PENDING_FOLLOWUP', label: 'Pending Followup' },
        { value: 'FOLLOWING', label: 'Following' },
        { value: 'WON', label: 'Won' },
        { value: 'VOID', label: 'Void' },
    ],
    ORDER: [
        { value: 'PENDING_PO', label: 'Pending PO' },
        { value: 'IN_PRODUCTION', label: 'In Production' },
        { value: 'PENDING_DELIVERY', label: 'Pending Delivery' },
        { value: 'DISPATCHING', label: 'Dispatching' },
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'PENDING_INSTALL', label: 'Pending Install' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CLOSED', label: 'Closed' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ],
    MEASURE: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'DISPATCHING', label: 'Dispatching' },
        { value: 'PENDING_VISIT', label: 'Pending Visit' },
        { value: 'PENDING_CONFIRM', label: 'Pending Confirm' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ],
    INSTALL: [
        { value: 'PENDING_DISPATCH', label: 'Pending Dispatch' },
        { value: 'DISPATCHING', label: 'Dispatching' },
        { value: 'PENDING_VISIT', label: 'Pending Visit' },
        { value: 'PENDING_CONFIRM', label: 'Pending Confirm' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ],
    AR: [
        { value: 'PENDING_RECON', label: 'Pending Recon' },
        { value: 'PENDING_INVOICE', label: 'Pending Invoice' },
        { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'BAD_DEBT', label: 'Bad Debt' },
        { value: 'VOID', label: 'Void' },
    ],
    AP: [ 
        { value: 'PENDING', label: 'Pending' },
        { value: 'PARTIAL', label: 'Partial' },
        { value: 'PAID', label: 'Paid' },
    ],
};
