export * from './queries';
export * from './mutations';
export * from './auto-close';
export * from './order-export';
export {
    createOrderFromQuote,
    splitOrder,
    requestDelivery,
    confirmOrderProduction,
    updateLogistics,
    confirmInstallationAction,
    requestCustomerConfirmationAction,
    customerAcceptAction,
    customerRejectAction
} from './orders';

// Re-export getOrderById as getOrderDetail for compatibility
import { getOrderById } from './queries';
export const getOrderDetail = getOrderById;
