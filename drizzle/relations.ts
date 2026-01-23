import { relations } from "drizzle-orm/relations";
import { tenants, sysDictionaries, users, marketChannels, productAttributeTemplates, productPriceHistory, products, suppliers, productTemplates, customers, phoneViewLogs, customerAddresses, leadActivities, leads, leadStatusHistory, channelCommissions, channels, channelSettlements, channelContacts, quoteItems, quotes, quoteRooms, channelCategories, commissionAdjustments, quoteTemplateItems, quoteTemplates, quoteTemplateRooms, quotePlans, orderChanges, orders, channelDiscountOverrides, paymentSchedules, channelSpecificPrices, productPackages, productBundleItems, productBundles, splitRouteRules, fabricInventory, workOrders, workOrderItems, orderItems, purchaseOrders, afterSalesTickets, fabricInventoryLogs, productSuppliers, productionTasks, purchaseOrderItems, measureItems, measureSheets, installPhotos, installTasks, measureTasks, approvals, accountTransactions, financeAccounts, measureTaskSplits, apLaborFeeDetails, apLaborStatements, installItems, creditNotes, arStatements, debitNotes, apSupplierStatements, financeConfigs, internalTransfers, paymentBillItems, paymentBills, paymentOrderItems, paymentOrders, commissionRecords, reconciliationDetails, reconciliations, statementConfirmationDetails, statementConfirmations, approvalDelegations, approvalFlows, approvalNodes, approvalTasks, receiptBillItems, receiptBills, liabilityNotices, auditLogs, notificationPreferences, notificationQueue, notificationTemplates, notifications, systemAnnouncements, loyaltyTransactions, workerSkills, systemSettings, systemSettingsHistory, quotePlanItems, packageProducts, quoteConfig, inventory, warehouses, inventoryLogs, verificationCodes, laborRates, roles, customerMergeLogs } from "./schema";

export const sysDictionariesRelations = relations(sysDictionaries, ({one}) => ({
	tenant: one(tenants, {
		fields: [sysDictionaries.tenantId],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	sysDictionaries: many(sysDictionaries),
	users: many(users),
	marketChannels: many(marketChannels),
	productAttributeTemplates: many(productAttributeTemplates),
	productPriceHistories: many(productPriceHistory),
	products: many(products),
	productTemplates: many(productTemplates),
	customers: many(customers),
	phoneViewLogs: many(phoneViewLogs),
	customerAddresses: many(customerAddresses),
	leadActivities: many(leadActivities),
	leadStatusHistories: many(leadStatusHistory),
	channelCommissions: many(channelCommissions),
	channelSettlements: many(channelSettlements),
	channelContacts: many(channelContacts),
	quoteItems: many(quoteItems),
	leads: many(leads),
	channels: many(channels),
	channelCategories: many(channelCategories),
	commissionAdjustments: many(commissionAdjustments),
	quoteTemplateItems: many(quoteTemplateItems),
	quoteTemplates: many(quoteTemplates),
	quoteTemplateRooms: many(quoteTemplateRooms),
	quoteRooms: many(quoteRooms),
	quotes: many(quotes),
	quotePlans: many(quotePlans),
	orderChanges: many(orderChanges),
	channelDiscountOverrides: many(channelDiscountOverrides),
	orders: many(orders),
	paymentSchedules: many(paymentSchedules),
	channelSpecificPrices: many(channelSpecificPrices),
	productPackages: many(productPackages),
	productBundleItems: many(productBundleItems),
	splitRouteRules: many(splitRouteRules),
	fabricInventories: many(fabricInventory),
	purchaseOrders: many(purchaseOrders),
	suppliers: many(suppliers),
	fabricInventoryLogs: many(fabricInventoryLogs),
	productBundles: many(productBundles),
	productSuppliers: many(productSuppliers),
	productionTasks: many(productionTasks),
	purchaseOrderItems: many(purchaseOrderItems),
	measureItems: many(measureItems),
	installPhotos: many(installPhotos),
	measureSheets: many(measureSheets),
	measureTasks: many(measureTasks),
	accountTransactions: many(accountTransactions),
	measureTaskSplits: many(measureTaskSplits),
	apLaborFeeDetails: many(apLaborFeeDetails),
	apLaborStatements: many(apLaborStatements),
	installItems: many(installItems),
	installTasks: many(installTasks),
	creditNotes: many(creditNotes),
	debitNotes: many(debitNotes),
	financeConfigs: many(financeConfigs),
	apSupplierStatements: many(apSupplierStatements),
	internalTransfers: many(internalTransfers),
	paymentBillItems: many(paymentBillItems),
	paymentOrderItems: many(paymentOrderItems),
	financeAccounts: many(financeAccounts),
	arStatements: many(arStatements),
	commissionRecords: many(commissionRecords),
	paymentBills: many(paymentBills),
	reconciliationDetails: many(reconciliationDetails),
	reconciliations: many(reconciliations),
	statementConfirmationDetails: many(statementConfirmationDetails),
	statementConfirmations: many(statementConfirmations),
	approvalDelegations: many(approvalDelegations),
	approvalFlows: many(approvalFlows),
	approvalNodes: many(approvalNodes),
	approvalTasks: many(approvalTasks),
	paymentOrders: many(paymentOrders),
	receiptBillItems: many(receiptBillItems),
	receiptBills: many(receiptBills),
	liabilityNotices: many(liabilityNotices),
	approvals: many(approvals),
	auditLogs: many(auditLogs),
	notificationPreferences: many(notificationPreferences),
	notificationQueues: many(notificationQueue),
	notificationTemplates: many(notificationTemplates),
	notifications: many(notifications),
	systemAnnouncements: many(systemAnnouncements),
	loyaltyTransactions: many(loyaltyTransactions),
	afterSalesTickets: many(afterSalesTickets),
	workerSkills: many(workerSkills),
	systemSettings: many(systemSettings),
	systemSettingsHistories: many(systemSettingsHistory),
	inventories: many(inventory),
	warehouses: many(warehouses),
	inventoryLogs: many(inventoryLogs),
	laborRates: many(laborRates),
	orderItems: many(orderItems),
	roles: many(roles),
	workOrders: many(workOrders),
	customerMergeLogs: many(customerMergeLogs),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id]
	}),
	marketChannels: many(marketChannels),
	productPriceHistories: many(productPriceHistory),
	products: many(products),
	customers_assignedSalesId: many(customers, {
		relationName: "customers_assignedSalesId_users_id"
	}),
	customers_createdBy: many(customers, {
		relationName: "customers_createdBy_users_id"
	}),
	customers_updatedBy: many(customers, {
		relationName: "customers_updatedBy_users_id"
	}),
	phoneViewLogs: many(phoneViewLogs),
	leadActivities: many(leadActivities),
	leadStatusHistories: many(leadStatusHistory),
	channelCommissions_settledBy: many(channelCommissions, {
		relationName: "channelCommissions_settledBy_users_id"
	}),
	channelCommissions_createdBy: many(channelCommissions, {
		relationName: "channelCommissions_createdBy_users_id"
	}),
	channelSettlements_createdBy: many(channelSettlements, {
		relationName: "channelSettlements_createdBy_users_id"
	}),
	channelSettlements_approvedBy: many(channelSettlements, {
		relationName: "channelSettlements_approvedBy_users_id"
	}),
	channelContacts: many(channelContacts),
	leads_assignedSalesId: many(leads, {
		relationName: "leads_assignedSalesId_users_id"
	}),
	leads_createdBy: many(leads, {
		relationName: "leads_createdBy_users_id"
	}),
	leads_updatedBy: many(leads, {
		relationName: "leads_updatedBy_users_id"
	}),
	channels_assignedManagerId: many(channels, {
		relationName: "channels_assignedManagerId_users_id"
	}),
	channels_createdBy: many(channels, {
		relationName: "channels_createdBy_users_id"
	}),
	commissionAdjustments: many(commissionAdjustments),
	quoteTemplates: many(quoteTemplates),
	quotes_approverId: many(quotes, {
		relationName: "quotes_approverId_users_id"
	}),
	quotes_createdBy: many(quotes, {
		relationName: "quotes_createdBy_users_id"
	}),
	quotes_updatedBy: many(quotes, {
		relationName: "quotes_updatedBy_users_id"
	}),
	orderChanges_requestedBy: many(orderChanges, {
		relationName: "orderChanges_requestedBy_users_id"
	}),
	orderChanges_approvedBy: many(orderChanges, {
		relationName: "orderChanges_approvedBy_users_id"
	}),
	orders_salesId: many(orders, {
		relationName: "orders_salesId_users_id"
	}),
	orders_createdBy: many(orders, {
		relationName: "orders_createdBy_users_id"
	}),
	orders_updatedBy: many(orders, {
		relationName: "orders_updatedBy_users_id"
	}),
	splitRouteRules: many(splitRouteRules),
	purchaseOrders: many(purchaseOrders),
	suppliers: many(suppliers),
	productionTasks: many(productionTasks),
	measureTasks: many(measureTasks),
	measureTaskSplits: many(measureTaskSplits),
	apLaborStatements_workerId: many(apLaborStatements, {
		relationName: "apLaborStatements_workerId_users_id"
	}),
	apLaborStatements_verifiedBy: many(apLaborStatements, {
		relationName: "apLaborStatements_verifiedBy_users_id"
	}),
	installTasks_salesId: many(installTasks, {
		relationName: "installTasks_salesId_users_id"
	}),
	installTasks_dispatcherId: many(installTasks, {
		relationName: "installTasks_dispatcherId_users_id"
	}),
	installTasks_installerId: many(installTasks, {
		relationName: "installTasks_installerId_users_id"
	}),
	installTasks_confirmedBy: many(installTasks, {
		relationName: "installTasks_confirmedBy_users_id"
	}),
	creditNotes_createdBy: many(creditNotes, {
		relationName: "creditNotes_createdBy_users_id"
	}),
	creditNotes_approvedBy: many(creditNotes, {
		relationName: "creditNotes_approvedBy_users_id"
	}),
	debitNotes_createdBy: many(debitNotes, {
		relationName: "debitNotes_createdBy_users_id"
	}),
	debitNotes_approvedBy: many(debitNotes, {
		relationName: "debitNotes_approvedBy_users_id"
	}),
	apSupplierStatements: many(apSupplierStatements),
	internalTransfers_createdBy: many(internalTransfers, {
		relationName: "internalTransfers_createdBy_users_id"
	}),
	internalTransfers_approvedBy: many(internalTransfers, {
		relationName: "internalTransfers_approvedBy_users_id"
	}),
	arStatements: many(arStatements),
	paymentBills_recordedBy: many(paymentBills, {
		relationName: "paymentBills_recordedBy_users_id"
	}),
	paymentBills_verifiedBy: many(paymentBills, {
		relationName: "paymentBills_verifiedBy_users_id"
	}),
	reconciliations: many(reconciliations),
	statementConfirmations: many(statementConfirmations),
	approvalDelegations_delegatorId: many(approvalDelegations, {
		relationName: "approvalDelegations_delegatorId_users_id"
	}),
	approvalDelegations_delegateeId: many(approvalDelegations, {
		relationName: "approvalDelegations_delegateeId_users_id"
	}),
	approvalNodes: many(approvalNodes),
	approvalTasks: many(approvalTasks),
	paymentOrders_createdBy: many(paymentOrders, {
		relationName: "paymentOrders_createdBy_users_id"
	}),
	paymentOrders_verifiedBy: many(paymentOrders, {
		relationName: "paymentOrders_verifiedBy_users_id"
	}),
	receiptBills_createdBy: many(receiptBills, {
		relationName: "receiptBills_createdBy_users_id"
	}),
	receiptBills_verifiedBy: many(receiptBills, {
		relationName: "receiptBills_verifiedBy_users_id"
	}),
	liabilityNotices_confirmedBy: many(liabilityNotices, {
		relationName: "liabilityNotices_confirmedBy_users_id"
	}),
	liabilityNotices_arbitratedBy: many(liabilityNotices, {
		relationName: "liabilityNotices_arbitratedBy_users_id"
	}),
	approvals: many(approvals),
	auditLogs: many(auditLogs),
	notificationPreferences: many(notificationPreferences),
	notificationQueues: many(notificationQueue),
	notifications: many(notifications),
	systemAnnouncements: many(systemAnnouncements),
	loyaltyTransactions: many(loyaltyTransactions),
	afterSalesTickets_assignedTo: many(afterSalesTickets, {
		relationName: "afterSalesTickets_assignedTo_users_id"
	}),
	afterSalesTickets_createdBy: many(afterSalesTickets, {
		relationName: "afterSalesTickets_createdBy_users_id"
	}),
	workerSkills: many(workerSkills),
	systemSettings: many(systemSettings),
	systemSettingsHistories: many(systemSettingsHistory),
	quoteConfigs: many(quoteConfig),
	warehouses: many(warehouses),
	inventoryLogs: many(inventoryLogs),
	verificationCodes: many(verificationCodes),
	workOrders: many(workOrders),
	customerMergeLogs: many(customerMergeLogs),
}));

export const marketChannelsRelations = relations(marketChannels, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [marketChannels.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [marketChannels.autoAssignSalesId],
		references: [users.id]
	}),
	leads_sourceChannelId: many(leads, {
		relationName: "leads_sourceChannelId_marketChannels_id"
	}),
	leads_sourceSubId: many(leads, {
		relationName: "leads_sourceSubId_marketChannels_id"
	}),
	arStatements: many(arStatements),
	commissionRecords: many(commissionRecords),
}));

export const productAttributeTemplatesRelations = relations(productAttributeTemplates, ({one}) => ({
	tenant: one(tenants, {
		fields: [productAttributeTemplates.tenantId],
		references: [tenants.id]
	}),
}));

export const productPriceHistoryRelations = relations(productPriceHistory, ({one}) => ({
	tenant: one(tenants, {
		fields: [productPriceHistory.tenantId],
		references: [tenants.id]
	}),
	product: one(products, {
		fields: [productPriceHistory.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [productPriceHistory.createdBy],
		references: [users.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	productPriceHistories: many(productPriceHistory),
	tenant: one(tenants, {
		fields: [products.tenantId],
		references: [tenants.id]
	}),
	supplier: one(suppliers, {
		fields: [products.defaultSupplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [products.createdBy],
		references: [users.id]
	}),
	quoteItems: many(quoteItems),
	quoteTemplateItems: many(quoteTemplateItems),
	inventories: many(inventory),
	inventoryLogs: many(inventoryLogs),
	orderItems: many(orderItems),
}));

export const suppliersRelations = relations(suppliers, ({one, many}) => ({
	products: many(products),
	splitRouteRules: many(splitRouteRules),
	purchaseOrders: many(purchaseOrders),
	tenant: one(tenants, {
		fields: [suppliers.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [suppliers.createdBy],
		references: [users.id]
	}),
	productSuppliers: many(productSuppliers),
	debitNotes: many(debitNotes),
	apSupplierStatements: many(apSupplierStatements),
	orderItems: many(orderItems),
	workOrders: many(workOrders),
}));

export const productTemplatesRelations = relations(productTemplates, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [productTemplates.tenantId],
		references: [tenants.id]
	}),
	quotePlanItems: many(quotePlanItems),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [customers.tenantId],
		references: [tenants.id]
	}),
	user_assignedSalesId: one(users, {
		fields: [customers.assignedSalesId],
		references: [users.id],
		relationName: "customers_assignedSalesId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [customers.createdBy],
		references: [users.id],
		relationName: "customers_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [customers.updatedBy],
		references: [users.id],
		relationName: "customers_updatedBy_users_id"
	}),
	phoneViewLogs: many(phoneViewLogs),
	customerAddresses: many(customerAddresses),
	leads_referrerCustomerId: many(leads, {
		relationName: "leads_referrerCustomerId_customers_id"
	}),
	leads_customerId: many(leads, {
		relationName: "leads_customerId_customers_id"
	}),
	quotes: many(quotes),
	orders: many(orders),
	measureTasks: many(measureTasks),
	installTasks: many(installTasks),
	creditNotes: many(creditNotes),
	arStatements: many(arStatements),
	paymentOrders: many(paymentOrders),
	receiptBills: many(receiptBills),
	loyaltyTransactions: many(loyaltyTransactions),
	afterSalesTickets: many(afterSalesTickets),
	customerMergeLogs: many(customerMergeLogs),
}));

export const phoneViewLogsRelations = relations(phoneViewLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [phoneViewLogs.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [phoneViewLogs.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [phoneViewLogs.viewerId],
		references: [users.id]
	}),
}));

export const customerAddressesRelations = relations(customerAddresses, ({one}) => ({
	tenant: one(tenants, {
		fields: [customerAddresses.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [customerAddresses.customerId],
		references: [customers.id]
	}),
}));

export const leadActivitiesRelations = relations(leadActivities, ({one}) => ({
	tenant: one(tenants, {
		fields: [leadActivities.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [leadActivities.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadActivities.createdBy],
		references: [users.id]
	}),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	leadActivities: many(leadActivities),
	leadStatusHistories: many(leadStatusHistory),
	tenant: one(tenants, {
		fields: [leads.tenantId],
		references: [tenants.id]
	}),
	channel: one(channels, {
		fields: [leads.channelId],
		references: [channels.id]
	}),
	channelContact: one(channelContacts, {
		fields: [leads.channelContactId],
		references: [channelContacts.id]
	}),
	marketChannel_sourceChannelId: one(marketChannels, {
		fields: [leads.sourceChannelId],
		references: [marketChannels.id],
		relationName: "leads_sourceChannelId_marketChannels_id"
	}),
	marketChannel_sourceSubId: one(marketChannels, {
		fields: [leads.sourceSubId],
		references: [marketChannels.id],
		relationName: "leads_sourceSubId_marketChannels_id"
	}),
	customer_referrerCustomerId: one(customers, {
		fields: [leads.referrerCustomerId],
		references: [customers.id],
		relationName: "leads_referrerCustomerId_customers_id"
	}),
	user_assignedSalesId: one(users, {
		fields: [leads.assignedSalesId],
		references: [users.id],
		relationName: "leads_assignedSalesId_users_id"
	}),
	customer_customerId: one(customers, {
		fields: [leads.customerId],
		references: [customers.id],
		relationName: "leads_customerId_customers_id"
	}),
	user_createdBy: one(users, {
		fields: [leads.createdBy],
		references: [users.id],
		relationName: "leads_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [leads.updatedBy],
		references: [users.id],
		relationName: "leads_updatedBy_users_id"
	}),
	orders: many(orders),
	measureTasks: many(measureTasks),
}));

export const leadStatusHistoryRelations = relations(leadStatusHistory, ({one}) => ({
	tenant: one(tenants, {
		fields: [leadStatusHistory.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [leadStatusHistory.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadStatusHistory.changedBy],
		references: [users.id]
	}),
}));

export const channelCommissionsRelations = relations(channelCommissions, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [channelCommissions.tenantId],
		references: [tenants.id]
	}),
	channel: one(channels, {
		fields: [channelCommissions.channelId],
		references: [channels.id]
	}),
	user_settledBy: one(users, {
		fields: [channelCommissions.settledBy],
		references: [users.id],
		relationName: "channelCommissions_settledBy_users_id"
	}),
	user_createdBy: one(users, {
		fields: [channelCommissions.createdBy],
		references: [users.id],
		relationName: "channelCommissions_createdBy_users_id"
	}),
	commissionAdjustments: many(commissionAdjustments),
}));

export const channelsRelations = relations(channels, ({one, many}) => ({
	channelCommissions: many(channelCommissions),
	channelSettlements: many(channelSettlements),
	channelContacts: many(channelContacts),
	leads: many(leads),
	tenant: one(tenants, {
		fields: [channels.tenantId],
		references: [tenants.id]
	}),
	channelCategory: one(channelCategories, {
		fields: [channels.categoryId],
		references: [channelCategories.id]
	}),
	user_assignedManagerId: one(users, {
		fields: [channels.assignedManagerId],
		references: [users.id],
		relationName: "channels_assignedManagerId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [channels.createdBy],
		references: [users.id],
		relationName: "channels_createdBy_users_id"
	}),
	commissionAdjustments: many(commissionAdjustments),
}));

export const channelSettlementsRelations = relations(channelSettlements, ({one}) => ({
	tenant: one(tenants, {
		fields: [channelSettlements.tenantId],
		references: [tenants.id]
	}),
	channel: one(channels, {
		fields: [channelSettlements.channelId],
		references: [channels.id]
	}),
	user_createdBy: one(users, {
		fields: [channelSettlements.createdBy],
		references: [users.id],
		relationName: "channelSettlements_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [channelSettlements.approvedBy],
		references: [users.id],
		relationName: "channelSettlements_approvedBy_users_id"
	}),
}));

export const channelContactsRelations = relations(channelContacts, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [channelContacts.tenantId],
		references: [tenants.id]
	}),
	channel: one(channels, {
		fields: [channelContacts.channelId],
		references: [channels.id]
	}),
	user: one(users, {
		fields: [channelContacts.createdBy],
		references: [users.id]
	}),
	leads: many(leads),
}));

export const quoteItemsRelations = relations(quoteItems, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [quoteItems.tenantId],
		references: [tenants.id]
	}),
	quote: one(quotes, {
		fields: [quoteItems.quoteId],
		references: [quotes.id]
	}),
	quoteRoom: one(quoteRooms, {
		fields: [quoteItems.roomId],
		references: [quoteRooms.id]
	}),
	product: one(products, {
		fields: [quoteItems.productId],
		references: [products.id]
	}),
	orderItems: many(orderItems),
}));

export const quotesRelations = relations(quotes, ({one, many}) => ({
	quoteItems: many(quoteItems),
	quoteRooms: many(quoteRooms),
	tenant: one(tenants, {
		fields: [quotes.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [quotes.customerId],
		references: [customers.id]
	}),
	user_approverId: one(users, {
		fields: [quotes.approverId],
		references: [users.id],
		relationName: "quotes_approverId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [quotes.createdBy],
		references: [users.id],
		relationName: "quotes_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [quotes.updatedBy],
		references: [users.id],
		relationName: "quotes_updatedBy_users_id"
	}),
	orders_quoteId: many(orders, {
		relationName: "orders_quoteId_quotes_id"
	}),
	orders_quoteVersionId: many(orders, {
		relationName: "orders_quoteVersionId_quotes_id"
	}),
}));

export const quoteRoomsRelations = relations(quoteRooms, ({one, many}) => ({
	quoteItems: many(quoteItems),
	tenant: one(tenants, {
		fields: [quoteRooms.tenantId],
		references: [tenants.id]
	}),
	quote: one(quotes, {
		fields: [quoteRooms.quoteId],
		references: [quotes.id]
	}),
}));

export const channelCategoriesRelations = relations(channelCategories, ({one, many}) => ({
	channels: many(channels),
	tenant: one(tenants, {
		fields: [channelCategories.tenantId],
		references: [tenants.id]
	}),
}));

export const commissionAdjustmentsRelations = relations(commissionAdjustments, ({one}) => ({
	tenant: one(tenants, {
		fields: [commissionAdjustments.tenantId],
		references: [tenants.id]
	}),
	channel: one(channels, {
		fields: [commissionAdjustments.channelId],
		references: [channels.id]
	}),
	channelCommission: one(channelCommissions, {
		fields: [commissionAdjustments.originalCommissionId],
		references: [channelCommissions.id]
	}),
	user: one(users, {
		fields: [commissionAdjustments.createdBy],
		references: [users.id]
	}),
}));

export const quoteTemplateItemsRelations = relations(quoteTemplateItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [quoteTemplateItems.tenantId],
		references: [tenants.id]
	}),
	quoteTemplate: one(quoteTemplates, {
		fields: [quoteTemplateItems.templateId],
		references: [quoteTemplates.id]
	}),
	quoteTemplateRoom: one(quoteTemplateRooms, {
		fields: [quoteTemplateItems.roomId],
		references: [quoteTemplateRooms.id]
	}),
	product: one(products, {
		fields: [quoteTemplateItems.productId],
		references: [products.id]
	}),
}));

export const quoteTemplatesRelations = relations(quoteTemplates, ({one, many}) => ({
	quoteTemplateItems: many(quoteTemplateItems),
	tenant: one(tenants, {
		fields: [quoteTemplates.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [quoteTemplates.createdBy],
		references: [users.id]
	}),
	quoteTemplateRooms: many(quoteTemplateRooms),
}));

export const quoteTemplateRoomsRelations = relations(quoteTemplateRooms, ({one, many}) => ({
	quoteTemplateItems: many(quoteTemplateItems),
	tenant: one(tenants, {
		fields: [quoteTemplateRooms.tenantId],
		references: [tenants.id]
	}),
	quoteTemplate: one(quoteTemplates, {
		fields: [quoteTemplateRooms.templateId],
		references: [quoteTemplates.id]
	}),
}));

export const quotePlansRelations = relations(quotePlans, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [quotePlans.tenantId],
		references: [tenants.id]
	}),
	quotePlanItems: many(quotePlanItems),
}));

export const orderChangesRelations = relations(orderChanges, ({one}) => ({
	tenant: one(tenants, {
		fields: [orderChanges.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [orderChanges.orderId],
		references: [orders.id]
	}),
	user_requestedBy: one(users, {
		fields: [orderChanges.requestedBy],
		references: [users.id],
		relationName: "orderChanges_requestedBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [orderChanges.approvedBy],
		references: [users.id],
		relationName: "orderChanges_approvedBy_users_id"
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderChanges: many(orderChanges),
	tenant: one(tenants, {
		fields: [orders.tenantId],
		references: [tenants.id]
	}),
	quote_quoteId: one(quotes, {
		fields: [orders.quoteId],
		references: [quotes.id],
		relationName: "orders_quoteId_quotes_id"
	}),
	quote_quoteVersionId: one(quotes, {
		fields: [orders.quoteVersionId],
		references: [quotes.id],
		relationName: "orders_quoteVersionId_quotes_id"
	}),
	lead: one(leads, {
		fields: [orders.leadId],
		references: [leads.id]
	}),
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id]
	}),
	user_salesId: one(users, {
		fields: [orders.salesId],
		references: [users.id],
		relationName: "orders_salesId_users_id"
	}),
	user_createdBy: one(users, {
		fields: [orders.createdBy],
		references: [users.id],
		relationName: "orders_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [orders.updatedBy],
		references: [users.id],
		relationName: "orders_updatedBy_users_id"
	}),
	paymentSchedules: many(paymentSchedules),
	purchaseOrders: many(purchaseOrders),
	productionTasks: many(productionTasks),
	installTasks: many(installTasks),
	creditNotes: many(creditNotes),
	paymentOrderItems: many(paymentOrderItems),
	arStatements: many(arStatements),
	commissionRecords: many(commissionRecords),
	receiptBillItems: many(receiptBillItems),
	afterSalesTickets: many(afterSalesTickets),
	orderItems: many(orderItems),
	workOrders: many(workOrders),
}));

export const channelDiscountOverridesRelations = relations(channelDiscountOverrides, ({one}) => ({
	tenant: one(tenants, {
		fields: [channelDiscountOverrides.tenantId],
		references: [tenants.id]
	}),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [paymentSchedules.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [paymentSchedules.orderId],
		references: [orders.id]
	}),
	paymentOrderItems: many(paymentOrderItems),
	receiptBillItems: many(receiptBillItems),
}));

export const channelSpecificPricesRelations = relations(channelSpecificPrices, ({one}) => ({
	tenant: one(tenants, {
		fields: [channelSpecificPrices.tenantId],
		references: [tenants.id]
	}),
}));

export const productPackagesRelations = relations(productPackages, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [productPackages.tenantId],
		references: [tenants.id]
	}),
	packageProducts: many(packageProducts),
}));

export const productBundleItemsRelations = relations(productBundleItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [productBundleItems.tenantId],
		references: [tenants.id]
	}),
	productBundle: one(productBundles, {
		fields: [productBundleItems.bundleId],
		references: [productBundles.id]
	}),
}));

export const productBundlesRelations = relations(productBundles, ({one, many}) => ({
	productBundleItems: many(productBundleItems),
	tenant: one(tenants, {
		fields: [productBundles.tenantId],
		references: [tenants.id]
	}),
}));

export const splitRouteRulesRelations = relations(splitRouteRules, ({one}) => ({
	tenant: one(tenants, {
		fields: [splitRouteRules.tenantId],
		references: [tenants.id]
	}),
	supplier: one(suppliers, {
		fields: [splitRouteRules.targetSupplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [splitRouteRules.createdBy],
		references: [users.id]
	}),
}));

export const fabricInventoryRelations = relations(fabricInventory, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [fabricInventory.tenantId],
		references: [tenants.id]
	}),
	fabricInventoryLogs: many(fabricInventoryLogs),
}));

export const workOrderItemsRelations = relations(workOrderItems, ({one}) => ({
	workOrder: one(workOrders, {
		fields: [workOrderItems.woId],
		references: [workOrders.id]
	}),
	orderItem: one(orderItems, {
		fields: [workOrderItems.orderItemId],
		references: [orderItems.id]
	}),
}));

export const workOrdersRelations = relations(workOrders, ({one, many}) => ({
	workOrderItems: many(workOrderItems),
	tenant: one(tenants, {
		fields: [workOrders.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [workOrders.orderId],
		references: [orders.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [workOrders.poId],
		references: [purchaseOrders.id]
	}),
	supplier: one(suppliers, {
		fields: [workOrders.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [workOrders.createdBy],
		references: [users.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one, many}) => ({
	workOrderItems: many(workOrderItems),
	purchaseOrderItems: many(purchaseOrderItems),
	tenant: one(tenants, {
		fields: [orderItems.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	quoteItem: one(quoteItems, {
		fields: [orderItems.quoteItemId],
		references: [quoteItems.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [orderItems.poId],
		references: [purchaseOrders.id]
	}),
	supplier: one(suppliers, {
		fields: [orderItems.supplierId],
		references: [suppliers.id]
	}),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [purchaseOrders.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [purchaseOrders.orderId],
		references: [orders.id]
	}),
	afterSalesTicket: one(afterSalesTickets, {
		fields: [purchaseOrders.afterSalesId],
		references: [afterSalesTickets.id]
	}),
	supplier: one(suppliers, {
		fields: [purchaseOrders.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [purchaseOrders.createdBy],
		references: [users.id]
	}),
	purchaseOrderItems: many(purchaseOrderItems),
	debitNotes: many(debitNotes),
	apSupplierStatements: many(apSupplierStatements),
	liabilityNotices: many(liabilityNotices),
	orderItems: many(orderItems),
	workOrders: many(workOrders),
}));

export const afterSalesTicketsRelations = relations(afterSalesTickets, ({one, many}) => ({
	purchaseOrders: many(purchaseOrders),
	installTasks: many(installTasks, {
		relationName: "installTasks_afterSalesId_afterSalesTickets_id"
	}),
	liabilityNotices: many(liabilityNotices),
	tenant: one(tenants, {
		fields: [afterSalesTickets.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [afterSalesTickets.orderId],
		references: [orders.id]
	}),
	customer: one(customers, {
		fields: [afterSalesTickets.customerId],
		references: [customers.id]
	}),
	installTask: one(installTasks, {
		fields: [afterSalesTickets.installTaskId],
		references: [installTasks.id],
		relationName: "afterSalesTickets_installTaskId_installTasks_id"
	}),
	user_assignedTo: one(users, {
		fields: [afterSalesTickets.assignedTo],
		references: [users.id],
		relationName: "afterSalesTickets_assignedTo_users_id"
	}),
	user_createdBy: one(users, {
		fields: [afterSalesTickets.createdBy],
		references: [users.id],
		relationName: "afterSalesTickets_createdBy_users_id"
	}),
}));

export const fabricInventoryLogsRelations = relations(fabricInventoryLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [fabricInventoryLogs.tenantId],
		references: [tenants.id]
	}),
	fabricInventory: one(fabricInventory, {
		fields: [fabricInventoryLogs.fabricInventoryId],
		references: [fabricInventory.id]
	}),
}));

export const productSuppliersRelations = relations(productSuppliers, ({one}) => ({
	tenant: one(tenants, {
		fields: [productSuppliers.tenantId],
		references: [tenants.id]
	}),
	supplier: one(suppliers, {
		fields: [productSuppliers.supplierId],
		references: [suppliers.id]
	}),
}));

export const productionTasksRelations = relations(productionTasks, ({one}) => ({
	tenant: one(tenants, {
		fields: [productionTasks.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [productionTasks.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [productionTasks.assignedWorkerId],
		references: [users.id]
	}),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [purchaseOrderItems.tenantId],
		references: [tenants.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [purchaseOrderItems.poId],
		references: [purchaseOrders.id]
	}),
	orderItem: one(orderItems, {
		fields: [purchaseOrderItems.orderItemId],
		references: [orderItems.id]
	}),
}));

export const measureItemsRelations = relations(measureItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [measureItems.tenantId],
		references: [tenants.id]
	}),
	measureSheet: one(measureSheets, {
		fields: [measureItems.sheetId],
		references: [measureSheets.id]
	}),
}));

export const measureSheetsRelations = relations(measureSheets, ({one, many}) => ({
	measureItems: many(measureItems),
	tenant: one(tenants, {
		fields: [measureSheets.tenantId],
		references: [tenants.id]
	}),
	measureTask: one(measureTasks, {
		fields: [measureSheets.taskId],
		references: [measureTasks.id]
	}),
}));

export const installPhotosRelations = relations(installPhotos, ({one}) => ({
	tenant: one(tenants, {
		fields: [installPhotos.tenantId],
		references: [tenants.id]
	}),
	installTask: one(installTasks, {
		fields: [installPhotos.installTaskId],
		references: [installTasks.id]
	}),
}));

export const installTasksRelations = relations(installTasks, ({one, many}) => ({
	installPhotos: many(installPhotos),
	apLaborFeeDetails: many(apLaborFeeDetails),
	installItems: many(installItems),
	tenant: one(tenants, {
		fields: [installTasks.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [installTasks.orderId],
		references: [orders.id]
	}),
	afterSalesTicket: one(afterSalesTickets, {
		fields: [installTasks.afterSalesId],
		references: [afterSalesTickets.id],
		relationName: "installTasks_afterSalesId_afterSalesTickets_id"
	}),
	customer: one(customers, {
		fields: [installTasks.customerId],
		references: [customers.id]
	}),
	user_salesId: one(users, {
		fields: [installTasks.salesId],
		references: [users.id],
		relationName: "installTasks_salesId_users_id"
	}),
	user_dispatcherId: one(users, {
		fields: [installTasks.dispatcherId],
		references: [users.id],
		relationName: "installTasks_dispatcherId_users_id"
	}),
	user_installerId: one(users, {
		fields: [installTasks.installerId],
		references: [users.id],
		relationName: "installTasks_installerId_users_id"
	}),
	user_confirmedBy: one(users, {
		fields: [installTasks.confirmedBy],
		references: [users.id],
		relationName: "installTasks_confirmedBy_users_id"
	}),
	liabilityNotices: many(liabilityNotices),
	afterSalesTickets: many(afterSalesTickets, {
		relationName: "afterSalesTickets_installTaskId_installTasks_id"
	}),
}));

export const measureTasksRelations = relations(measureTasks, ({one, many}) => ({
	measureSheets: many(measureSheets),
	tenant: one(tenants, {
		fields: [measureTasks.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [measureTasks.leadId],
		references: [leads.id]
	}),
	customer: one(customers, {
		fields: [measureTasks.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [measureTasks.assignedWorkerId],
		references: [users.id]
	}),
	measureTask: one(measureTasks, {
		fields: [measureTasks.parentId],
		references: [measureTasks.id],
		relationName: "measureTasks_parentId_measureTasks_id"
	}),
	measureTasks: many(measureTasks, {
		relationName: "measureTasks_parentId_measureTasks_id"
	}),
	approval: one(approvals, {
		fields: [measureTasks.feeApprovalId],
		references: [approvals.id]
	}),
	measureTaskSplits_originalTaskId: many(measureTaskSplits, {
		relationName: "measureTaskSplits_originalTaskId_measureTasks_id"
	}),
	measureTaskSplits_newTaskId: many(measureTaskSplits, {
		relationName: "measureTaskSplits_newTaskId_measureTasks_id"
	}),
}));

export const approvalsRelations = relations(approvals, ({one, many}) => ({
	measureTasks: many(measureTasks),
	approvalTasks: many(approvalTasks),
	tenant: one(tenants, {
		fields: [approvals.tenantId],
		references: [tenants.id]
	}),
	approvalFlow: one(approvalFlows, {
		fields: [approvals.flowId],
		references: [approvalFlows.id]
	}),
	user: one(users, {
		fields: [approvals.requesterId],
		references: [users.id]
	}),
	approvalNode: one(approvalNodes, {
		fields: [approvals.currentNodeId],
		references: [approvalNodes.id]
	}),
}));

export const accountTransactionsRelations = relations(accountTransactions, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [accountTransactions.tenantId],
		references: [tenants.id]
	}),
	financeAccount: one(financeAccounts, {
		fields: [accountTransactions.accountId],
		references: [financeAccounts.id]
	}),
	internalTransfers_fromTransactionId: many(internalTransfers, {
		relationName: "internalTransfers_fromTransactionId_accountTransactions_id"
	}),
	internalTransfers_toTransactionId: many(internalTransfers, {
		relationName: "internalTransfers_toTransactionId_accountTransactions_id"
	}),
}));

export const financeAccountsRelations = relations(financeAccounts, ({one, many}) => ({
	accountTransactions: many(accountTransactions),
	internalTransfers_fromAccountId: many(internalTransfers, {
		relationName: "internalTransfers_fromAccountId_financeAccounts_id"
	}),
	internalTransfers_toAccountId: many(internalTransfers, {
		relationName: "internalTransfers_toAccountId_financeAccounts_id"
	}),
	tenant: one(tenants, {
		fields: [financeAccounts.tenantId],
		references: [tenants.id]
	}),
	paymentBills: many(paymentBills),
	paymentOrders: many(paymentOrders),
	receiptBills: many(receiptBills),
}));

export const measureTaskSplitsRelations = relations(measureTaskSplits, ({one}) => ({
	tenant: one(tenants, {
		fields: [measureTaskSplits.tenantId],
		references: [tenants.id]
	}),
	measureTask_originalTaskId: one(measureTasks, {
		fields: [measureTaskSplits.originalTaskId],
		references: [measureTasks.id],
		relationName: "measureTaskSplits_originalTaskId_measureTasks_id"
	}),
	measureTask_newTaskId: one(measureTasks, {
		fields: [measureTaskSplits.newTaskId],
		references: [measureTasks.id],
		relationName: "measureTaskSplits_newTaskId_measureTasks_id"
	}),
	user: one(users, {
		fields: [measureTaskSplits.createdBy],
		references: [users.id]
	}),
}));

export const apLaborFeeDetailsRelations = relations(apLaborFeeDetails, ({one}) => ({
	tenant: one(tenants, {
		fields: [apLaborFeeDetails.tenantId],
		references: [tenants.id]
	}),
	apLaborStatement: one(apLaborStatements, {
		fields: [apLaborFeeDetails.statementId],
		references: [apLaborStatements.id]
	}),
	installTask: one(installTasks, {
		fields: [apLaborFeeDetails.installTaskId],
		references: [installTasks.id]
	}),
}));

export const apLaborStatementsRelations = relations(apLaborStatements, ({one, many}) => ({
	apLaborFeeDetails: many(apLaborFeeDetails),
	tenant: one(tenants, {
		fields: [apLaborStatements.tenantId],
		references: [tenants.id]
	}),
	user_workerId: one(users, {
		fields: [apLaborStatements.workerId],
		references: [users.id],
		relationName: "apLaborStatements_workerId_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [apLaborStatements.verifiedBy],
		references: [users.id],
		relationName: "apLaborStatements_verifiedBy_users_id"
	}),
}));

export const installItemsRelations = relations(installItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [installItems.tenantId],
		references: [tenants.id]
	}),
	installTask: one(installTasks, {
		fields: [installItems.installTaskId],
		references: [installTasks.id]
	}),
}));

export const creditNotesRelations = relations(creditNotes, ({one}) => ({
	tenant: one(tenants, {
		fields: [creditNotes.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [creditNotes.customerId],
		references: [customers.id]
	}),
	order: one(orders, {
		fields: [creditNotes.orderId],
		references: [orders.id]
	}),
	arStatement: one(arStatements, {
		fields: [creditNotes.arStatementId],
		references: [arStatements.id]
	}),
	user_createdBy: one(users, {
		fields: [creditNotes.createdBy],
		references: [users.id],
		relationName: "creditNotes_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [creditNotes.approvedBy],
		references: [users.id],
		relationName: "creditNotes_approvedBy_users_id"
	}),
}));

export const arStatementsRelations = relations(arStatements, ({one, many}) => ({
	creditNotes: many(creditNotes),
	paymentOrderItems: many(paymentOrderItems),
	tenant: one(tenants, {
		fields: [arStatements.tenantId],
		references: [tenants.id]
	}),
	order: one(orders, {
		fields: [arStatements.orderId],
		references: [orders.id]
	}),
	customer: one(customers, {
		fields: [arStatements.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [arStatements.salesId],
		references: [users.id]
	}),
	marketChannel: one(marketChannels, {
		fields: [arStatements.channelId],
		references: [marketChannels.id]
	}),
	commissionRecords: many(commissionRecords),
	receiptBillItems: many(receiptBillItems),
}));

export const debitNotesRelations = relations(debitNotes, ({one}) => ({
	tenant: one(tenants, {
		fields: [debitNotes.tenantId],
		references: [tenants.id]
	}),
	supplier: one(suppliers, {
		fields: [debitNotes.supplierId],
		references: [suppliers.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [debitNotes.purchaseOrderId],
		references: [purchaseOrders.id]
	}),
	apSupplierStatement: one(apSupplierStatements, {
		fields: [debitNotes.apStatementId],
		references: [apSupplierStatements.id]
	}),
	user_createdBy: one(users, {
		fields: [debitNotes.createdBy],
		references: [users.id],
		relationName: "debitNotes_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [debitNotes.approvedBy],
		references: [users.id],
		relationName: "debitNotes_approvedBy_users_id"
	}),
}));

export const apSupplierStatementsRelations = relations(apSupplierStatements, ({one, many}) => ({
	debitNotes: many(debitNotes),
	tenant: one(tenants, {
		fields: [apSupplierStatements.tenantId],
		references: [tenants.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [apSupplierStatements.purchaseOrderId],
		references: [purchaseOrders.id]
	}),
	supplier: one(suppliers, {
		fields: [apSupplierStatements.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [apSupplierStatements.purchaserId],
		references: [users.id]
	}),
}));

export const financeConfigsRelations = relations(financeConfigs, ({one}) => ({
	tenant: one(tenants, {
		fields: [financeConfigs.tenantId],
		references: [tenants.id]
	}),
}));

export const internalTransfersRelations = relations(internalTransfers, ({one}) => ({
	tenant: one(tenants, {
		fields: [internalTransfers.tenantId],
		references: [tenants.id]
	}),
	financeAccount_fromAccountId: one(financeAccounts, {
		fields: [internalTransfers.fromAccountId],
		references: [financeAccounts.id],
		relationName: "internalTransfers_fromAccountId_financeAccounts_id"
	}),
	financeAccount_toAccountId: one(financeAccounts, {
		fields: [internalTransfers.toAccountId],
		references: [financeAccounts.id],
		relationName: "internalTransfers_toAccountId_financeAccounts_id"
	}),
	accountTransaction_fromTransactionId: one(accountTransactions, {
		fields: [internalTransfers.fromTransactionId],
		references: [accountTransactions.id],
		relationName: "internalTransfers_fromTransactionId_accountTransactions_id"
	}),
	accountTransaction_toTransactionId: one(accountTransactions, {
		fields: [internalTransfers.toTransactionId],
		references: [accountTransactions.id],
		relationName: "internalTransfers_toTransactionId_accountTransactions_id"
	}),
	user_createdBy: one(users, {
		fields: [internalTransfers.createdBy],
		references: [users.id],
		relationName: "internalTransfers_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [internalTransfers.approvedBy],
		references: [users.id],
		relationName: "internalTransfers_approvedBy_users_id"
	}),
}));

export const paymentBillItemsRelations = relations(paymentBillItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [paymentBillItems.tenantId],
		references: [tenants.id]
	}),
	paymentBill: one(paymentBills, {
		fields: [paymentBillItems.paymentBillId],
		references: [paymentBills.id]
	}),
}));

export const paymentBillsRelations = relations(paymentBills, ({one, many}) => ({
	paymentBillItems: many(paymentBillItems),
	tenant: one(tenants, {
		fields: [paymentBills.tenantId],
		references: [tenants.id]
	}),
	financeAccount: one(financeAccounts, {
		fields: [paymentBills.accountId],
		references: [financeAccounts.id]
	}),
	user_recordedBy: one(users, {
		fields: [paymentBills.recordedBy],
		references: [users.id],
		relationName: "paymentBills_recordedBy_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [paymentBills.verifiedBy],
		references: [users.id],
		relationName: "paymentBills_verifiedBy_users_id"
	}),
}));

export const paymentOrderItemsRelations = relations(paymentOrderItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [paymentOrderItems.tenantId],
		references: [tenants.id]
	}),
	paymentOrder: one(paymentOrders, {
		fields: [paymentOrderItems.paymentOrderId],
		references: [paymentOrders.id]
	}),
	order: one(orders, {
		fields: [paymentOrderItems.orderId],
		references: [orders.id]
	}),
	arStatement: one(arStatements, {
		fields: [paymentOrderItems.statementId],
		references: [arStatements.id]
	}),
	paymentSchedule: one(paymentSchedules, {
		fields: [paymentOrderItems.scheduleId],
		references: [paymentSchedules.id]
	}),
}));

export const paymentOrdersRelations = relations(paymentOrders, ({one, many}) => ({
	paymentOrderItems: many(paymentOrderItems),
	tenant: one(tenants, {
		fields: [paymentOrders.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [paymentOrders.customerId],
		references: [customers.id]
	}),
	financeAccount: one(financeAccounts, {
		fields: [paymentOrders.accountId],
		references: [financeAccounts.id]
	}),
	user_createdBy: one(users, {
		fields: [paymentOrders.createdBy],
		references: [users.id],
		relationName: "paymentOrders_createdBy_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [paymentOrders.verifiedBy],
		references: [users.id],
		relationName: "paymentOrders_verifiedBy_users_id"
	}),
}));

export const commissionRecordsRelations = relations(commissionRecords, ({one}) => ({
	tenant: one(tenants, {
		fields: [commissionRecords.tenantId],
		references: [tenants.id]
	}),
	arStatement: one(arStatements, {
		fields: [commissionRecords.arStatementId],
		references: [arStatements.id]
	}),
	order: one(orders, {
		fields: [commissionRecords.orderId],
		references: [orders.id]
	}),
	marketChannel: one(marketChannels, {
		fields: [commissionRecords.channelId],
		references: [marketChannels.id]
	}),
}));

export const reconciliationDetailsRelations = relations(reconciliationDetails, ({one}) => ({
	tenant: one(tenants, {
		fields: [reconciliationDetails.tenantId],
		references: [tenants.id]
	}),
	reconciliation: one(reconciliations, {
		fields: [reconciliationDetails.reconciliationId],
		references: [reconciliations.id]
	}),
}));

export const reconciliationsRelations = relations(reconciliations, ({one, many}) => ({
	reconciliationDetails: many(reconciliationDetails),
	tenant: one(tenants, {
		fields: [reconciliations.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [reconciliations.confirmedBy],
		references: [users.id]
	}),
}));

export const statementConfirmationDetailsRelations = relations(statementConfirmationDetails, ({one}) => ({
	tenant: one(tenants, {
		fields: [statementConfirmationDetails.tenantId],
		references: [tenants.id]
	}),
	statementConfirmation: one(statementConfirmations, {
		fields: [statementConfirmationDetails.confirmationId],
		references: [statementConfirmations.id]
	}),
}));

export const statementConfirmationsRelations = relations(statementConfirmations, ({one, many}) => ({
	statementConfirmationDetails: many(statementConfirmationDetails),
	tenant: one(tenants, {
		fields: [statementConfirmations.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [statementConfirmations.createdBy],
		references: [users.id]
	}),
}));

export const approvalDelegationsRelations = relations(approvalDelegations, ({one}) => ({
	tenant: one(tenants, {
		fields: [approvalDelegations.tenantId],
		references: [tenants.id]
	}),
	user_delegatorId: one(users, {
		fields: [approvalDelegations.delegatorId],
		references: [users.id],
		relationName: "approvalDelegations_delegatorId_users_id"
	}),
	user_delegateeId: one(users, {
		fields: [approvalDelegations.delegateeId],
		references: [users.id],
		relationName: "approvalDelegations_delegateeId_users_id"
	}),
	approvalFlow: one(approvalFlows, {
		fields: [approvalDelegations.flowId],
		references: [approvalFlows.id]
	}),
}));

export const approvalFlowsRelations = relations(approvalFlows, ({one, many}) => ({
	approvalDelegations: many(approvalDelegations),
	tenant: one(tenants, {
		fields: [approvalFlows.tenantId],
		references: [tenants.id]
	}),
	approvalNodes: many(approvalNodes),
	approvals: many(approvals),
}));

export const approvalNodesRelations = relations(approvalNodes, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [approvalNodes.tenantId],
		references: [tenants.id]
	}),
	approvalFlow: one(approvalFlows, {
		fields: [approvalNodes.flowId],
		references: [approvalFlows.id]
	}),
	user: one(users, {
		fields: [approvalNodes.approverUserId],
		references: [users.id]
	}),
	approvalTasks: many(approvalTasks),
	approvals: many(approvals),
}));

export const approvalTasksRelations = relations(approvalTasks, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [approvalTasks.tenantId],
		references: [tenants.id]
	}),
	approval: one(approvals, {
		fields: [approvalTasks.approvalId],
		references: [approvals.id]
	}),
	approvalNode: one(approvalNodes, {
		fields: [approvalTasks.nodeId],
		references: [approvalNodes.id]
	}),
	user: one(users, {
		fields: [approvalTasks.approverId],
		references: [users.id]
	}),
	approvalTask: one(approvalTasks, {
		fields: [approvalTasks.parentTaskId],
		references: [approvalTasks.id],
		relationName: "approvalTasks_parentTaskId_approvalTasks_id"
	}),
	approvalTasks: many(approvalTasks, {
		relationName: "approvalTasks_parentTaskId_approvalTasks_id"
	}),
}));

export const receiptBillItemsRelations = relations(receiptBillItems, ({one}) => ({
	tenant: one(tenants, {
		fields: [receiptBillItems.tenantId],
		references: [tenants.id]
	}),
	receiptBill: one(receiptBills, {
		fields: [receiptBillItems.receiptBillId],
		references: [receiptBills.id]
	}),
	order: one(orders, {
		fields: [receiptBillItems.orderId],
		references: [orders.id]
	}),
	arStatement: one(arStatements, {
		fields: [receiptBillItems.statementId],
		references: [arStatements.id]
	}),
	paymentSchedule: one(paymentSchedules, {
		fields: [receiptBillItems.scheduleId],
		references: [paymentSchedules.id]
	}),
}));

export const receiptBillsRelations = relations(receiptBills, ({one, many}) => ({
	receiptBillItems: many(receiptBillItems),
	tenant: one(tenants, {
		fields: [receiptBills.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [receiptBills.customerId],
		references: [customers.id]
	}),
	financeAccount: one(financeAccounts, {
		fields: [receiptBills.accountId],
		references: [financeAccounts.id]
	}),
	user_createdBy: one(users, {
		fields: [receiptBills.createdBy],
		references: [users.id],
		relationName: "receiptBills_createdBy_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [receiptBills.verifiedBy],
		references: [users.id],
		relationName: "receiptBills_verifiedBy_users_id"
	}),
}));

export const liabilityNoticesRelations = relations(liabilityNotices, ({one}) => ({
	tenant: one(tenants, {
		fields: [liabilityNotices.tenantId],
		references: [tenants.id]
	}),
	afterSalesTicket: one(afterSalesTickets, {
		fields: [liabilityNotices.afterSalesId],
		references: [afterSalesTickets.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [liabilityNotices.sourcePurchaseOrderId],
		references: [purchaseOrders.id]
	}),
	installTask: one(installTasks, {
		fields: [liabilityNotices.sourceInstallTaskId],
		references: [installTasks.id]
	}),
	user_confirmedBy: one(users, {
		fields: [liabilityNotices.confirmedBy],
		references: [users.id],
		relationName: "liabilityNotices_confirmedBy_users_id"
	}),
	user_arbitratedBy: one(users, {
		fields: [liabilityNotices.arbitratedBy],
		references: [users.id],
		relationName: "liabilityNotices_arbitratedBy_users_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [auditLogs.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	tenant: one(tenants, {
		fields: [notificationPreferences.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
	}),
}));

export const notificationQueueRelations = relations(notificationQueue, ({one}) => ({
	tenant: one(tenants, {
		fields: [notificationQueue.tenantId],
		references: [tenants.id]
	}),
	notificationTemplate: one(notificationTemplates, {
		fields: [notificationQueue.templateId],
		references: [notificationTemplates.id]
	}),
	user: one(users, {
		fields: [notificationQueue.userId],
		references: [users.id]
	}),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({one, many}) => ({
	notificationQueues: many(notificationQueue),
	tenant: one(tenants, {
		fields: [notificationTemplates.tenantId],
		references: [tenants.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	tenant: one(tenants, {
		fields: [notifications.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const systemAnnouncementsRelations = relations(systemAnnouncements, ({one}) => ({
	tenant: one(tenants, {
		fields: [systemAnnouncements.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [systemAnnouncements.createdBy],
		references: [users.id]
	}),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({one}) => ({
	tenant: one(tenants, {
		fields: [loyaltyTransactions.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [loyaltyTransactions.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [loyaltyTransactions.createdBy],
		references: [users.id]
	}),
}));

export const workerSkillsRelations = relations(workerSkills, ({one}) => ({
	tenant: one(tenants, {
		fields: [workerSkills.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [workerSkills.workerId],
		references: [users.id]
	}),
}));

export const systemSettingsRelations = relations(systemSettings, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [systemSettings.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [systemSettings.updatedBy],
		references: [users.id]
	}),
	systemSettingsHistories: many(systemSettingsHistory),
}));

export const systemSettingsHistoryRelations = relations(systemSettingsHistory, ({one}) => ({
	tenant: one(tenants, {
		fields: [systemSettingsHistory.tenantId],
		references: [tenants.id]
	}),
	systemSetting: one(systemSettings, {
		fields: [systemSettingsHistory.settingId],
		references: [systemSettings.id]
	}),
	user: one(users, {
		fields: [systemSettingsHistory.changedBy],
		references: [users.id]
	}),
}));

export const quotePlanItemsRelations = relations(quotePlanItems, ({one}) => ({
	quotePlan: one(quotePlans, {
		fields: [quotePlanItems.planId],
		references: [quotePlans.id]
	}),
	productTemplate: one(productTemplates, {
		fields: [quotePlanItems.templateId],
		references: [productTemplates.id]
	}),
}));

export const packageProductsRelations = relations(packageProducts, ({one}) => ({
	productPackage: one(productPackages, {
		fields: [packageProducts.packageId],
		references: [productPackages.id]
	}),
}));

export const quoteConfigRelations = relations(quoteConfig, ({one}) => ({
	user: one(users, {
		fields: [quoteConfig.updatedBy],
		references: [users.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	tenant: one(tenants, {
		fields: [inventory.tenantId],
		references: [tenants.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventory.warehouseId],
		references: [warehouses.id]
	}),
	product: one(products, {
		fields: [inventory.productId],
		references: [products.id]
	}),
}));

export const warehousesRelations = relations(warehouses, ({one, many}) => ({
	inventories: many(inventory),
	tenant: one(tenants, {
		fields: [warehouses.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [warehouses.managerId],
		references: [users.id]
	}),
	inventoryLogs: many(inventoryLogs),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [inventoryLogs.tenantId],
		references: [tenants.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventoryLogs.warehouseId],
		references: [warehouses.id]
	}),
	product: one(products, {
		fields: [inventoryLogs.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [inventoryLogs.operatorId],
		references: [users.id]
	}),
}));

export const verificationCodesRelations = relations(verificationCodes, ({one}) => ({
	user: one(users, {
		fields: [verificationCodes.userId],
		references: [users.id]
	}),
}));

export const laborRatesRelations = relations(laborRates, ({one}) => ({
	tenant: one(tenants, {
		fields: [laborRates.tenantId],
		references: [tenants.id]
	}),
}));

export const rolesRelations = relations(roles, ({one}) => ({
	tenant: one(tenants, {
		fields: [roles.tenantId],
		references: [tenants.id]
	}),
}));

export const customerMergeLogsRelations = relations(customerMergeLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [customerMergeLogs.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [customerMergeLogs.primaryCustomerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [customerMergeLogs.operatorId],
		references: [users.id]
	}),
}));