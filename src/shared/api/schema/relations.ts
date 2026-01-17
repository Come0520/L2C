import { relations } from 'drizzle-orm';

import {
    tenants,
    users,
} from './infrastructure';

import {
    customers
} from './customers';

import {
    customerAddresses
} from './customer-addresses';

import {
    leads,
    leadActivities
} from './leads';

import { marketChannels, products, productAttributeTemplates } from './catalogs';
import { channels, channelContacts } from './channels';
import { suppliers, purchaseOrders, productSuppliers, productionTasks, purchaseOrderItems } from './supply-chain';

import {
    orders,
    orderItems,
    paymentSchedules
} from './orders';

import {
    afterSalesTickets,
    liabilityNotices
} from './after-sales';

import {
    quotes,
    quoteItems,
    quoteRooms
} from './quotes';

import {
    approvalFlows,
    approvalNodes,
    approvals,
    approvalTasks
} from './approval';

import {
    measureTasks,
    measureSheets,
    measureItems,
    installTasks,
    installItems,
    installPhotos
} from './service';




import {
    financeConfigs,
    financeAccounts,
    accountTransactions,
    arStatements,
    paymentOrders,
    paymentOrderItems,
    commissionRecords,
    apSupplierStatements,
    paymentBills,
    paymentBillItems,
    apLaborStatements,
    apLaborFeeDetails,
    reconciliations,
    reconciliationDetails
} from './finance';

export const tenantsRelations = relations(tenants, ({ many }) => ({
    users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
    tenant: one(tenants, {
        fields: [users.tenantId],
        references: [tenants.id],
    }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [customers.tenantId],
        references: [tenants.id],
    }),
    assignedSales: one(users, {
        fields: [customers.assignedSalesId],
        references: [users.id],
    }),
    creator: one(users, {
        fields: [customers.createdBy],
        references: [users.id],
    }),
    referrer: one(customers, {
        fields: [customers.referrerCustomerId],
        references: [customers.id],
        relationName: 'customerReferrer'
    }),
    referrals: many(customers, {
        relationName: 'customerReferrer'
    }),
    addresses: many(customerAddresses),
    orders: many(orders),
    quotes: many(quotes),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
    customer: one(customers, {
        fields: [customerAddresses.customerId],
        references: [customers.id],
    }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [leads.tenantId],
        references: [tenants.id],
    }),
    assignedSales: one(users, {
        fields: [leads.assignedSalesId],
        references: [users.id],
    }),
    creator: one(users, {
        fields: [leads.createdBy],
        references: [users.id],
    }),
    customer: one(customers, {
        fields: [leads.customerId],
        references: [customers.id],
    }),
    sourceChannel: one(marketChannels, {
        fields: [leads.sourceChannelId],
        references: [marketChannels.id],
        relationName: 'leadSourceChannel',
    }),
    sourceSub: one(marketChannels, {
        fields: [leads.sourceSubId],
        references: [marketChannels.id],
        relationName: 'leadSourceSub',
    }),
    referrerCustomer: one(customers, {
        fields: [leads.referrerCustomerId],
        references: [customers.id],
        relationName: 'leadReferrer',
    }),
    activities: many(leadActivities),
    channel: one(channels, {
        fields: [leads.channelId],
        references: [channels.id],
    }),
    channelContact: one(channelContacts, {
        fields: [leads.channelContactId],
        references: [channelContacts.id],
    }),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
    lead: one(leads, {
        fields: [leadActivities.leadId],
        references: [leads.id],
    }),
    creator: one(users, {
        fields: [leadActivities.createdBy],
        references: [users.id],
    }),
}));

export const marketChannelsRelations = relations(marketChannels, ({ one, many }) => ({
    parent: one(marketChannels, {
        fields: [marketChannels.parentId],
        references: [marketChannels.id],
        relationName: 'marketChannelChildren',
    }),
    children: many(marketChannels, {
        relationName: 'marketChannelChildren',
    }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    products: many(products),
    productSuppliers: many(productSuppliers),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [products.tenantId],
        references: [tenants.id],
    }),
    defaultSupplier: one(suppliers, {
        fields: [products.defaultSupplierId],
        references: [suppliers.id],
    }),
    productSuppliers: many(productSuppliers),
}));

export const productSuppliersRelations = relations(productSuppliers, ({ one }) => ({
    product: one(products, {
        fields: [productSuppliers.productId],
        references: [products.id],
    }),
    supplier: one(suppliers, {
        fields: [productSuppliers.supplierId],
        references: [suppliers.id],
    }),
}));

export const productAttributeTemplatesRelations = relations(productAttributeTemplates, ({ one }) => ({
    tenant: one(tenants, {
        fields: [productAttributeTemplates.tenantId],
        references: [tenants.id],
    }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [channels.tenantId],
        references: [tenants.id],
    }),
    contacts: many(channelContacts),
    assignedManager: one(users, {
        fields: [channels.assignedManagerId],
        references: [users.id],
    }),
    leads: many(leads),
}));

export const channelContactsRelations = relations(channelContacts, ({ one }) => ({
    channel: one(channels, {
        fields: [channelContacts.channelId],
        references: [channels.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id],
    }),
    quote: one(quotes, {
        fields: [orders.quoteId],
        references: [quotes.id],
    }),
    sales: one(users, {
        fields: [orders.salesId],
        references: [users.id],
    }),
    items: many(orderItems),
    paymentSchedules: many(paymentSchedules),
    installTasks: many(installTasks),
    afterSales: many(afterSalesTickets),
    arStatements: many(arStatements),
    paymentOrderItems: many(paymentOrderItems),
    commissionRecords: many(commissionRecords),
    purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [purchaseOrders.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [purchaseOrders.orderId],
        references: [orders.id],
    }),
    supplier: one(suppliers, {
        fields: [purchaseOrders.supplierId],
        references: [suppliers.id],
    }),
    items: many(purchaseOrderItems),
    creator: one(users, {
        fields: [purchaseOrders.createdBy],
        references: [users.id],
    }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    po: one(purchaseOrders, {
        fields: [purchaseOrderItems.poId],
        references: [purchaseOrders.id],
    }),
}));

export const productionTasksRelations = relations(productionTasks, ({ one }) => ({
    tenant: one(tenants, {
        fields: [productionTasks.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [productionTasks.orderId],
        references: [orders.id],
    }),
    orderItem: one(orderItems, {
        fields: [productionTasks.orderItemId],
        references: [orderItems.id],
    }),
    worker: one(users, {
        fields: [productionTasks.assignedWorkerId],
        references: [users.id],
    }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
    quoteItem: one(quoteItems, {
        fields: [orderItems.quoteItemId],
        references: [quoteItems.id],
    }),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ one }) => ({
    order: one(orders, {
        fields: [paymentSchedules.orderId],
        references: [orders.id],
    }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [quotes.tenantId],
        references: [tenants.id],
    }),
    customer: one(customers, {
        fields: [quotes.customerId],
        references: [customers.id],
    }),
    lead: one(leads, {
        fields: [quotes.leadId],
        references: [leads.id],
    }),
    measureVariant: one(measureSheets, {
        fields: [quotes.measureVariantId],
        references: [measureSheets.id],
    }),
    creator: one(users, {
        fields: [quotes.createdBy],
        references: [users.id],
    }),
    items: many(quoteItems),
    rooms: many(quoteRooms),
}));

export const quoteRoomsRelations = relations(quoteRooms, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [quoteRooms.tenantId],
        references: [tenants.id],
    }),
    quote: one(quotes, {
        fields: [quoteRooms.quoteId],
        references: [quotes.id],
    }),
    items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
    tenant: one(tenants, {
        fields: [quoteItems.tenantId],
        references: [tenants.id],
    }),
    quote: one(quotes, {
        fields: [quoteItems.quoteId],
        references: [quotes.id],
    }),
    room: one(quoteRooms, {
        fields: [quoteItems.roomId],
        references: [quoteRooms.id],
    }),
    product: one(products, {
        fields: [quoteItems.productId],
        references: [products.id],
    }),
}));

export const measureTasksRelations = relations(measureTasks, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [measureTasks.tenantId],
        references: [tenants.id],
    }),
    lead: one(leads, {
        fields: [measureTasks.leadId],
        references: [leads.id],
    }),
    customer: one(customers, {
        fields: [measureTasks.customerId],
        references: [customers.id],
    }),
    assignedWorker: one(users, {
        fields: [measureTasks.assignedWorkerId],
        references: [users.id],
    }),
    sheets: many(measureSheets),
}));


export const measureSheetsRelations = relations(measureSheets, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [measureSheets.tenantId],
        references: [tenants.id],
    }),
    task: one(measureTasks, {
        fields: [measureSheets.taskId],
        references: [measureTasks.id],
    }),
    items: many(measureItems),
}));

export const measureItemsRelations = relations(measureItems, ({ one }) => ({
    tenant: one(tenants, {
        fields: [measureItems.tenantId],
        references: [tenants.id],
    }),
    sheet: one(measureSheets, {
        fields: [measureItems.sheetId],
        references: [measureSheets.id],
    }),
}));


export const installTasksRelations = relations(installTasks, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [installTasks.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [installTasks.orderId],
        references: [orders.id],
    }),
    afterSales: one(afterSalesTickets, {
        fields: [installTasks.afterSalesId],
        references: [afterSalesTickets.id],
    }),
    customer: one(customers, {
        fields: [installTasks.customerId],
        references: [customers.id],
    }),
    sales: one(users, {
        fields: [installTasks.salesId],
        references: [users.id],
    }),
    dispatcher: one(users, {
        fields: [installTasks.dispatcherId],
        references: [users.id],
    }),
    installer: one(users, {
        fields: [installTasks.installerId],
        references: [users.id],
    }),
    confirmedBy: one(users, {
        fields: [installTasks.confirmedBy],
        references: [users.id],
    }),
    items: many(installItems),
    photos: many(installPhotos),
    laborFeeDetails: many(apLaborFeeDetails),
}));

export const installItemsRelations = relations(installItems, ({ one }) => ({
    tenant: one(tenants, {
        fields: [installItems.tenantId],
        references: [tenants.id],
    }),
    task: one(installTasks, {
        fields: [installItems.installTaskId],
        references: [installTasks.id],
    }),
}));

export const installPhotosRelations = relations(installPhotos, ({ one }) => ({
    tenant: one(tenants, {
        fields: [installPhotos.tenantId],
        references: [tenants.id],
    }),
    task: one(installTasks, {
        fields: [installPhotos.installTaskId],
        references: [installTasks.id],
    }),
}));


// ==================== 财务模块关系 (Finance Module Relations) ====================

export const financeConfigsRelations = relations(financeConfigs, ({ one }) => ({
    tenant: one(tenants, {
        fields: [financeConfigs.tenantId],
        references: [tenants.id],
    }),
}));

export const financeAccountsRelations = relations(financeAccounts, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [financeAccounts.tenantId],
        references: [tenants.id],
    }),
    transactions: many(accountTransactions),
}));

export const accountTransactionsRelations = relations(accountTransactions, ({ one }) => ({
    tenant: one(tenants, {
        fields: [accountTransactions.tenantId],
        references: [tenants.id],
    }),
    account: one(financeAccounts, {
        fields: [accountTransactions.accountId],
        references: [financeAccounts.id],
    }),
}));

export const arStatementsRelations = relations(arStatements, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [arStatements.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [arStatements.orderId],
        references: [orders.id],
    }),
    customer: one(customers, {
        fields: [arStatements.customerId],
        references: [customers.id],
    }),
    sales: one(users, {
        fields: [arStatements.salesId],
        references: [users.id],
    }),
    channel: one(marketChannels, {
        fields: [arStatements.channelId],
        references: [marketChannels.id],
    }),
    commissionRecords: many(commissionRecords),
}));

export const paymentOrdersRelations = relations(paymentOrders, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [paymentOrders.tenantId],
        references: [tenants.id],
    }),
    customer: one(customers, {
        fields: [paymentOrders.customerId],
        references: [customers.id],
    }),
    account: one(financeAccounts, {
        fields: [paymentOrders.accountId],
        references: [financeAccounts.id],
    }),
    createdBy: one(users, {
        fields: [paymentOrders.createdBy],
        references: [users.id],
    }),
    verifiedBy: one(users, {
        fields: [paymentOrders.verifiedBy],
        references: [users.id],
    }),
    items: many(paymentOrderItems),
}));

export const paymentOrderItemsRelations = relations(paymentOrderItems, ({ one }) => ({
    paymentOrder: one(paymentOrders, {
        fields: [paymentOrderItems.paymentOrderId],
        references: [paymentOrders.id],
    }),
    order: one(orders, {
        fields: [paymentOrderItems.orderId],
        references: [orders.id],
    }),
}));

export const commissionRecordsRelations = relations(commissionRecords, ({ one }) => ({
    tenant: one(tenants, {
        fields: [commissionRecords.tenantId],
        references: [tenants.id],
    }),
    arStatement: one(arStatements, {
        fields: [commissionRecords.arStatementId],
        references: [arStatements.id],
    }),
    order: one(orders, {
        fields: [commissionRecords.orderId],
        references: [orders.id],
    }),
    channel: one(marketChannels, {
        fields: [commissionRecords.channelId],
        references: [marketChannels.id],
    }),
}));

export const apSupplierStatementsRelations = relations(apSupplierStatements, ({ one }) => ({
    tenant: one(tenants, {
        fields: [apSupplierStatements.tenantId],
        references: [tenants.id],
    }),
    purchaseOrder: one(purchaseOrders, {
        fields: [apSupplierStatements.purchaseOrderId],
        references: [purchaseOrders.id],
    }),
    supplier: one(suppliers, {
        fields: [apSupplierStatements.supplierId],
        references: [suppliers.id],
    }),
    purchaser: one(users, {
        fields: [apSupplierStatements.purchaserId],
        references: [users.id],
    }),
}));

export const paymentBillsRelations = relations(paymentBills, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [paymentBills.tenantId],
        references: [tenants.id],
    }),
    account: one(financeAccounts, {
        fields: [paymentBills.accountId],
        references: [financeAccounts.id],
    }),
    recordedBy: one(users, {
        fields: [paymentBills.recordedBy],
        references: [users.id],
    }),
    verifiedBy: one(users, {
        fields: [paymentBills.verifiedBy],
        references: [users.id],
    }),
    items: many(paymentBillItems),
}));

export const paymentBillItemsRelations = relations(paymentBillItems, ({ one }) => ({
    paymentBill: one(paymentBills, {
        fields: [paymentBillItems.paymentBillId],
        references: [paymentBills.id],
    }),
}));

export const apLaborStatementsRelations = relations(apLaborStatements, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [apLaborStatements.tenantId],
        references: [tenants.id],
    }),
    worker: one(users, {
        fields: [apLaborStatements.workerId],
        references: [users.id],
    }),
    verifiedBy: one(users, {
        fields: [apLaborStatements.verifiedBy],
        references: [users.id],
    }),
    feeDetails: many(apLaborFeeDetails),
}));

export const apLaborFeeDetailsRelations = relations(apLaborFeeDetails, ({ one }) => ({
    statement: one(apLaborStatements, {
        fields: [apLaborFeeDetails.statementId],
        references: [apLaborStatements.id],
    }),
    installTask: one(installTasks, {
        fields: [apLaborFeeDetails.installTaskId],
        references: [installTasks.id],
    }),
}));

export const reconciliationsRelations = relations(reconciliations, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [reconciliations.tenantId],
        references: [tenants.id],
    }),
    confirmedBy: one(users, {
        fields: [reconciliations.confirmedBy],
        references: [users.id],
    }),
    details: many(reconciliationDetails),
}));

export const reconciliationDetailsRelations = relations(reconciliationDetails, ({ one }) => ({
    reconciliation: one(reconciliations, {
        fields: [reconciliationDetails.reconciliationId],
        references: [reconciliations.id],
    }),
}));

export const afterSalesTicketsRelations = relations(afterSalesTickets, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [afterSalesTickets.tenantId],
        references: [tenants.id],
    }),
    order: one(orders, {
        fields: [afterSalesTickets.orderId],
        references: [orders.id],
    }),
    customer: one(customers, {
        fields: [afterSalesTickets.customerId],
        references: [customers.id],
    }),
    installTask: one(installTasks, {
        fields: [afterSalesTickets.installTaskId],
        references: [installTasks.id],
    }),
    creator: one(users, {
        fields: [afterSalesTickets.createdBy],
        references: [users.id],
    }),
    assignee: one(users, {
        fields: [afterSalesTickets.assignedTo],
        references: [users.id],
    }),
    notices: many(liabilityNotices),
}));

export const liabilityNoticesRelations = relations(liabilityNotices, ({ one }) => ({
    tenant: one(tenants, {
        fields: [liabilityNotices.tenantId],
        references: [tenants.id],
    }),
    ticket: one(afterSalesTickets, {
        fields: [liabilityNotices.afterSalesId],
        references: [afterSalesTickets.id],
    }),
    sourcePurchaseOrder: one(purchaseOrders, {
        fields: [liabilityNotices.sourcePurchaseOrderId],
        references: [purchaseOrders.id],
    }),
    sourceInstallTask: one(installTasks, {
        fields: [liabilityNotices.sourceInstallTaskId],
        references: [installTasks.id],
    }),
    confirmer: one(users, {
        fields: [liabilityNotices.confirmedBy],
        references: [users.id],
    }),
    arbitrator: one(users, {
        fields: [liabilityNotices.arbitratedBy],
        references: [users.id],
    }),
}));

export const approvalFlowsRelations = relations(approvalFlows, ({ many }) => ({
    nodes: many(approvalNodes),
    instances: many(approvals),
}));

export const approvalNodesRelations = relations(approvalNodes, ({ one }) => ({
    flow: one(approvalFlows, {
        fields: [approvalNodes.flowId],
        references: [approvalFlows.id],
    }),
}));

export const approvalsRelations = relations(approvals, ({ one, many }) => ({
    flow: one(approvalFlows, {
        fields: [approvals.flowId],
        references: [approvalFlows.id],
    }),
    requester: one(users, {
        fields: [approvals.requesterId],
        references: [users.id],
    }),
    tasks: many(approvalTasks),
}));

export const approvalTasksRelations = relations(approvalTasks, ({ one }) => ({
    approval: one(approvals, {
        fields: [approvalTasks.approvalId],
        references: [approvals.id],
    }),
    node: one(approvalNodes, {
        fields: [approvalTasks.nodeId],
        references: [approvalNodes.id],
    }),
    approver: one(users, {
        fields: [approvalTasks.approverId],
        references: [users.id],
    }),
}));
