import { logger } from "@/shared/lib/logger";
import { InferSelectModel } from 'drizzle-orm';
import {
    receiptBills,
    customers,
    users,
    receiptBillItems,
    paymentOrders,
    paymentOrderItems,
    financeAccounts,
    arStatements,
    apSupplierStatements,
    apLaborStatements,
    orders,
    suppliers,
    purchaseOrders
} from '@/shared/api/schema';

export type ReceiptBill = InferSelectModel<typeof receiptBills>;
export type Customer = InferSelectModel<typeof customers>;
export type User = InferSelectModel<typeof users>;
export type ReceiptBillItem = InferSelectModel<typeof receiptBillItems>;

export type ReceiptBillWithRelations = ReceiptBill & {
    customer?: Customer | null;
    createdBy?: User | null;
    items?: ReceiptBillItem[];
};

export type PaymentOrder = InferSelectModel<typeof paymentOrders>;
export type PaymentOrderItem = InferSelectModel<typeof paymentOrderItems>;

export type PaymentOrderWithRelations = PaymentOrder & {
    customer?: Customer | null;
    items?: PaymentOrderItem[];
    createdBy?: User | null;
};

export type FinanceAccount = InferSelectModel<typeof financeAccounts>;

export type Order = InferSelectModel<typeof orders>;
export type Supplier = InferSelectModel<typeof suppliers>;
export type PurchaseOrder = InferSelectModel<typeof purchaseOrders>;

export type ARStatement = InferSelectModel<typeof arStatements>;
export type APSupplierStatement = InferSelectModel<typeof apSupplierStatements>;
export type APLaborStatement = InferSelectModel<typeof apLaborStatements>;

export type ARStatementWithRelations = ARStatement & {
    order?: Order | null;
    customer?: Customer | null;
    sales?: User | null;
};

export type APSupplierStatementWithRelations = APSupplierStatement & {
    supplier?: Supplier | null;
    purchaseOrder?: PurchaseOrder | null;
    purchaser?: User | null;
};

export type APLaborStatementWithRelations = APLaborStatement & {
    worker?: User | null;
};

export type APStatementWithRelations = APSupplierStatementWithRelations | APLaborStatementWithRelations;
