import { relations } from 'drizzle-orm';

import { tenants, users } from './infrastructure';

import { customers, phoneViewLogs, customerMergeLogs } from './customers';

import { customerAddresses } from './customer-addresses';

import { leads, leadActivities, leadStatusHistory } from './leads';

import {
  marketChannels,
  products,
  productAttributeTemplates,
  productPriceHistory,
} from './catalogs';
import {
  channels,
  channelContacts,
  channelCommissions,
  channelSettlements,
  commissionAdjustments,
  channelCategories,
} from './channels';
import {
  suppliers,
  purchaseOrders,
  productSuppliers,
  productionTasks,
  purchaseOrderItems,
  splitRouteRules,
  channelSpecificPrices,
  productBundles,
  productBundleItems,
  productPackages,
  packageProducts,
  fabricInventory,
  fabricInventoryLogs,
  poPayments,
  poShipments,
} from './supply-chain';

import { orders, orderItems, paymentSchedules, orderChanges } from './orders';

import { afterSalesTickets, liabilityNotices } from './after-sales';

import {
  quotes,
  quoteItems,
  quoteRooms,
  quotePlans,
  quotePlanItems,
  quoteTemplates,
  quoteTemplateRooms,
  quoteTemplateItems,
} from './quotes';

import {
  approvalFlows,
  approvalNodes,
  approvals,
  approvalTasks,
  approvalDelegations,
} from './approval';

import {
  measureTasks,
  measureSheets,
  measureItems,
  measureTaskSplits,
  installTasks,
  installItems,
  installPhotos,
} from './service';

import { workOrders, workOrderItems } from './processing';
import { warehouses, inventory, inventoryLogs } from './inventory';
import { notifications, notificationPreferences } from './notifications';
import { loyaltyTransactions } from './loyalty';
import { auditLogs } from './audit';
import { quoteConfig } from './quote-config';
import { laborRates } from './labor-pricing';
import { workerSkills } from './worker-skills';
import { systemSettings, systemSettingsHistory } from './system-settings';

import {
  financeConfigs,
  financeAccounts,
  accountTransactions,
  internalTransfers,
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
  reconciliationDetails,
  receiptBills,
  receiptBillItems,
  creditNotes,
  debitNotes,
  chartOfAccounts,
  accountingPeriods,
  journalEntries,
  journalEntryLines,
  expenseRecords,
  voucherTemplates,
  financeAuditLogs,
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
    relationName: 'customerReferrer',
  }),
  referrals: many(customers, {
    relationName: 'customerReferrer',
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
  quotes: many(quotes),
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

export const productAttributeTemplatesRelations = relations(
  productAttributeTemplates,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [productAttributeTemplates.tenantId],
      references: [tenants.id],
    }),
  })
);

export const channelCategoriesRelations = relations(channelCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [channelCategories.tenantId],
    references: [tenants.id],
  }),
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [channels.tenantId],
    references: [tenants.id],
  }),
  // 多层级关系
  parent: one(channels, {
    fields: [channels.parentId],
    references: [channels.id],
    relationName: 'channelHierarchy',
  }),
  children: many(channels, {
    relationName: 'channelHierarchy',
  }),
  // 关联渠道类型
  channelCategory: one(channelCategories, {
    fields: [channels.categoryId],
    references: [channelCategories.id],
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
  payments: many(poPayments),
  shipments: many(poShipments),
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

export const poPaymentsRelations = relations(poPayments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [poPayments.tenantId],
    references: [tenants.id],
  }),
  po: one(purchaseOrders, {
    fields: [poPayments.poId],
    references: [purchaseOrders.id],
  }),
  creator: one(users, {
    fields: [poPayments.createdBy],
    references: [users.id],
  }),
}));

export const poShipmentsRelations = relations(poShipments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [poShipments.tenantId],
    references: [tenants.id],
  }),
  po: one(purchaseOrders, {
    fields: [poShipments.poId],
    references: [purchaseOrders.id],
  }),
  creator: one(users, {
    fields: [poShipments.createdBy],
    references: [users.id],
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
  bundle: one(quotes, {
    fields: [quotes.bundleId],
    references: [quotes.id],
    relationName: 'quoteBundle',
  }),
  subQuotes: many(quotes, {
    relationName: 'quoteBundle',
  }),
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

export const measureTaskSplitsRelations = relations(measureTaskSplits, ({ one }) => ({
  tenant: one(tenants, {
    fields: [measureTaskSplits.tenantId],
    references: [tenants.id],
  }),
  originalTask: one(measureTasks, {
    fields: [measureTaskSplits.originalTaskId],
    references: [measureTasks.id],
    relationName: 'measureTaskSplitOriginal',
  }),
  newTask: one(measureTasks, {
    fields: [measureTaskSplits.newTaskId],
    references: [measureTasks.id],
    relationName: 'measureTaskSplitNew',
  }),
  creator: one(users, {
    fields: [measureTaskSplits.createdBy],
    references: [users.id],
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

export const internalTransfersRelations = relations(internalTransfers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [internalTransfers.tenantId],
    references: [tenants.id],
  }),
  fromAccount: one(financeAccounts, {
    fields: [internalTransfers.fromAccountId],
    references: [financeAccounts.id],
    relationName: 'transferFromAccount',
  }),
  toAccount: one(financeAccounts, {
    fields: [internalTransfers.toAccountId],
    references: [financeAccounts.id],
    relationName: 'transferToAccount',
  }),
  createdByUser: one(users, {
    fields: [internalTransfers.createdBy],
    references: [users.id],
    relationName: 'transferCreator',
  }),
  approvedByUser: one(users, {
    fields: [internalTransfers.approvedBy],
    references: [users.id],
    relationName: 'transferApprover',
  }),
  fromTransaction: one(accountTransactions, {
    fields: [internalTransfers.fromTransactionId],
    references: [accountTransactions.id],
    relationName: 'transferFromTransaction',
  }),
  toTransaction: one(accountTransactions, {
    fields: [internalTransfers.toTransactionId],
    references: [accountTransactions.id],
    relationName: 'transferToTransaction',
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
  supplierStatement: one(apSupplierStatements, {
    fields: [paymentBillItems.statementId],
    references: [apSupplierStatements.id],
  }),
  laborStatement: one(apLaborStatements, {
    fields: [paymentBillItems.statementId],
    references: [apLaborStatements.id],
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

export const receiptBillsRelations = relations(receiptBills, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [receiptBills.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [receiptBills.customerId],
    references: [customers.id],
  }),
  account: one(financeAccounts, {
    fields: [receiptBills.accountId],
    references: [financeAccounts.id],
  }),
  createdBy: one(users, {
    fields: [receiptBills.createdBy],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [receiptBills.verifiedBy],
    references: [users.id],
  }),
  items: many(receiptBillItems),
}));

export const receiptBillItemsRelations = relations(receiptBillItems, ({ one }) => ({
  receiptBill: one(receiptBills, {
    fields: [receiptBillItems.receiptBillId],
    references: [receiptBills.id],
  }),
  order: one(orders, {
    fields: [receiptBillItems.orderId],
    references: [orders.id],
  }),
  statement: one(arStatements, {
    fields: [receiptBillItems.statementId],
    references: [arStatements.id],
  }),
  schedule: one(paymentSchedules, {
    fields: [receiptBillItems.scheduleId],
    references: [paymentSchedules.id],
  }),
}));

// 贷项通知单关系 (Credit Notes Relations)
export const creditNotesRelations = relations(creditNotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [creditNotes.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [creditNotes.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [creditNotes.orderId],
    references: [orders.id],
  }),
  arStatement: one(arStatements, {
    fields: [creditNotes.arStatementId],
    references: [arStatements.id],
  }),
  createdByUser: one(users, {
    fields: [creditNotes.createdBy],
    references: [users.id],
    relationName: 'creditNoteCreator',
  }),
  approvedByUser: one(users, {
    fields: [creditNotes.approvedBy],
    references: [users.id],
    relationName: 'creditNoteApprover',
  }),
}));

// 借项通知单关系 (Debit Notes Relations)
export const debitNotesRelations = relations(debitNotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [debitNotes.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [debitNotes.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [debitNotes.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  apStatement: one(apSupplierStatements, {
    fields: [debitNotes.apStatementId],
    references: [apSupplierStatements.id],
  }),
  createdByUser: one(users, {
    fields: [debitNotes.createdBy],
    references: [users.id],
    relationName: 'debitNoteCreator',
  }),
  approvedByUser: one(users, {
    fields: [debitNotes.approvedBy],
    references: [users.id],
    relationName: 'debitNoteApprover',
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

// ==================== 新增 Relations (Phase 1 整改) ====================

// === 线索模块 (Leads) ===
export const leadStatusHistoryRelations = relations(leadStatusHistory, ({ one }) => ({
  lead: one(leads, { fields: [leadStatusHistory.leadId], references: [leads.id] }),
  changedBy: one(users, { fields: [leadStatusHistory.changedBy], references: [users.id] }),
}));

// === 客户模块 (Customers) ===
export const phoneViewLogsRelations = relations(phoneViewLogs, ({ one }) => ({
  customer: one(customers, { fields: [phoneViewLogs.customerId], references: [customers.id] }),
  viewer: one(users, { fields: [phoneViewLogs.viewerId], references: [users.id] }),
}));

export const customerMergeLogsRelations = relations(customerMergeLogs, ({ one }) => ({
  primaryCustomer: one(customers, {
    fields: [customerMergeLogs.primaryCustomerId],
    references: [customers.id],
  }),
  operator: one(users, { fields: [customerMergeLogs.operatorId], references: [users.id] }),
}));

// === 渠道模块 (Channels) ===
export const channelCommissionsRelations = relations(channelCommissions, ({ one }) => ({
  channel: one(channels, { fields: [channelCommissions.channelId], references: [channels.id] }),
  settledBy: one(users, { fields: [channelCommissions.settledBy], references: [users.id] }),
}));

export const channelSettlementsRelations = relations(channelSettlements, ({ one }) => ({
  channel: one(channels, { fields: [channelSettlements.channelId], references: [channels.id] }),
  createdBy: one(users, { fields: [channelSettlements.createdBy], references: [users.id] }),
  approvedBy: one(users, { fields: [channelSettlements.approvedBy], references: [users.id] }),
}));

export const commissionAdjustmentsRelations = relations(commissionAdjustments, ({ one }) => ({
  channel: one(channels, { fields: [commissionAdjustments.channelId], references: [channels.id] }),
  originalCommission: one(channelCommissions, {
    fields: [commissionAdjustments.originalCommissionId],
    references: [channelCommissions.id],
  }),
}));

// === 产品模块 (Products) ===
export const productPriceHistoryRelations = relations(productPriceHistory, ({ one }) => ({
  product: one(products, { fields: [productPriceHistory.productId], references: [products.id] }),
  createdBy: one(users, { fields: [productPriceHistory.createdBy], references: [users.id] }),
}));

// === 订单模块 (Orders) ===
export const orderChangesRelations = relations(orderChanges, ({ one }) => ({
  order: one(orders, { fields: [orderChanges.orderId], references: [orders.id] }),
  requestedBy: one(users, { fields: [orderChanges.requestedBy], references: [users.id] }),
  approvedBy: one(users, { fields: [orderChanges.approvedBy], references: [users.id] }),
}));

// === 报价模块 (Quotes) ===
export const quotePlansRelations = relations(quotePlans, ({ one, many }) => ({
  tenant: one(tenants, { fields: [quotePlans.tenantId], references: [tenants.id] }),
  items: many(quotePlanItems),
}));

export const quotePlanItemsRelations = relations(quotePlanItems, ({ one }) => ({
  plan: one(quotePlans, { fields: [quotePlanItems.planId], references: [quotePlans.id] }),
}));

// === 供应链模块 (Supply Chain) ===
export const splitRouteRulesRelations = relations(splitRouteRules, ({ one }) => ({
  tenant: one(tenants, { fields: [splitRouteRules.tenantId], references: [tenants.id] }),
  createdBy: one(users, { fields: [splitRouteRules.createdBy], references: [users.id] }),
}));

export const channelSpecificPricesRelations = relations(channelSpecificPrices, ({ one }) => ({
  tenant: one(tenants, { fields: [channelSpecificPrices.tenantId], references: [tenants.id] }),
}));

export const productBundlesRelations = relations(productBundles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [productBundles.tenantId], references: [tenants.id] }),
  items: many(productBundleItems),
}));

export const productBundleItemsRelations = relations(productBundleItems, ({ one }) => ({
  bundle: one(productBundles, {
    fields: [productBundleItems.bundleId],
    references: [productBundles.id],
  }),
}));

export const productPackagesRelations = relations(productPackages, ({ one, many }) => ({
  tenant: one(tenants, { fields: [productPackages.tenantId], references: [tenants.id] }),
  products: many(packageProducts),
}));

export const packageProductsRelations = relations(packageProducts, ({ one }) => ({
  package: one(productPackages, {
    fields: [packageProducts.packageId],
    references: [productPackages.id],
  }),
}));

export const fabricInventoryRelations = relations(fabricInventory, ({ one, many }) => ({
  tenant: one(tenants, { fields: [fabricInventory.tenantId], references: [tenants.id] }),
  logs: many(fabricInventoryLogs),
}));

export const fabricInventoryLogsRelations = relations(fabricInventoryLogs, ({ one }) => ({
  inventory: one(fabricInventory, {
    fields: [fabricInventoryLogs.fabricInventoryId],
    references: [fabricInventory.id],
  }),
}));

// === 审批模块 (Approvals) ===
export const approvalDelegationsRelations = relations(approvalDelegations, ({ one }) => ({
  tenant: one(tenants, { fields: [approvalDelegations.tenantId], references: [tenants.id] }),
  delegator: one(users, { fields: [approvalDelegations.delegatorId], references: [users.id] }),
  delegatee: one(users, { fields: [approvalDelegations.delegateeId], references: [users.id] }),
  flow: one(approvalFlows, {
    fields: [approvalDelegations.flowId],
    references: [approvalFlows.id],
  }),
}));

// === 加工模块 (Processing) ===
export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [workOrders.tenantId], references: [tenants.id] }),
  order: one(orders, { fields: [workOrders.orderId], references: [orders.id] }),
  purchaseOrder: one(purchaseOrders, {
    fields: [workOrders.poId],
    references: [purchaseOrders.id],
  }),
  supplier: one(suppliers, { fields: [workOrders.supplierId], references: [suppliers.id] }),
  items: many(workOrderItems),
}));

export const workOrderItemsRelations = relations(workOrderItems, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderItems.woId], references: [workOrders.id] }),
  orderItem: one(orderItems, { fields: [workOrderItems.orderItemId], references: [orderItems.id] }),
}));

// === 库存模块 (Inventory) ===
export const warehousesRelations = relations(warehouses, ({ many }) => ({
  inventories: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  warehouse: one(warehouses, { fields: [inventory.warehouseId], references: [warehouses.id] }),
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  warehouse: one(warehouses, { fields: [inventoryLogs.warehouseId], references: [warehouses.id] }),
  product: one(products, { fields: [inventoryLogs.productId], references: [products.id] }),
  operator: one(users, { fields: [inventoryLogs.operatorId], references: [users.id] }),
}));

// === 通知模块 (Notifications) ===
export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, { fields: [notifications.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  tenant: one(tenants, { fields: [notificationPreferences.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

// === 忠诚度模块 (Loyalty) ===
export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  tenant: one(tenants, { fields: [loyaltyTransactions.tenantId], references: [tenants.id] }),
  customer: one(customers, {
    fields: [loyaltyTransactions.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, { fields: [loyaltyTransactions.createdBy], references: [users.id] }),
}));

// === 审计模块 (Audit) ===
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// === 报价配置模块 (Quote Config) ===
export const quoteConfigRelations = relations(quoteConfig, ({ one }) => ({
  updatedBy: one(users, { fields: [quoteConfig.updatedBy], references: [users.id] }),
}));

// === 劳务工费模块 (Labor Pricing) ===
export const laborRatesRelations = relations(laborRates, ({ one }) => ({
  tenant: one(tenants, { fields: [laborRates.tenantId], references: [tenants.id] }),
}));

// === 师傅技能模块 (Worker Skills) ===
export const workerSkillsRelations = relations(workerSkills, ({ one }) => ({
  tenant: one(tenants, { fields: [workerSkills.tenantId], references: [tenants.id] }),
  worker: one(users, { fields: [workerSkills.workerId], references: [users.id] }),
}));

// === 报价模板模块 (Quote Templates) ===
export const quoteTemplatesRelations = relations(quoteTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [quoteTemplates.tenantId], references: [tenants.id] }),
  creator: one(users, { fields: [quoteTemplates.createdBy], references: [users.id] }),
  sourceQuote: one(quotes, { fields: [quoteTemplates.sourceQuoteId], references: [quotes.id] }),
  rooms: many(quoteTemplateRooms),
  items: many(quoteTemplateItems),
}));

export const quoteTemplateRoomsRelations = relations(quoteTemplateRooms, ({ one, many }) => ({
  tenant: one(tenants, { fields: [quoteTemplateRooms.tenantId], references: [tenants.id] }),
  template: one(quoteTemplates, {
    fields: [quoteTemplateRooms.templateId],
    references: [quoteTemplates.id],
  }),
  items: many(quoteTemplateItems),
}));

export const quoteTemplateItemsRelations = relations(quoteTemplateItems, ({ one }) => ({
  tenant: one(tenants, { fields: [quoteTemplateItems.tenantId], references: [tenants.id] }),
  template: one(quoteTemplates, {
    fields: [quoteTemplateItems.templateId],
    references: [quoteTemplates.id],
  }),
  room: one(quoteTemplateRooms, {
    fields: [quoteTemplateItems.roomId],
    references: [quoteTemplateRooms.id],
  }),
  product: one(products, { fields: [quoteTemplateItems.productId], references: [products.id] }),
}));

// === 系统设置模块 (System Settings) ===
export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  tenant: one(tenants, { fields: [systemSettings.tenantId], references: [tenants.id] }),
  updater: one(users, { fields: [systemSettings.updatedBy], references: [users.id] }),
}));

export const systemSettingsHistoryRelations = relations(systemSettingsHistory, ({ one }) => ({
  tenant: one(tenants, { fields: [systemSettingsHistory.tenantId], references: [tenants.id] }),
  setting: one(systemSettings, {
    fields: [systemSettingsHistory.settingId],
    references: [systemSettings.id],
  }),
  changer: one(users, { fields: [systemSettingsHistory.changedBy], references: [users.id] }),
}));

// ==================== 会计模块关系 (Accounting Module Relations) ====================

// 会计科目关系
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  tenant: one(tenants, { fields: [chartOfAccounts.tenantId], references: [tenants.id] }),
  parent: one(chartOfAccounts, { fields: [chartOfAccounts.parentId], references: [chartOfAccounts.id], relationName: 'parentChild' }),
  children: many(chartOfAccounts, { relationName: 'parentChild' }),
  journalLines: many(journalEntryLines),
}));

// 账期关系
export const accountingPeriodsRelations = relations(accountingPeriods, ({ one, many }) => ({
  tenant: one(tenants, { fields: [accountingPeriods.tenantId], references: [tenants.id] }),
  closedByUser: one(users, { fields: [accountingPeriods.closedBy], references: [users.id] }),
  journalEntries: many(journalEntries),
}));

// 凭证主表关系
export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  tenant: one(tenants, { fields: [journalEntries.tenantId], references: [tenants.id] }),
  period: one(accountingPeriods, { fields: [journalEntries.periodId], references: [accountingPeriods.id] }),
  createdByUser: one(users, { fields: [journalEntries.createdBy], references: [users.id], relationName: 'journalCreator' }),
  reviewedByUser: one(users, { fields: [journalEntries.reviewedBy], references: [users.id], relationName: 'journalReviewer' }),
  reversedEntry: one(journalEntries, { fields: [journalEntries.reversedEntryId], references: [journalEntries.id], relationName: 'reversalPair' }),
  lines: many(journalEntryLines),
}));

// 凭证明细关系
export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  entry: one(journalEntries, { fields: [journalEntryLines.entryId], references: [journalEntries.id] }),
  account: one(chartOfAccounts, { fields: [journalEntryLines.accountId], references: [chartOfAccounts.id] }),
}));

// 费用录入关系
export const expenseRecordsRelations = relations(expenseRecords, ({ one }) => ({
  tenant: one(tenants, { fields: [expenseRecords.tenantId], references: [tenants.id] }),
  period: one(accountingPeriods, { fields: [expenseRecords.periodId], references: [accountingPeriods.id] }),
  account: one(chartOfAccounts, { fields: [expenseRecords.accountId], references: [chartOfAccounts.id] }),
  createdByUser: one(users, { fields: [expenseRecords.createdBy], references: [users.id] }),
}));

// 凭证模板关系
export const voucherTemplatesRelations = relations(voucherTemplates, ({ one }) => ({
  tenant: one(tenants, { fields: [voucherTemplates.tenantId], references: [tenants.id] }),
  debitAccount: one(chartOfAccounts, { fields: [voucherTemplates.debitAccountId], references: [chartOfAccounts.id], relationName: 'debitAccount' }),
  creditAccount: one(chartOfAccounts, { fields: [voucherTemplates.creditAccountId], references: [chartOfAccounts.id], relationName: 'creditAccount' }),
}));

// 财务审计日志关系
export const financeAuditLogsRelations = relations(financeAuditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [financeAuditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [financeAuditLogs.userId], references: [users.id] }),
}));
