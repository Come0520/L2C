import { pgTable, foreignKey, pgPolicy, uuid, varchar, text, boolean, timestamp, unique, jsonb, index, integer, numeric, uniqueIndex, date, type AnyPgColumn, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const afterSalesStatus = pgEnum("after_sales_status", ['PENDING', 'INVESTIGATING', 'PROCESSING', 'PENDING_VISIT', 'PENDING_CALLBACK', 'PENDING_VERIFY', 'CLOSED', 'REJECTED'])
export const approvalNodeMode = pgEnum("approval_node_mode", ['ANY', 'ALL', 'MAJORITY'])
export const approvalTimeoutAction = pgEnum("approval_timeout_action", ['REMIND', 'AUTO_PASS', 'AUTO_REJECT'])
export const approverRole = pgEnum("approver_role", ['STORE_MANAGER', 'ADMIN', 'FINANCE', 'PURCHASING', 'DISPATCHER'])
export const arStatementStatus = pgEnum("ar_statement_status", ['PENDING_RECON', 'RECONCILED', 'INVOICED', 'PARTIAL', 'PAID', 'PENDING_DELIVER', 'COMPLETED', 'BAD_DEBT'])
export const billStatus = pgEnum("bill_status", ['DRAFT', 'PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'])
export const changeRequestStatus = pgEnum("change_request_status", ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'])
export const changeRequestType = pgEnum("change_request_type", ['FIELD_CHANGE', 'CUSTOMER_CHANGE', 'STOCK_OUT', 'OTHER'])
export const channelCategory = pgEnum("channel_category", ['ONLINE', 'OFFLINE', 'REFERRAL'])
export const channelLevel = pgEnum("channel_level", ['S', 'A', 'B', 'C'])
export const channelSettlementType = pgEnum("channel_settlement_type", ['PREPAY', 'MONTHLY'])
export const channelStatus = pgEnum("channel_status", ['ACTIVE', 'SUSPENDED', 'TERMINATED'])
export const channelType = pgEnum("channel_type", ['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY', 'DOUYIN', 'XIAOHONGSHU', 'STORE', 'OTHER'])
export const commissionStatus = pgEnum("commission_status", ['PENDING', 'CALCULATED', 'PAID'])
export const commissionType = pgEnum("commission_type", ['FIXED', 'TIERED'])
export const cooperationMode = pgEnum("cooperation_mode", ['BASE_PRICE', 'COMMISSION'])
export const customerLevel = pgEnum("customer_level", ['A', 'B', 'C', 'D'])
export const customerLifecycleStage = pgEnum("customer_lifecycle_stage", ['LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST'])
export const customerPipelineStatus = pgEnum("customer_pipeline_status", ['UNASSIGNED', 'PENDING_FOLLOWUP', 'PENDING_MEASUREMENT', 'PENDING_QUOTE', 'QUOTE_SENT', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'])
export const customerType = pgEnum("customer_type", ['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER'])
export const decorationProgress = pgEnum("decoration_progress", ['WATER_ELECTRIC', 'MUD_WOOD', 'INSTALLATION', 'PAINTING', 'COMPLETED'])
export const delegationType = pgEnum("delegation_type", ['GLOBAL', 'FLOW'])
export const fabricInventoryLogType = pgEnum("fabric_inventory_log_type", ['PURCHASE_IN', 'PROCESSING_OUT', 'ADJUSTMENT', 'RETURN'])
export const feeCheckStatus = pgEnum("fee_check_status", ['NONE', 'PENDING', 'PAID', 'WAIVED', 'REFUNDED'])
export const headerProcessType = pgEnum("header_process_type", ['HOOK', 'PUNCH', 'FIXED_PLEAT'])
export const installItemIssueCategory = pgEnum("install_item_issue_category", ['NONE', 'MISSING', 'DAMAGED', 'WRONG_SIZE'])
export const installPhotoType = pgEnum("install_photo_type", ['BEFORE', 'AFTER', 'DETAIL'])
export const installTaskCategory = pgEnum("install_task_category", ['CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'OTHER'])
export const installTaskSourceType = pgEnum("install_task_source_type", ['ORDER', 'AFTER_SALES', 'REWORK'])
export const installTaskStatus = pgEnum("install_task_status", ['PENDING_DISPATCH', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED'])
export const installType = pgEnum("install_type", ['TOP', 'SIDE'])
export const intentionLevel = pgEnum("intention_level", ['HIGH', 'MEDIUM', 'LOW'])
export const inventoryLogType = pgEnum("inventory_log_type", ['IN', 'OUT', 'ADJUST', 'TRANSFER'])
export const laborCategory = pgEnum("labor_category", ['CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'WALLPANEL', 'MEASURE_LEAD', 'MEASURE_PRECISE', 'OTHER'])
export const laborRateEntityType = pgEnum("labor_rate_entity_type", ['TENANT', 'WORKER'])
export const laborUnitType = pgEnum("labor_unit_type", ['WINDOW', 'SQUARE_METER', 'FIXED'])
export const leadActivityType = pgEnum("lead_activity_type", ['PHONE_CALL', 'WECHAT_CHAT', 'STORE_VISIT', 'HOME_VISIT', 'QUOTE_SENT', 'SYSTEM'])
export const leadStatus = pgEnum("lead_status", ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP', 'INVALID', 'WON', 'VOID'])
export const liabilityReasonCategory = pgEnum("liability_reason_category", ['PRODUCTION_QUALITY', 'CONSTRUCTION_ERROR', 'DATA_ERROR', 'SALES_ERROR', 'LOGISTICS_ISSUE', 'CUSTOMER_REASON'])
export const liabilityStatus = pgEnum("liability_status", ['DRAFT', 'PENDING_CONFIRM', 'CONFIRMED', 'DISPUTED', 'ARBITRATED'])
export const liablePartyType = pgEnum("liable_party_type", ['COMPANY', 'FACTORY', 'INSTALLER', 'MEASURER', 'LOGISTICS', 'CUSTOMER'])
export const measureSheetStatus = pgEnum("measure_sheet_status", ['DRAFT', 'CONFIRMED', 'ARCHIVED'])
export const measureTaskStatus = pgEnum("measure_task_status", ['PENDING_APPROVAL', 'PENDING', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED'])
export const measureType = pgEnum("measure_type", ['QUOTE_BASED', 'BLIND', 'SALES_SELF'])
export const notificationChannel = pgEnum("notification_channel", ['IN_APP', 'EMAIL', 'SMS', 'WECHAT', 'WECHAT_MINI', 'LARK', 'SYSTEM'])
export const notificationTypeEnum = pgEnum("notification_type_enum", ['SYSTEM', 'ORDER_STATUS', 'APPROVAL', 'ALERT', 'MENTION', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'])
export const orderItemStatus = pgEnum("order_item_status", ['PENDING', 'PROCESSING', 'PO_CONFIRMED', 'PRODUCED', 'SHIPPED', 'DELIVERED', 'INSTALLED', 'COMPLETED', 'CANCELLED'])
export const orderSettlementType = pgEnum("order_settlement_type", ['PREPAID', 'CREDIT', 'CASH'])
export const orderStatus = pgEnum("order_status", ['DRAFT', 'PENDING_MEASURE', 'MEASURED', 'QUOTED', 'SIGNED', 'PAID', 'PENDING_PO', 'PENDING_PRODUCTION', 'IN_PRODUCTION', 'PAUSED', 'HALTED', 'PENDING_APPROVAL', 'PENDING_DELIVERY', 'PENDING_INSTALL', 'INSTALLATION_COMPLETED', 'PENDING_CONFIRMATION', 'INSTALLATION_REJECTED', 'COMPLETED', 'CANCELLED'])
export const packageOverflowMode = pgEnum("package_overflow_mode", ['FIXED_PRICE', 'IGNORE', 'ORIGINAL', 'DISCOUNT'])
export const packageType = pgEnum("package_type", ['QUANTITY', 'COMBO', 'CATEGORY', 'TIME_LIMITED'])
export const paymentMethod = pgEnum("payment_method", ['CASH', 'WECHAT', 'ALIPAY', 'BANK'])
export const paymentScheduleStatus = pgEnum("payment_schedule_status", ['PENDING', 'PAID'])
export const paymentStatus = pgEnum("payment_status", ['PENDING', 'PARTIAL', 'PAID'])
export const poFabricStatus = pgEnum("po_fabric_status", ['DRAFT', 'IN_PRODUCTION', 'DELIVERED', 'STOCKED', 'CANCELLED'])
export const poFinishedStatus = pgEnum("po_finished_status", ['DRAFT', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
export const poType = pgEnum("po_type", ['FINISHED', 'FABRIC', 'STOCK'])
export const productCategory = pgEnum("product_category", ['CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'MATTRESS', 'OTHER', 'CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'MOTOR', 'CURTAIN_ACCESSORY', 'WALLCLOTH_ACCESSORY', 'WALLPANEL', 'WINDOWPAD', 'STANDARD', 'SERVICE'])
export const productType = pgEnum("product_type", ['FINISHED', 'CUSTOM'])
export const purchaseOrderStatus = pgEnum("purchase_order_status", ['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'])
export const quotePlanType = pgEnum("quote_plan_type", ['ECONOMIC', 'COMFORT', 'LUXURY'])
export const quoteStatus = pgEnum("quote_status", ['DRAFT', 'PENDING_APPROVAL', 'PENDING_CUSTOMER', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
export const roomType = pgEnum("room_type", ['LIVING_ROOM', 'BEDROOM', 'DINING_ROOM', 'STUDY', 'BALCONY', 'BATHROOM', 'KITCHEN', 'OTHER'])
export const settlementType = pgEnum("settlement_type", ['CASH', 'TRANSFER'])
export const supplierType = pgEnum("supplier_type", ['SUPPLIER', 'PROCESSOR', 'BOTH'])
export const userRole = pgEnum("user_role", ['ADMIN', 'SALES', 'MANAGER', 'WORKER', 'FINANCE', 'SUPPLY'])
export const verificationCodeType = pgEnum("verification_code_type", ['LOGIN_MFA', 'PASSWORD_RESET', 'BIND_PHONE'])
export const wallMaterial = pgEnum("wall_material", ['CONCRETE', 'WOOD', 'GYPSUM'])
export const windowType = pgEnum("window_type", ['STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC'])
export const workOrderItemStatus = pgEnum("work_order_item_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
export const workOrderStatus = pgEnum("work_order_status", ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
export const workerSkillType = pgEnum("worker_skill_type", ['MEASURE_CURTAIN', 'INSTALL_CURTAIN', 'MEASURE_WALLCLOTH', 'INSTALL_WALLCLOTH', 'MEASURE_WALLPANEL', 'INSTALL_WALLPANEL'])


export const sysDictionaries = pgTable("sys_dictionaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	category: varchar({ length: 50 }).notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text().notNull(),
	label: varchar({ length: 100 }),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "sys_dictionaries_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	passwordHash: text("password_hash"),
	role: varchar({ length: 50 }).default('USER'),
	permissions: jsonb().default([]),
	wechatOpenid: varchar("wechat_openid", { length: 100 }),
	preferences: jsonb().default({}),
	dashboardConfig: jsonb("dashboard_config").default({}),
	isActive: boolean("is_active").default(true),
	avatarUrl: text("avatar_url"),
	notificationSettings: jsonb("notification_settings").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_tenants_id_fk"
		}),
	unique("users_email_unique").on(table.email),
	unique("users_phone_unique").on(table.phone),
	unique("users_wechat_openid_unique").on(table.wechatOpenid),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const marketChannels = pgTable("market_channels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	parentId: uuid("parent_id"),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }),
	level: integer().default(1),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	autoAssignSalesId: uuid("auto_assign_sales_id"),
	cooperationMode: varchar("cooperation_mode", { length: 20 }).default('REBATE'),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  4 }).default('0.1'),
	distributionRuleId: uuid("distribution_rule_id"),
	allowDuplicateLeads: boolean("allow_duplicate_leads").default(false),
	urlParamsConfig: jsonb("url_params_config"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_market_channels_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_market_channels_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "market_channels_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.autoAssignSalesId],
			foreignColumns: [users.id],
			name: "market_channels_auto_assign_sales_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productAttributeTemplates = pgTable("product_attribute_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	category: productCategory().notNull(),
	templateSchema: jsonb("template_schema").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_product_attr_templates_category").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index("idx_product_attr_templates_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_attribute_templates_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productPriceHistory = pgTable("product_price_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	productId: uuid("product_id").notNull(),
	supplierId: uuid("supplier_id"),
	channelId: uuid("channel_id"),
	priceType: varchar("price_type", { length: 20 }).notNull(),
	oldPrice: numeric("old_price", { precision: 12, scale:  2 }),
	newPrice: numeric("new_price", { precision: 12, scale:  2 }),
	effectiveDate: timestamp("effective_date", { withTimezone: true, mode: 'string' }),
	changeType: varchar("change_type", { length: 50 }).notNull(),
	reason: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_product_price_history_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_price_history_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_price_history_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_price_history_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "product_price_history_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	sku: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: productCategory().notNull(),
	productType: productType("product_type").default('FINISHED').notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale:  2 }).default('0'),
	unit: varchar({ length: 20 }).default('件'),
	purchasePrice: numeric("purchase_price", { precision: 12, scale:  2 }).default('0'),
	logisticsCost: numeric("logistics_cost", { precision: 12, scale:  2 }).default('0'),
	processingCost: numeric("processing_cost", { precision: 12, scale:  2 }).default('0'),
	lossRate: numeric("loss_rate", { precision: 5, scale:  4 }).default('0.0500'),
	retailPrice: numeric("retail_price", { precision: 12, scale:  2 }).default('0'),
	channelPriceMode: varchar("channel_price_mode", { length: 20 }).default('FIXED'),
	channelPrice: numeric("channel_price", { precision: 12, scale:  2 }).default('0'),
	channelDiscountRate: numeric("channel_discount_rate", { precision: 5, scale:  4 }).default('1.0000'),
	floorPrice: numeric("floor_price", { precision: 12, scale:  2 }).default('0'),
	isTobEnabled: boolean("is_tob_enabled").default(true),
	isTocEnabled: boolean("is_toc_enabled").default(true),
	defaultSupplierId: uuid("default_supplier_id"),
	isStockable: boolean("is_stockable").default(false),
	description: text(),
	specs: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	images: jsonb().default([]),
	stockUnit: varchar("stock_unit", { length: 20 }),
	salesUnit: varchar("sales_unit", { length: 20 }),
	conversionRate: numeric("conversion_rate", { precision: 10, scale:  4 }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_products_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("idx_products_supplier").using("btree", table.defaultSupplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_products_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "products_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.defaultSupplierId],
			foreignColumns: [suppliers.id],
			name: "products_default_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "products_created_by_users_id_fk"
		}),
	unique("products_sku_unique").on(table.sku),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productTemplates = pgTable("product_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: productCategory().notNull(),
	description: text(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).default('0').notNull(),
	defaultWidth: numeric("default_width", { precision: 10, scale:  2 }),
	defaultFoldRatio: numeric("default_fold_ratio", { precision: 4, scale:  2 }),
	tags: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_templates_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	logoUrl: text("logo_url"),
	settings: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tenants_code_unique").on(table.code),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	customerNo: varchar("customer_no", { length: 50 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	type: varchar({ length: 20 }).default('INDIVIDUAL'),
	phone: varchar({ length: 20 }).notNull(),
	phoneSecondary: varchar("phone_secondary", { length: 20 }),
	wechat: varchar({ length: 50 }),
	wechatOpenid: varchar("wechat_openid", { length: 100 }),
	gender: varchar({ length: 10 }),
	birthday: timestamp({ mode: 'string' }),
	level: customerLevel().default('D'),
	lifecycleStage: customerLifecycleStage("lifecycle_stage").default('LEAD').notNull(),
	pipelineStatus: customerPipelineStatus("pipeline_status").default('UNASSIGNED').notNull(),
	referrerCustomerId: uuid("referrer_customer_id"),
	sourceLeadId: uuid("source_lead_id"),
	loyaltyPoints: integer("loyalty_points").default(0),
	referralCode: varchar("referral_code", { length: 20 }),
	totalOrders: integer("total_orders").default(0),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).default('0'),
	avgOrderAmount: numeric("avg_order_amount", { precision: 12, scale:  2 }).default('0'),
	firstOrderAt: timestamp("first_order_at", { withTimezone: true, mode: 'string' }),
	lastOrderAt: timestamp("last_order_at", { withTimezone: true, mode: 'string' }),
	preferences: jsonb().default({}),
	notes: text(),
	tags: text().array().default([""]),
	isMerged: boolean("is_merged").default(false),
	mergedFrom: uuid("merged_from").array(),
	assignedSalesId: uuid("assigned_sales_id"),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_customers_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("idx_customers_referrer").using("btree", table.referrerCustomerId.asc().nullsLast().op("uuid_ops")),
	index("idx_customers_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.assignedSalesId],
			foreignColumns: [users.id],
			name: "customers_assigned_sales_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "customers_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "customers_updated_by_users_id_fk"
		}),
	unique("customers_customer_no_unique").on(table.customerNo),
	unique("customers_wechat_openid_unique").on(table.wechatOpenid),
	unique("customers_referral_code_unique").on(table.referralCode),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const phoneViewLogs = pgTable("phone_view_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	viewerId: uuid("viewer_id").notNull(),
	viewerRole: varchar("viewer_role", { length: 50 }).notNull(),
	ipAddress: varchar("ip_address", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_phone_view_logs_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_phone_view_logs_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_phone_view_logs_viewer").using("btree", table.viewerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "phone_view_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "phone_view_logs_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.viewerId],
			foreignColumns: [users.id],
			name: "phone_view_logs_viewer_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const customerAddresses = pgTable("customer_addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	label: varchar({ length: 50 }),
	province: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	district: varchar({ length: 50 }),
	community: varchar({ length: 100 }),
	address: varchar({ length: 255 }).notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_cust_addresses_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customer_addresses_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "customer_addresses_customer_id_customers_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const leadActivities = pgTable("lead_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	quoteId: uuid("quote_id"),
	purchaseIntention: intentionLevel("purchase_intention"),
	customerLevel: varchar("customer_level", { length: 20 }),
	activityType: leadActivityType("activity_type").notNull(),
	content: text().notNull(),
	location: varchar({ length: 200 }),
	nextFollowupDate: timestamp("next_followup_date", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_lead_activities_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "lead_activities_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_activities_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "lead_activities_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const leadStatusHistory = pgTable("lead_status_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	oldStatus: varchar("old_status", { length: 50 }),
	newStatus: varchar("new_status", { length: 50 }).notNull(),
	changedBy: uuid("changed_by"),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	reason: text(),
}, (table) => [
	index("idx_lead_history_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_lead_history_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "lead_status_history_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_status_history_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "lead_status_history_changed_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelCommissions = pgTable("channel_commissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	channelId: uuid("channel_id").notNull(),
	leadId: uuid("lead_id"),
	orderId: uuid("order_id"),
	commissionType: cooperationMode("commission_type"),
	orderAmount: numeric("order_amount", { precision: 15, scale:  2 }),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  4 }),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('PENDING'),
	settlementId: uuid("settlement_id"),
	formula: jsonb(),
	remark: text(),
	settledAt: timestamp("settled_at", { withTimezone: true, mode: 'string' }),
	settledBy: uuid("settled_by"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_commissions_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_commissions_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_commissions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_commissions_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_commissions_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "channel_commissions_channel_id_channels_id_fk"
		}),
	foreignKey({
			columns: [table.settledBy],
			foreignColumns: [users.id],
			name: "channel_commissions_settled_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "channel_commissions_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelSettlements = pgTable("channel_settlements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	settlementNo: varchar("settlement_no", { length: 50 }).notNull(),
	channelId: uuid("channel_id").notNull(),
	periodStart: timestamp("period_start", { withTimezone: true, mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { withTimezone: true, mode: 'string' }).notNull(),
	totalCommission: numeric("total_commission", { precision: 15, scale:  2 }).notNull(),
	adjustmentAmount: numeric("adjustment_amount", { precision: 15, scale:  2 }).default('0'),
	finalAmount: numeric("final_amount", { precision: 15, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('DRAFT'),
	paymentBillId: uuid("payment_bill_id"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_settlements_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_settlements_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_settlements_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_settlements_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "channel_settlements_channel_id_channels_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "channel_settlements_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "channel_settlements_approved_by_users_id_fk"
		}),
	unique("channel_settlements_settlement_no_unique").on(table.settlementNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelContacts = pgTable("channel_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	channelId: uuid("channel_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	position: varchar({ length: 50 }),
	phone: varchar({ length: 20 }).notNull(),
	isMain: boolean("is_main").default(false),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_channel_contacts_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_channel_contacts_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_contacts_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "channel_contacts_channel_id_channels_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "channel_contacts_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quoteItems = pgTable("quote_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	quoteId: uuid("quote_id").notNull(),
	parentId: uuid("parent_id"),
	roomId: uuid("room_id"),
	category: varchar({ length: 50 }).notNull(),
	productId: uuid("product_id"),
	productName: varchar("product_name", { length: 200 }).notNull(),
	productSku: varchar("product_sku", { length: 100 }),
	roomName: varchar("room_name", { length: 100 }),
	unit: varchar({ length: 20 }),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	costPrice: numeric("cost_price", { precision: 10, scale:  2 }),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	width: numeric({ precision: 10, scale:  2 }),
	height: numeric({ precision: 10, scale:  2 }),
	foldRatio: numeric("fold_ratio", { precision: 4, scale:  2 }),
	processFee: numeric("process_fee", { precision: 10, scale:  2 }),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	attributes: jsonb().default({}),
	calculationParams: jsonb("calculation_params"),
	remark: text(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quote_items_quote").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotes.id],
			name: "quote_items_quote_id_quotes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [quoteRooms.id],
			name: "quote_items_room_id_quote_rooms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "quote_items_product_id_products_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadNo: varchar("lead_no", { length: 50 }).notNull(),
	customerName: varchar("customer_name", { length: 50 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
	customerWechat: varchar("customer_wechat", { length: 50 }),
	address: text(),
	community: varchar({ length: 100 }),
	houseType: varchar("house_type", { length: 50 }),
	status: leadStatus().default('PENDING_ASSIGNMENT'),
	intentionLevel: intentionLevel("intention_level"),
	channelId: uuid("channel_id"),
	channelContactId: uuid("channel_contact_id"),
	sourceChannelId: uuid("source_channel_id"),
	sourceSubId: uuid("source_sub_id"),
	distributionRuleId: uuid("distribution_rule_id"),
	sourceDetail: varchar("source_detail", { length: 100 }),
	urlParams: jsonb("url_params"),
	referrerName: varchar("referrer_name", { length: 100 }),
	referrerCustomerId: uuid("referrer_customer_id"),
	estimatedAmount: numeric("estimated_amount", { precision: 12, scale:  2 }),
	tags: text().array(),
	notes: text(),
	lostReason: text("lost_reason"),
	externalId: varchar("external_id", { length: 100 }),
	assignedSalesId: uuid("assigned_sales_id"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }),
	lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: 'string' }),
	nextFollowupAt: timestamp("next_followup_at", { withTimezone: true, mode: 'string' }),
	nextFollowupRecommendation: timestamp("next_followup_recommendation", { withTimezone: true, mode: 'string' }),
	decorationProgress: decorationProgress("decoration_progress"),
	quotedAt: timestamp("quoted_at", { withTimezone: true, mode: 'string' }),
	visitedStoreAt: timestamp("visited_store_at", { withTimezone: true, mode: 'string' }),
	wonAt: timestamp("won_at", { withTimezone: true, mode: 'string' }),
	customerId: uuid("customer_id"),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_leads_phone").using("btree", table.customerPhone.asc().nullsLast().op("text_ops")),
	index("idx_leads_sales").using("btree", table.assignedSalesId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_leads_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_leads_tenant_date").using("btree", table.tenantId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "leads_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "leads_channel_id_channels_id_fk"
		}),
	foreignKey({
			columns: [table.channelContactId],
			foreignColumns: [channelContacts.id],
			name: "leads_channel_contact_id_channel_contacts_id_fk"
		}),
	foreignKey({
			columns: [table.sourceChannelId],
			foreignColumns: [marketChannels.id],
			name: "leads_source_channel_id_market_channels_id_fk"
		}),
	foreignKey({
			columns: [table.sourceSubId],
			foreignColumns: [marketChannels.id],
			name: "leads_source_sub_id_market_channels_id_fk"
		}),
	foreignKey({
			columns: [table.referrerCustomerId],
			foreignColumns: [customers.id],
			name: "leads_referrer_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.assignedSalesId],
			foreignColumns: [users.id],
			name: "leads_assigned_sales_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "leads_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "leads_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "leads_updated_by_users_id_fk"
		}),
	unique("leads_lead_no_unique").on(table.leadNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channels = pgTable("channels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	parentId: uuid("parent_id"),
	hierarchyLevel: integer("hierarchy_level").default(1).notNull(),
	categoryId: uuid("category_id"),
	category: channelCategory().default('OFFLINE').notNull(),
	channelType: channelType("channel_type").notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	level: channelLevel().default('C').notNull(),
	contactName: varchar("contact_name", { length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  2 }).notNull(),
	commissionType: commissionType("commission_type"),
	tieredRates: jsonb("tiered_rates"),
	cooperationMode: cooperationMode("cooperation_mode").notNull(),
	priceDiscountRate: numeric("price_discount_rate", { precision: 5, scale:  4 }),
	settlementType: channelSettlementType("settlement_type").notNull(),
	creditLimit: numeric("credit_limit", { precision: 15, scale:  2 }).default('0'),
	bankInfo: jsonb("bank_info"),
	contractFiles: jsonb("contract_files"),
	totalLeads: integer("total_leads").default(0),
	totalDealAmount: numeric("total_deal_amount", { precision: 15, scale:  2 }).default('0'),
	status: channelStatus().default('ACTIVE'),
	assignedManagerId: uuid("assigned_manager_id"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_channels_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("idx_channels_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_channels_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("idx_channels_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channels_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [channelCategories.id],
			name: "channels_category_id_channel_categories_id_fk"
		}),
	foreignKey({
			columns: [table.assignedManagerId],
			foreignColumns: [users.id],
			name: "channels_assigned_manager_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "channels_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelCategories = pgTable("channel_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_channel_categories_code").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	index("idx_channel_categories_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_categories_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const commissionAdjustments = pgTable("commission_adjustments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	channelId: uuid("channel_id").notNull(),
	originalCommissionId: uuid("original_commission_id").notNull(),
	adjustmentType: varchar("adjustment_type", { length: 20 }).notNull(),
	adjustmentAmount: numeric("adjustment_amount", { precision: 15, scale:  2 }).notNull(),
	reason: text().notNull(),
	orderId: uuid("order_id"),
	refundAmount: numeric("refund_amount", { precision: 15, scale:  2 }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_adjustments_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_adjustments_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "commission_adjustments_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [channels.id],
			name: "commission_adjustments_channel_id_channels_id_fk"
		}),
	foreignKey({
			columns: [table.originalCommissionId],
			foreignColumns: [channelCommissions.id],
			name: "commission_adjustments_original_commission_id_channel_commissio"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "commission_adjustments_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quoteTemplateItems = pgTable("quote_template_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	templateId: uuid("template_id").notNull(),
	roomId: uuid("room_id"),
	parentId: uuid("parent_id"),
	category: varchar({ length: 50 }).notNull(),
	productId: uuid("product_id"),
	productName: varchar("product_name", { length: 200 }).notNull(),
	defaultWidth: numeric("default_width", { precision: 10, scale:  2 }),
	defaultHeight: numeric("default_height", { precision: 10, scale:  2 }),
	defaultFoldRatio: numeric("default_fold_ratio", { precision: 4, scale:  2 }),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }),
	attributes: jsonb().default({}),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quote_template_items_room").using("btree", table.roomId.asc().nullsLast().op("uuid_ops")),
	index("idx_quote_template_items_template").using("btree", table.templateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_template_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [quoteTemplates.id],
			name: "quote_template_items_template_id_quote_templates_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [quoteTemplateRooms.id],
			name: "quote_template_items_room_id_quote_template_rooms_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "quote_template_items_product_id_products_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quoteTemplates = pgTable("quote_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }),
	tags: jsonb().default([]),
	sourceQuoteId: uuid("source_quote_id"),
	isPublic: boolean("is_public").default(false),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quote_templates_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_quote_templates_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_templates_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "quote_templates_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quoteTemplateRooms = pgTable("quote_template_rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	templateId: uuid("template_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quote_template_rooms_template").using("btree", table.templateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_template_rooms_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [quoteTemplates.id],
			name: "quote_template_rooms_template_id_quote_templates_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quoteRooms = pgTable("quote_rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	quoteId: uuid("quote_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	measureRoomId: uuid("measure_room_id"),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_quote_rooms_quote").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_rooms_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotes.id],
			name: "quote_rooms_quote_id_quotes_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quotes = pgTable("quotes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	quoteNo: varchar("quote_no", { length: 50 }).notNull(),
	customerId: uuid("customer_id").notNull(),
	leadId: uuid("lead_id"),
	measureVariantId: uuid("measure_variant_id"),
	bundleId: uuid("bundle_id"),
	rootQuoteId: uuid("root_quote_id"),
	parentQuoteId: uuid("parent_quote_id"),
	isActive: boolean("is_active").default(true),
	title: varchar({ length: 200 }),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).default('0'),
	discountRate: numeric("discount_rate", { precision: 5, scale:  4 }),
	discountAmount: numeric("discount_amount", { precision: 12, scale:  2 }).default('0'),
	finalAmount: numeric("final_amount", { precision: 12, scale:  2 }).default('0'),
	minProfitMargin: numeric("min_profit_margin", { precision: 5, scale:  4 }),
	status: quoteStatus().default('DRAFT'),
	version: integer().default(1).notNull(),
	validUntil: timestamp("valid_until", { withTimezone: true, mode: 'string' }),
	notes: text(),
	approvalRequired: boolean("approval_required").default(false),
	approverId: uuid("approver_id"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	rejectReason: text("reject_reason"),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("idx_quotes_active_version").using("btree", table.rootQuoteId.asc().nullsLast().op("uuid_ops")).where(sql`(is_active = true)`),
	index("idx_quotes_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_quotes_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quotes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "quotes_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.approverId],
			foreignColumns: [users.id],
			name: "quotes_approver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "quotes_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "quotes_updated_by_users_id_fk"
		}),
	unique("quotes_quote_no_unique").on(table.quoteNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quotePlans = pgTable("quote_plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("idx_quote_plans_code_tenant").using("btree", table.code.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "quote_plans_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const orderChanges = pgTable("order_changes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	orderId: uuid("order_id").notNull(),
	type: changeRequestType().notNull(),
	reason: text().notNull(),
	status: changeRequestStatus().default('PENDING'),
	diffAmount: numeric("diff_amount", { precision: 12, scale:  2 }).default('0'),
	originalData: jsonb("original_data"),
	newData: jsonb("new_data"),
	requestedBy: uuid("requested_by"),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_order_changes_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_order_changes_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "order_changes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_changes_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [users.id],
			name: "order_changes_requested_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "order_changes_approved_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelDiscountOverrides = pgTable("channel_discount_overrides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	scope: varchar({ length: 20 }).notNull(),
	targetId: varchar("target_id", { length: 100 }).notNull(),
	targetName: varchar("target_name", { length: 200 }),
	sLevelDiscount: numeric("s_level_discount", { precision: 5, scale:  2 }),
	aLevelDiscount: numeric("a_level_discount", { precision: 5, scale:  2 }),
	bLevelDiscount: numeric("b_level_discount", { precision: 5, scale:  2 }),
	cLevelDiscount: numeric("c_level_discount", { precision: 5, scale:  2 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_channel_discount_overrides_scope_target").using("btree", table.scope.asc().nullsLast().op("text_ops"), table.targetId.asc().nullsLast().op("text_ops")),
	index("idx_channel_discount_overrides_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_discount_overrides_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	quoteId: uuid("quote_id").notNull(),
	quoteVersionId: uuid("quote_version_id").notNull(),
	leadId: uuid("lead_id"),
	customerId: uuid("customer_id").notNull(),
	customerName: varchar("customer_name", { length: 100 }),
	customerPhone: varchar("customer_phone", { length: 20 }),
	deliveryAddress: text("delivery_address"),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).default('0'),
	paidAmount: numeric("paid_amount", { precision: 12, scale:  2 }).default('0'),
	balanceAmount: numeric("balance_amount", { precision: 12, scale:  2 }).default('0'),
	settlementType: orderSettlementType("settlement_type").notNull(),
	confirmationImg: text("confirmation_img"),
	paymentProofImg: text("payment_proof_img"),
	paymentAmount: numeric("payment_amount", { precision: 12, scale:  2 }),
	paymentMethod: paymentMethod("payment_method"),
	paymentTime: timestamp("payment_time", { withTimezone: true, mode: 'string' }),
	prepaidPaymentId: uuid("prepaid_payment_id"),
	status: orderStatus().default('DRAFT'),
	isLocked: boolean("is_locked").default(false),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	salesId: uuid("sales_id"),
	remark: text(),
	snapshotData: jsonb("snapshot_data"),
	quoteSnapshot: jsonb("quote_snapshot"),
	logistics: jsonb(),
	createdBy: uuid("created_by").notNull(),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	pausedAt: timestamp("paused_at", { withTimezone: true, mode: 'string' }),
	pauseReason: text("pause_reason"),
	pauseCumulativeDays: integer("pause_cumulative_days").default(0),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_orders_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_order_no").using("btree", table.orderNo.asc().nullsLast().op("text_ops")),
	index("idx_orders_quote").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_sales").using("btree", table.salesId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_orders_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "orders_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [quotes.id],
			name: "orders_quote_id_quotes_id_fk"
		}),
	foreignKey({
			columns: [table.quoteVersionId],
			foreignColumns: [quotes.id],
			name: "orders_quote_version_id_quotes_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "orders_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "orders_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.salesId],
			foreignColumns: [users.id],
			name: "orders_sales_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "orders_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "orders_updated_by_users_id_fk"
		}),
	unique("orders_order_no_unique").on(table.orderNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const paymentSchedules = pgTable("payment_schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	orderId: uuid("order_id").notNull(),
	statementId: uuid("statement_id"),
	name: varchar({ length: 100 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	expectedDate: date("expected_date"),
	actualDate: date("actual_date"),
	status: paymentScheduleStatus().default('PENDING'),
	proofImg: text("proof_img"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_schedules_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payment_schedules_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payment_schedules_order_id_orders_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const channelSpecificPrices = pgTable("channel_specific_prices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	productId: uuid("product_id").notNull(),
	channelId: uuid("channel_id").notNull(),
	specialPrice: numeric("special_price", { precision: 12, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_csp_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_csp_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_csp_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "channel_specific_prices_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productPackages = pgTable("product_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	packageNo: varchar("package_no", { length: 50 }).notNull(),
	packageName: varchar("package_name", { length: 200 }).notNull(),
	packageType: packageType("package_type").notNull(),
	packagePrice: numeric("package_price", { precision: 12, scale:  2 }).notNull(),
	originalPrice: numeric("original_price", { precision: 12, scale:  2 }),
	description: text(),
	rules: jsonb().default({}),
	overflowMode: packageOverflowMode("overflow_mode").default('DISCOUNT'),
	overflowPrice: numeric("overflow_price", { precision: 12, scale:  2 }),
	overflowDiscountRate: numeric("overflow_discount_rate", { precision: 5, scale:  4 }),
	isActive: boolean("is_active").default(true),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_packages_no").using("btree", table.packageNo.asc().nullsLast().op("text_ops")),
	index("idx_packages_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_packages_tenant_id_tenants_id_fk"
		}),
	unique("product_packages_package_no_unique").on(table.packageNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productBundleItems = pgTable("product_bundle_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	bundleId: uuid("bundle_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	unit: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bundle_items_bundle").using("btree", table.bundleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_bundle_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.bundleId],
			foreignColumns: [productBundles.id],
			name: "product_bundle_items_bundle_id_product_bundles_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const splitRouteRules = pgTable("split_route_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	priority: integer().default(0),
	name: varchar({ length: 100 }).notNull(),
	conditions: jsonb().default([]).notNull(),
	targetType: varchar("target_type", { length: 50 }).notNull(),
	targetSupplierId: uuid("target_supplier_id"),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "split_route_rules_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.targetSupplierId],
			foreignColumns: [suppliers.id],
			name: "split_route_rules_target_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "split_route_rules_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const fabricInventory = pgTable("fabric_inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	fabricProductId: uuid("fabric_product_id").notNull(),
	fabricSku: varchar("fabric_sku", { length: 100 }).notNull(),
	fabricName: varchar("fabric_name", { length: 200 }).notNull(),
	fabricColor: varchar("fabric_color", { length: 50 }),
	fabricWidth: numeric("fabric_width", { precision: 10, scale:  2 }),
	fabricRollLength: numeric("fabric_roll_length", { precision: 10, scale:  2 }),
	batchNo: varchar("batch_no", { length: 50 }),
	purchaseOrderId: uuid("purchase_order_id"),
	supplierId: uuid("supplier_id"),
	availableQuantity: numeric("available_quantity", { precision: 12, scale:  2 }).notNull(),
	reservedQuantity: numeric("reserved_quantity", { precision: 12, scale:  2 }).default('0'),
	totalQuantity: numeric("total_quantity", { precision: 12, scale:  2 }).notNull(),
	purchaseDate: timestamp("purchase_date", { withTimezone: true, mode: 'string' }),
	expiryDate: timestamp("expiry_date", { withTimezone: true, mode: 'string' }),
	warehouseLocation: varchar("warehouse_location", { length: 100 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fabric_inventory_product").using("btree", table.fabricProductId.asc().nullsLast().op("uuid_ops")),
	index("idx_fabric_inventory_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fabric_inventory_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const workOrderItems = pgTable("work_order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	woId: uuid("wo_id").notNull(),
	orderItemId: uuid("order_item_id").notNull(),
	status: workOrderItemStatus().default('PENDING'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_work_order_items_wo").using("btree", table.woId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.woId],
			foreignColumns: [workOrders.id],
			name: "work_order_items_wo_id_work_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "work_order_items_order_item_id_order_items_id_fk"
		}),
]);

export const purchaseOrders = pgTable("purchase_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	poNo: varchar("po_no", { length: 50 }).notNull(),
	orderId: uuid("order_id"),
	afterSalesId: uuid("after_sales_id"),
	supplierId: uuid("supplier_id").notNull(),
	supplierName: varchar("supplier_name", { length: 100 }).notNull(),
	type: poType().default('FINISHED'),
	splitRuleId: uuid("split_rule_id"),
	status: purchaseOrderStatus().default('DRAFT'),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).default('0'),
	externalPoNo: varchar("external_po_no", { length: 100 }),
	supplierQuoteImg: text("supplier_quote_img"),
	sentMethod: varchar("sent_method", { length: 20 }),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	producedAt: timestamp("produced_at", { withTimezone: true, mode: 'string' }),
	logisticsCompany: varchar("logistics_company", { length: 50 }),
	logisticsNo: varchar("logistics_no", { length: 100 }),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	paymentStatus: paymentStatus("payment_status").default('PENDING'),
	expectedDate: timestamp("expected_date", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_po_after_sales").using("btree", table.afterSalesId.asc().nullsLast().op("uuid_ops")),
	index("idx_po_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_po_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_po_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_po_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "purchase_orders_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "purchase_orders_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.afterSalesId],
			foreignColumns: [afterSalesTickets.id],
			name: "purchase_orders_after_sales_id_after_sales_tickets_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "purchase_orders_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "purchase_orders_created_by_users_id_fk"
		}),
	unique("purchase_orders_po_no_unique").on(table.poNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const suppliers = pgTable("suppliers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	supplierNo: varchar("supplier_no", { length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	supplierType: supplierType("supplier_type").default('SUPPLIER'),
	contactPerson: varchar("contact_person", { length: 100 }),
	phone: varchar({ length: 50 }),
	paymentPeriod: varchar("payment_period", { length: 50 }).default('CASH'),
	isActive: boolean("is_active").default(true),
	address: text(),
	remark: text(),
	processingPrices: jsonb("processing_prices"),
	contractUrl: text("contract_url"),
	contractExpiryDate: timestamp("contract_expiry_date", { withTimezone: true, mode: 'string' }),
	businessLicenseUrl: text("business_license_url"),
	bankAccount: varchar("bank_account", { length: 100 }),
	bankName: varchar("bank_name", { length: 100 }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_suppliers_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_suppliers_type").using("btree", table.supplierType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "suppliers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "suppliers_created_by_users_id_fk"
		}),
	unique("suppliers_supplier_no_unique").on(table.supplierNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const fabricInventoryLogs = pgTable("fabric_inventory_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	fabricInventoryId: uuid("fabric_inventory_id").notNull(),
	logType: fabricInventoryLogType("log_type").notNull(),
	quantity: numeric({ precision: 12, scale:  2 }).notNull(),
	beforeQuantity: numeric("before_quantity", { precision: 12, scale:  2 }).notNull(),
	afterQuantity: numeric("after_quantity", { precision: 12, scale:  2 }).notNull(),
	referenceId: uuid("reference_id"),
	referenceType: varchar("reference_type", { length: 50 }),
	remark: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_fabric_logs_inventory").using("btree", table.fabricInventoryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fabric_inventory_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.fabricInventoryId],
			foreignColumns: [fabricInventory.id],
			name: "fabric_inventory_logs_fabric_inventory_id_fabric_inventory_id_f"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productBundles = pgTable("product_bundles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	bundleSku: varchar("bundle_sku", { length: 50 }).notNull(),
	bundleName: varchar("bundle_name", { length: 200 }).notNull(),
	category: varchar({ length: 50 }),
	retailPrice: numeric("retail_price", { precision: 12, scale:  2 }).default('0'),
	channelPrice: numeric("channel_price", { precision: 12, scale:  2 }).default('0'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bundles_sku").using("btree", table.bundleSku.asc().nullsLast().op("text_ops")),
	index("idx_bundles_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_bundles_tenant_id_tenants_id_fk"
		}),
	unique("product_bundles_bundle_sku_unique").on(table.bundleSku),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productSuppliers = pgTable("product_suppliers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	productId: uuid("product_id").notNull(),
	supplierId: uuid("supplier_id").notNull(),
	isDefault: boolean("is_default").default(false),
	purchasePrice: numeric("purchase_price", { precision: 12, scale:  2 }),
	logisticsCost: numeric("logistics_cost", { precision: 12, scale:  2 }),
	processingCost: numeric("processing_cost", { precision: 12, scale:  2 }),
	leadTimeDays: integer("lead_time_days").default(7),
	minOrderQuantity: numeric("min_order_quantity", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_product_suppliers_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_suppliers_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_suppliers_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "product_suppliers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "product_suppliers_supplier_id_suppliers_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const productionTasks = pgTable("production_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	taskNo: varchar("task_no", { length: 50 }).notNull(),
	orderId: uuid("order_id").notNull(),
	orderItemId: uuid("order_item_id"),
	workshop: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('PENDING'),
	assignedWorkerId: uuid("assigned_worker_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_production_tasks_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_production_tasks_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "production_tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "production_tasks_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.assignedWorkerId],
			foreignColumns: [users.id],
			name: "production_tasks_assigned_worker_id_users_id_fk"
		}),
	unique("production_tasks_task_no_unique").on(table.taskNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const purchaseOrderItems = pgTable("purchase_order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	poId: uuid("po_id").notNull(),
	orderItemId: uuid("order_item_id"),
	productId: uuid("product_id"),
	productSku: varchar("product_sku", { length: 100 }),
	category: varchar({ length: 50 }),
	productName: varchar("product_name", { length: 200 }).notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).default('0'),
	width: numeric({ precision: 10, scale:  2 }),
	height: numeric({ precision: 10, scale:  2 }),
	subtotal: numeric({ precision: 12, scale:  2 }),
	quoteItemId: uuid("quote_item_id"),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_poi_order_item").using("btree", table.orderItemId.asc().nullsLast().op("uuid_ops")),
	index("idx_poi_po").using("btree", table.poId.asc().nullsLast().op("uuid_ops")),
	index("idx_poi_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "purchase_order_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.poId],
			foreignColumns: [purchaseOrders.id],
			name: "purchase_order_items_po_id_purchase_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "purchase_order_items_order_item_id_order_items_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const measureItems = pgTable("measure_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	sheetId: uuid("sheet_id").notNull(),
	roomName: varchar("room_name", { length: 100 }).notNull(),
	windowType: windowType("window_type").notNull(),
	width: numeric({ precision: 12, scale:  2 }).notNull(),
	height: numeric({ precision: 12, scale:  2 }).notNull(),
	installType: installType("install_type"),
	bracketDist: numeric("bracket_dist", { precision: 12, scale:  2 }),
	wallMaterial: wallMaterial("wall_material"),
	hasBox: boolean("has_box").default(false),
	boxDepth: numeric("box_depth", { precision: 12, scale:  2 }),
	isElectric: boolean("is_electric").default(false),
	remark: text(),
	segmentData: jsonb("segment_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_measure_items_sheet").using("btree", table.sheetId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "measure_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.sheetId],
			foreignColumns: [measureSheets.id],
			name: "measure_items_sheet_id_measure_sheets_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const installPhotos = pgTable("install_photos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	installTaskId: uuid("install_task_id").notNull(),
	photoType: installPhotoType("photo_type").notNull(),
	photoUrl: text("photo_url").notNull(),
	roomName: varchar("room_name", { length: 100 }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "install_photos_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.installTaskId],
			foreignColumns: [installTasks.id],
			name: "install_photos_install_task_id_install_tasks_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const measureSheets = pgTable("measure_sheets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	taskId: uuid("task_id").notNull(),
	status: measureSheetStatus().default('DRAFT'),
	round: integer().notNull(),
	variant: varchar({ length: 50 }).notNull(),
	sitePhotos: jsonb("site_photos"),
	sketchMap: text("sketch_map"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "measure_sheets_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [measureTasks.id],
			name: "measure_sheets_task_id_measure_tasks_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const measureTasks = pgTable("measure_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	measureNo: varchar("measure_no", { length: 50 }).notNull(),
	leadId: uuid("lead_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	status: measureTaskStatus().default('PENDING'),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	checkInAt: timestamp("check_in_at", { withTimezone: true, mode: 'string' }),
	checkInLocation: jsonb("check_in_location"),
	type: measureType().default('BLIND'),
	assignedWorkerId: uuid("assigned_worker_id"),
	versionDisplay: varchar("version_display", { length: 20 }),
	parentId: uuid("parent_id"),
	round: integer().default(1).notNull(),
	remark: text(),
	rejectCount: integer("reject_count").default(0).notNull(),
	rejectReason: text("reject_reason"),
	isFeeExempt: boolean("is_fee_exempt").default(false),
	feeCheckStatus: feeCheckStatus("fee_check_status").default('NONE'),
	feeApprovalId: uuid("fee_approval_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_measure_tasks_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_measure_tasks_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_measure_tasks_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "measure_tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "measure_tasks_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "measure_tasks_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.assignedWorkerId],
			foreignColumns: [users.id],
			name: "measure_tasks_assigned_worker_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "measure_tasks_parent_id_measure_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.feeApprovalId],
			foreignColumns: [approvals.id],
			name: "measure_tasks_fee_approval_id_approvals_id_fk"
		}),
	unique("measure_tasks_measure_no_unique").on(table.measureNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const accountTransactions = pgTable("account_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	transactionNo: varchar("transaction_no", { length: 50 }).notNull(),
	accountId: uuid("account_id").notNull(),
	transactionType: varchar("transaction_type", { length: 20 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	balanceBefore: numeric("balance_before", { precision: 12, scale:  2 }).notNull(),
	balanceAfter: numeric("balance_after", { precision: 12, scale:  2 }).notNull(),
	relatedType: varchar("related_type", { length: 50 }).notNull(),
	relatedId: uuid("related_id").notNull(),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_account_transactions_account").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_account_transactions_related").using("btree", table.relatedId.asc().nullsLast().op("uuid_ops")),
	index("idx_account_transactions_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "account_transactions_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [financeAccounts.id],
			name: "account_transactions_account_id_finance_accounts_id_fk"
		}),
	unique("account_transactions_transaction_no_unique").on(table.transactionNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const measureTaskSplits = pgTable("measure_task_splits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	originalTaskId: uuid("original_task_id").notNull(),
	newTaskId: uuid("new_task_id").notNull(),
	reason: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_measure_task_splits_original").using("btree", table.originalTaskId.asc().nullsLast().op("uuid_ops")),
	index("idx_measure_task_splits_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "measure_task_splits_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.originalTaskId],
			foreignColumns: [measureTasks.id],
			name: "measure_task_splits_original_task_id_measure_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.newTaskId],
			foreignColumns: [measureTasks.id],
			name: "measure_task_splits_new_task_id_measure_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "measure_task_splits_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const apLaborFeeDetails = pgTable("ap_labor_fee_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	statementId: uuid("statement_id").notNull(),
	installTaskId: uuid("install_task_id"),
	installTaskNo: varchar("install_task_no", { length: 50 }),
	liabilityNoticeId: uuid("liability_notice_id"),
	liabilityNoticeNo: varchar("liability_notice_no", { length: 50 }),
	feeType: varchar("fee_type", { length: 20 }).notNull(),
	description: varchar({ length: 200 }).notNull(),
	calculation: varchar({ length: 200 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ap_labor_fee_details_liability").using("btree", table.liabilityNoticeId.asc().nullsLast().op("uuid_ops")),
	index("idx_ap_labor_fee_details_statement").using("btree", table.statementId.asc().nullsLast().op("uuid_ops")),
	index("idx_ap_labor_fee_details_task").using("btree", table.installTaskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "ap_labor_fee_details_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.statementId],
			foreignColumns: [apLaborStatements.id],
			name: "ap_labor_fee_details_statement_id_ap_labor_statements_id_fk"
		}),
	foreignKey({
			columns: [table.installTaskId],
			foreignColumns: [installTasks.id],
			name: "ap_labor_fee_details_install_task_id_install_tasks_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const apLaborStatements = pgTable("ap_labor_statements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	statementNo: varchar("statement_no", { length: 50 }).notNull(),
	workerId: uuid("worker_id").notNull(),
	workerName: varchar("worker_name", { length: 100 }).notNull(),
	settlementPeriod: varchar("settlement_period", { length: 20 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	pendingAmount: numeric("pending_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ap_labor_statements_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_ap_labor_statements_worker").using("btree", table.workerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "ap_labor_statements_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.workerId],
			foreignColumns: [users.id],
			name: "ap_labor_statements_worker_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "ap_labor_statements_verified_by_users_id_fk"
		}),
	unique("ap_labor_statements_statement_no_unique").on(table.statementNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const installItems = pgTable("install_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	installTaskId: uuid("install_task_id").notNull(),
	orderItemId: uuid("order_item_id"),
	productName: varchar("product_name", { length: 200 }).notNull(),
	roomName: varchar("room_name", { length: 100 }),
	quantity: numeric({ precision: 12, scale:  2 }).notNull(),
	actualInstalledQuantity: numeric("actual_installed_quantity", { precision: 12, scale:  2 }),
	issueCategory: installItemIssueCategory("issue_category").default('NONE'),
	isInstalled: boolean("is_installed").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_install_items_task").using("btree", table.installTaskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "install_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.installTaskId],
			foreignColumns: [installTasks.id],
			name: "install_items_install_task_id_install_tasks_id_fk"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const installTasks = pgTable("install_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	taskNo: varchar("task_no", { length: 50 }).notNull(),
	sourceType: installTaskSourceType("source_type").default('ORDER').notNull(),
	orderId: uuid("order_id").notNull(),
	afterSalesId: uuid("after_sales_id"),
	customerId: uuid("customer_id").notNull(),
	customerName: varchar("customer_name", { length: 100 }),
	customerPhone: varchar("customer_phone", { length: 20 }),
	address: text(),
	category: installTaskCategory().default('CURTAIN').notNull(),
	status: installTaskStatus().default('PENDING_DISPATCH').notNull(),
	salesId: uuid("sales_id"),
	dispatcherId: uuid("dispatcher_id"),
	installerId: uuid("installer_id"),
	installerName: varchar("installer_name", { length: 100 }),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }),
	scheduledDate: timestamp("scheduled_date", { withTimezone: true, mode: 'string' }),
	scheduledTimeSlot: varchar("scheduled_time_slot", { length: 50 }),
	actualStartAt: timestamp("actual_start_at", { withTimezone: true, mode: 'string' }),
	actualEndAt: timestamp("actual_end_at", { withTimezone: true, mode: 'string' }),
	logisticsReadyStatus: boolean("logistics_ready_status").default(false).notNull(),
	checkInAt: timestamp("check_in_at", { withTimezone: true, mode: 'string' }),
	checkInLocation: jsonb("check_in_location"),
	checkOutAt: timestamp("check_out_at", { withTimezone: true, mode: 'string' }),
	checkOutLocation: jsonb("check_out_location"),
	customerSignatureUrl: text("customer_signature_url"),
	signedAt: timestamp("signed_at", { withTimezone: true, mode: 'string' }),
	laborFee: numeric("labor_fee", { precision: 12, scale:  2 }),
	actualLaborFee: numeric("actual_labor_fee", { precision: 12, scale:  2 }),
	adjustmentReason: text("adjustment_reason"),
	feeBreakdown: jsonb("fee_breakdown"),
	checklistStatus: jsonb("checklist_status"),
	fieldDiscovery: jsonb("field_discovery"),
	rating: integer(),
	ratingComment: text("rating_comment"),
	remark: text(),
	notes: text(),
	rejectCount: integer("reject_count").default(0).notNull(),
	rejectReason: text("reject_reason"),
	confirmedBy: uuid("confirmed_by"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_install_installer").using("btree", table.installerId.asc().nullsLast().op("uuid_ops")),
	index("idx_install_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_install_scheduled_date").using("btree", table.scheduledDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_install_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_install_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "install_tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "install_tasks_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.afterSalesId],
			foreignColumns: [afterSalesTickets.id],
			name: "install_tasks_after_sales_id_after_sales_tickets_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "install_tasks_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.salesId],
			foreignColumns: [users.id],
			name: "install_tasks_sales_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.dispatcherId],
			foreignColumns: [users.id],
			name: "install_tasks_dispatcher_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.installerId],
			foreignColumns: [users.id],
			name: "install_tasks_installer_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [users.id],
			name: "install_tasks_confirmed_by_users_id_fk"
		}),
	unique("install_tasks_task_no_unique").on(table.taskNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const creditNotes = pgTable("credit_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	creditNoteNo: varchar("credit_note_no", { length: 50 }).notNull(),
	customerId: uuid("customer_id").notNull(),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	orderId: uuid("order_id"),
	arStatementId: uuid("ar_statement_id"),
	type: varchar({ length: 20 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	reason: varchar({ length: 200 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('DRAFT').notNull(),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_credit_notes_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_credit_notes_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_credit_notes_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "credit_notes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "credit_notes_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "credit_notes_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.arStatementId],
			foreignColumns: [arStatements.id],
			name: "credit_notes_ar_statement_id_ar_statements_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "credit_notes_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "credit_notes_approved_by_users_id_fk"
		}),
	unique("credit_notes_credit_note_no_unique").on(table.creditNoteNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const debitNotes = pgTable("debit_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	debitNoteNo: varchar("debit_note_no", { length: 50 }).notNull(),
	supplierId: uuid("supplier_id").notNull(),
	supplierName: varchar("supplier_name", { length: 100 }).notNull(),
	purchaseOrderId: uuid("purchase_order_id"),
	apStatementId: uuid("ap_statement_id"),
	type: varchar({ length: 20 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	reason: varchar({ length: 200 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('DRAFT').notNull(),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_debit_notes_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_debit_notes_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_debit_notes_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "debit_notes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "debit_notes_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrders.id],
			name: "debit_notes_purchase_order_id_purchase_orders_id_fk"
		}),
	foreignKey({
			columns: [table.apStatementId],
			foreignColumns: [apSupplierStatements.id],
			name: "debit_notes_ap_statement_id_ap_supplier_statements_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "debit_notes_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "debit_notes_approved_by_users_id_fk"
		}),
	unique("debit_notes_debit_note_no_unique").on(table.debitNoteNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const financeConfigs = pgTable("finance_configs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	configKey: varchar("config_key", { length: 100 }).notNull(),
	configValue: text("config_value").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_finance_configs_key").using("btree", table.configKey.asc().nullsLast().op("text_ops")),
	index("idx_finance_configs_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "finance_configs_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const apSupplierStatements = pgTable("ap_supplier_statements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	statementNo: varchar("statement_no", { length: 50 }).notNull(),
	purchaseOrderId: uuid("purchase_order_id").notNull(),
	supplierId: uuid("supplier_id").notNull(),
	supplierName: varchar("supplier_name", { length: 100 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	paidAmount: numeric("paid_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	pendingAmount: numeric("pending_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	invoiceNo: varchar("invoice_no", { length: 100 }),
	invoicedAt: timestamp("invoiced_at", { withTimezone: true, mode: 'string' }),
	invoiceAmount: numeric("invoice_amount", { precision: 12, scale:  2 }),
	taxRate: numeric("tax_rate", { precision: 5, scale:  4 }),
	taxAmount: numeric("tax_amount", { precision: 12, scale:  2 }),
	isTaxInclusive: boolean("is_tax_inclusive").default(false),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	purchaserId: uuid("purchaser_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ap_supplier_statements_po").using("btree", table.purchaseOrderId.asc().nullsLast().op("uuid_ops")),
	index("idx_ap_supplier_statements_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_ap_supplier_statements_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "ap_supplier_statements_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrders.id],
			name: "ap_supplier_statements_purchase_order_id_purchase_orders_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "ap_supplier_statements_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.purchaserId],
			foreignColumns: [users.id],
			name: "ap_supplier_statements_purchaser_id_users_id_fk"
		}),
	unique("ap_supplier_statements_statement_no_unique").on(table.statementNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const internalTransfers = pgTable("internal_transfers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	transferNo: varchar("transfer_no", { length: 50 }).notNull(),
	fromAccountId: uuid("from_account_id").notNull(),
	toAccountId: uuid("to_account_id").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	fromTransactionId: uuid("from_transaction_id"),
	toTransactionId: uuid("to_transaction_id"),
	status: varchar({ length: 20 }).default('PENDING').notNull(),
	remark: text(),
	createdBy: uuid("created_by").notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_internal_transfers_from").using("btree", table.fromAccountId.asc().nullsLast().op("uuid_ops")),
	index("idx_internal_transfers_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_internal_transfers_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_internal_transfers_to").using("btree", table.toAccountId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "internal_transfers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.fromAccountId],
			foreignColumns: [financeAccounts.id],
			name: "internal_transfers_from_account_id_finance_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.toAccountId],
			foreignColumns: [financeAccounts.id],
			name: "internal_transfers_to_account_id_finance_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.fromTransactionId],
			foreignColumns: [accountTransactions.id],
			name: "internal_transfers_from_transaction_id_account_transactions_id_"
		}),
	foreignKey({
			columns: [table.toTransactionId],
			foreignColumns: [accountTransactions.id],
			name: "internal_transfers_to_transaction_id_account_transactions_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "internal_transfers_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "internal_transfers_approved_by_users_id_fk"
		}),
	unique("internal_transfers_transfer_no_unique").on(table.transferNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const paymentBillItems = pgTable("payment_bill_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	paymentBillId: uuid("payment_bill_id").notNull(),
	statementType: varchar("statement_type", { length: 50 }).notNull(),
	statementId: uuid("statement_id").notNull(),
	statementNo: varchar("statement_no", { length: 50 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_bill_items_bill").using("btree", table.paymentBillId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_bill_items_statement").using("btree", table.statementId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payment_bill_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.paymentBillId],
			foreignColumns: [paymentBills.id],
			name: "payment_bill_items_payment_bill_id_payment_bills_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const paymentOrderItems = pgTable("payment_order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	paymentOrderId: uuid("payment_order_id").notNull(),
	orderId: uuid("order_id").notNull(),
	statementId: uuid("statement_id"),
	scheduleId: uuid("schedule_id"),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_order_items_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_order_items_payment").using("btree", table.paymentOrderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payment_order_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.paymentOrderId],
			foreignColumns: [paymentOrders.id],
			name: "payment_order_items_payment_order_id_payment_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payment_order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.statementId],
			foreignColumns: [arStatements.id],
			name: "payment_order_items_statement_id_ar_statements_id_fk"
		}),
	foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [paymentSchedules.id],
			name: "payment_order_items_schedule_id_payment_schedules_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const financeAccounts = pgTable("finance_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	accountNo: varchar("account_no", { length: 50 }).notNull(),
	accountName: varchar("account_name", { length: 100 }).notNull(),
	accountType: varchar("account_type", { length: 20 }).notNull(),
	accountNumber: varchar("account_number", { length: 100 }),
	bankName: varchar("bank_name", { length: 100 }),
	branchName: varchar("branch_name", { length: 100 }),
	holderName: varchar("holder_name", { length: 100 }).notNull(),
	balance: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("idx_finance_accounts_no_tenant").using("btree", table.accountNo.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_finance_accounts_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "finance_accounts_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const arStatements = pgTable("ar_statements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	statementNo: varchar("statement_no", { length: 50 }).notNull(),
	orderId: uuid("order_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	settlementType: varchar("settlement_type", { length: 20 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	receivedAmount: numeric("received_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	pendingAmount: numeric("pending_amount", { precision: 12, scale:  2 }).notNull(),
	status: arStatementStatus().notNull(),
	invoiceNo: varchar("invoice_no", { length: 100 }),
	invoicedAt: timestamp("invoiced_at", { withTimezone: true, mode: 'string' }),
	taxRate: numeric("tax_rate", { precision: 5, scale:  4 }),
	taxAmount: numeric("tax_amount", { precision: 12, scale:  2 }),
	isTaxInclusive: boolean("is_tax_inclusive").default(false),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	salesId: uuid("sales_id").notNull(),
	channelId: uuid("channel_id"),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  4 }),
	commissionAmount: numeric("commission_amount", { precision: 12, scale:  2 }),
	commissionStatus: commissionStatus("commission_status"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ar_statements_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_ar_statements_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_ar_statements_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_ar_statements_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "ar_statements_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "ar_statements_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "ar_statements_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.salesId],
			foreignColumns: [users.id],
			name: "ar_statements_sales_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [marketChannels.id],
			name: "ar_statements_channel_id_market_channels_id_fk"
		}),
	unique("ar_statements_statement_no_unique").on(table.statementNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const commissionRecords = pgTable("commission_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	commissionNo: varchar("commission_no", { length: 50 }).notNull(),
	arStatementId: uuid("ar_statement_id").notNull(),
	orderId: uuid("order_id").notNull(),
	channelId: uuid("channel_id").notNull(),
	channelName: varchar("channel_name", { length: 100 }).notNull(),
	cooperationMode: varchar("cooperation_mode", { length: 20 }).notNull(),
	orderAmount: numeric("order_amount", { precision: 12, scale:  2 }).notNull(),
	commissionRate: numeric("commission_rate", { precision: 5, scale:  4 }).notNull(),
	commissionAmount: numeric("commission_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	calculatedAt: timestamp("calculated_at", { withTimezone: true, mode: 'string' }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_commission_records_ar").using("btree", table.arStatementId.asc().nullsLast().op("uuid_ops")),
	index("idx_commission_records_channel").using("btree", table.channelId.asc().nullsLast().op("uuid_ops")),
	index("idx_commission_records_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "commission_records_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.arStatementId],
			foreignColumns: [arStatements.id],
			name: "commission_records_ar_statement_id_ar_statements_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "commission_records_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [marketChannels.id],
			name: "commission_records_channel_id_market_channels_id_fk"
		}),
	unique("commission_records_commission_no_unique").on(table.commissionNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const paymentBills = pgTable("payment_bills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	paymentNo: varchar("payment_no", { length: 50 }).notNull(),
	type: varchar({ length: 20 }).default('SUPPLIER'),
	payeeType: varchar("payee_type", { length: 20 }).notNull(),
	payeeId: uuid("payee_id").notNull(),
	payeeName: varchar("payee_name", { length: 100 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
	accountId: uuid("account_id"),
	proofUrl: text("proof_url").notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	recordedBy: uuid("recorded_by").notNull(),
	remark: text(),
	isVerified: boolean("is_verified").default(false),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_bills_payee").using("btree", table.payeeId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_bills_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payment_bills_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [financeAccounts.id],
			name: "payment_bills_account_id_finance_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.recordedBy],
			foreignColumns: [users.id],
			name: "payment_bills_recorded_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "payment_bills_verified_by_users_id_fk"
		}),
	unique("payment_bills_payment_no_unique").on(table.paymentNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const reconciliationDetails = pgTable("reconciliation_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	reconciliationId: uuid("reconciliation_id").notNull(),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	documentId: uuid("document_id").notNull(),
	documentNo: varchar("document_no", { length: 50 }).notNull(),
	documentAmount: numeric("document_amount", { precision: 12, scale:  2 }).notNull(),
	reconciliationAmount: numeric("reconciliation_amount", { precision: 12, scale:  2 }).notNull(),
	difference: numeric({ precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_reconciliation_details_doc").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_reconciliation_details_recon").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "reconciliation_details_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.reconciliationId],
			foreignColumns: [reconciliations.id],
			name: "reconciliation_details_reconciliation_id_reconciliations_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const reconciliations = pgTable("reconciliations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	reconciliationNo: varchar("reconciliation_no", { length: 50 }).notNull(),
	reconciliationType: varchar("reconciliation_type", { length: 20 }).notNull(),
	targetType: varchar("target_type", { length: 20 }).notNull(),
	targetId: uuid("target_id").notNull(),
	targetName: varchar("target_name", { length: 100 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	matchedAmount: numeric("matched_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	unmatchedAmount: numeric("unmatched_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	status: varchar({ length: 20 }).notNull(),
	reconciledAt: timestamp("reconciled_at", { withTimezone: true, mode: 'string' }),
	confirmedBy: uuid("confirmed_by"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_reconciliations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_reconciliations_target").using("btree", table.targetId.asc().nullsLast().op("uuid_ops")),
	index("idx_reconciliations_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "reconciliations_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [users.id],
			name: "reconciliations_confirmed_by_users_id_fk"
		}),
	unique("reconciliations_reconciliation_no_unique").on(table.reconciliationNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const statementConfirmationDetails = pgTable("statement_confirmation_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	confirmationId: uuid("confirmation_id").notNull(),
	documentType: varchar("document_type", { length: 30 }).notNull(),
	documentId: uuid("document_id").notNull(),
	documentNo: varchar("document_no", { length: 50 }).notNull(),
	documentDate: date("document_date").notNull(),
	documentAmount: numeric("document_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('PENDING').notNull(),
	disputeReason: text("dispute_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_statement_confirmation_details_confirmation").using("btree", table.confirmationId.asc().nullsLast().op("uuid_ops")),
	index("idx_statement_confirmation_details_doc").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "statement_confirmation_details_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.confirmationId],
			foreignColumns: [statementConfirmations.id],
			name: "statement_confirmation_details_confirmation_id_statement_confir"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const statementConfirmations = pgTable("statement_confirmations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	confirmationNo: varchar("confirmation_no", { length: 50 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	targetId: uuid("target_id").notNull(),
	targetName: varchar("target_name", { length: 100 }).notNull(),
	periodStart: date("period_start").notNull(),
	periodEnd: date("period_end").notNull(),
	periodLabel: varchar("period_label", { length: 50 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	confirmedAmount: numeric("confirmed_amount", { precision: 12, scale:  2 }).default('0'),
	disputedAmount: numeric("disputed_amount", { precision: 12, scale:  2 }).default('0'),
	status: varchar({ length: 20 }).default('PENDING').notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	confirmedBy: varchar("confirmed_by", { length: 100 }),
	remark: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_statement_confirmations_period").using("btree", table.periodStart.asc().nullsLast().op("date_ops"), table.periodEnd.asc().nullsLast().op("date_ops")),
	index("idx_statement_confirmations_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_statement_confirmations_target").using("btree", table.targetId.asc().nullsLast().op("uuid_ops")),
	index("idx_statement_confirmations_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "statement_confirmations_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "statement_confirmations_created_by_users_id_fk"
		}),
	unique("statement_confirmations_confirmation_no_unique").on(table.confirmationNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const approvalDelegations = pgTable("approval_delegations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	delegatorId: uuid("delegator_id").notNull(),
	delegateeId: uuid("delegatee_id").notNull(),
	type: delegationType().default('GLOBAL'),
	flowId: uuid("flow_id"),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	reason: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approval_delegations_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_approval_delegations_delegatee").using("btree", table.delegateeId.asc().nullsLast().op("uuid_ops")),
	index("idx_approval_delegations_delegator").using("btree", table.delegatorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "approval_delegations_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.delegatorId],
			foreignColumns: [users.id],
			name: "approval_delegations_delegator_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.delegateeId],
			foreignColumns: [users.id],
			name: "approval_delegations_delegatee_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [approvalFlows.id],
			name: "approval_delegations_flow_id_approval_flows_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const approvalFlows = pgTable("approval_flows", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	definition: jsonb().default({"edges":[],"nodes":[]}),
}, (table) => [
	index("idx_approval_flows_tenant_code").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "approval_flows_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const approvalNodes = pgTable("approval_nodes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	flowId: uuid("flow_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	approverRole: approverRole("approver_role"),
	approverUserId: uuid("approver_user_id"),
	nodeType: varchar("node_type", { length: 20 }).default('APPROVAL'),
	approverMode: approvalNodeMode("approver_mode").default('ANY'),
	timeoutHours: integer("timeout_hours"),
	timeoutAction: approvalTimeoutAction("timeout_action").default('REMIND'),
	minAmount: numeric("min_amount", { precision: 12, scale:  2 }),
	maxAmount: numeric("max_amount", { precision: 12, scale:  2 }),
	conditions: jsonb().default([]),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approval_nodes_flow").using("btree", table.flowId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "approval_nodes_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [approvalFlows.id],
			name: "approval_nodes_flow_id_approval_flows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approverUserId],
			foreignColumns: [users.id],
			name: "approval_nodes_approver_user_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const approvalTasks = pgTable("approval_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	approvalId: uuid("approval_id").notNull(),
	nodeId: uuid("node_id"),
	approverId: uuid("approver_id"),
	status: varchar({ length: 50 }).default('PENDING'),
	comment: text(),
	isDynamic: boolean("is_dynamic").default(false),
	parentTaskId: uuid("parent_task_id"),
	actionAt: timestamp("action_at", { withTimezone: true, mode: 'string' }),
	timeoutAt: timestamp("timeout_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approval_tasks_approval").using("btree", table.approvalId.asc().nullsLast().op("uuid_ops")),
	index("idx_approval_tasks_approver").using("btree", table.approverId.asc().nullsLast().op("uuid_ops")),
	index("idx_approval_tasks_timeout").using("btree", table.timeoutAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "approval_tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.approvalId],
			foreignColumns: [approvals.id],
			name: "approval_tasks_approval_id_approvals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nodeId],
			foreignColumns: [approvalNodes.id],
			name: "approval_tasks_node_id_approval_nodes_id_fk"
		}),
	foreignKey({
			columns: [table.approverId],
			foreignColumns: [users.id],
			name: "approval_tasks_approver_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.parentTaskId],
			foreignColumns: [table.id],
			name: "approval_tasks_parent_task_id_approval_tasks_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const paymentOrders = pgTable("payment_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	paymentNo: varchar("payment_no", { length: 50 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	customerId: uuid("customer_id"),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	usedAmount: numeric("used_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	remainingAmount: numeric("remaining_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
	accountId: uuid("account_id"),
	proofUrl: text("proof_url").notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }).notNull(),
	remark: text(),
	createdBy: uuid("created_by").notNull(),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payment_orders_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_payment_orders_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payment_orders_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "payment_orders_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [financeAccounts.id],
			name: "payment_orders_account_id_finance_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "payment_orders_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "payment_orders_verified_by_users_id_fk"
		}),
	unique("payment_orders_payment_no_unique").on(table.paymentNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const receiptBillItems = pgTable("receipt_bill_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	receiptBillId: uuid("receipt_bill_id").notNull(),
	orderId: uuid("order_id").notNull(),
	statementId: uuid("statement_id"),
	scheduleId: uuid("schedule_id"),
	orderNo: varchar("order_no", { length: 50 }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_receipt_bill_items_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_receipt_bill_items_receipt").using("btree", table.receiptBillId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "receipt_bill_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.receiptBillId],
			foreignColumns: [receiptBills.id],
			name: "receipt_bill_items_receipt_bill_id_receipt_bills_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "receipt_bill_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.statementId],
			foreignColumns: [arStatements.id],
			name: "receipt_bill_items_statement_id_ar_statements_id_fk"
		}),
	foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [paymentSchedules.id],
			name: "receipt_bill_items_schedule_id_payment_schedules_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const receiptBills = pgTable("receipt_bills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	receiptNo: varchar("receipt_no", { length: 50 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	customerId: uuid("customer_id"),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	usedAmount: numeric("used_amount", { precision: 12, scale:  2 }).default('0').notNull(),
	remainingAmount: numeric("remaining_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
	accountId: uuid("account_id"),
	proofUrl: text("proof_url").notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }).notNull(),
	remark: text(),
	createdBy: uuid("created_by").notNull(),
	verifiedBy: uuid("verified_by"),
	verifiedAt: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_receipt_bills_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_receipt_bills_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_receipt_bills_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "receipt_bills_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "receipt_bills_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [financeAccounts.id],
			name: "receipt_bills_account_id_finance_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "receipt_bills_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "receipt_bills_verified_by_users_id_fk"
		}),
	unique("receipt_bills_receipt_no_unique").on(table.receiptNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const liabilityNotices = pgTable("liability_notices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	noticeNo: varchar("notice_no", { length: 50 }).notNull(),
	afterSalesId: uuid("after_sales_id").notNull(),
	liablePartyType: liablePartyType("liable_party_type").notNull(),
	liablePartyId: uuid("liable_party_id"),
	liablePartyCredit: jsonb("liable_party_credit"),
	reason: text().notNull(),
	liabilityReasonCategory: liabilityReasonCategory("liability_reason_category"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	costItems: jsonb("cost_items"),
	sourcePurchaseOrderId: uuid("source_purchase_order_id"),
	sourceInstallTaskId: uuid("source_install_task_id"),
	status: liabilityStatus().default('DRAFT').notNull(),
	evidencePhotos: text("evidence_photos").array(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	confirmedBy: uuid("confirmed_by"),
	disputeReason: text("dispute_reason"),
	disputeEvidence: text("dispute_evidence").array(),
	arbitrationResult: text("arbitration_result"),
	arbitratedBy: uuid("arbitrated_by"),
	arbitratedAt: timestamp("arbitrated_at", { withTimezone: true, mode: 'string' }),
	financeStatus: varchar("finance_status", { length: 20 }).default('PENDING'),
	financeStatementId: uuid("finance_statement_id"),
	financeSyncedAt: timestamp("finance_synced_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_ln_after_sales").using("btree", table.afterSalesId.asc().nullsLast().op("uuid_ops")),
	index("idx_ln_notice_no").using("btree", table.noticeNo.asc().nullsLast().op("text_ops")),
	index("idx_ln_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "liability_notices_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.afterSalesId],
			foreignColumns: [afterSalesTickets.id],
			name: "liability_notices_after_sales_id_after_sales_tickets_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.sourcePurchaseOrderId],
			foreignColumns: [purchaseOrders.id],
			name: "liability_notices_source_purchase_order_id_purchase_orders_id_f"
		}),
	foreignKey({
			columns: [table.sourceInstallTaskId],
			foreignColumns: [installTasks.id],
			name: "liability_notices_source_install_task_id_install_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [users.id],
			name: "liability_notices_confirmed_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.arbitratedBy],
			foreignColumns: [users.id],
			name: "liability_notices_arbitrated_by_users_id_fk"
		}),
	unique("liability_notices_notice_no_unique").on(table.noticeNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const approvals = pgTable("approvals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	flowId: uuid("flow_id"),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	status: varchar({ length: 50 }).default('PENDING'),
	requesterId: uuid("requester_id").notNull(),
	currentNodeId: uuid("current_node_id"),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_approvals_entity").using("btree", table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_approvals_requester").using("btree", table.requesterId.asc().nullsLast().op("uuid_ops")),
	index("idx_approvals_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_approvals_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "approvals_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [approvalFlows.id],
			name: "approvals_flow_id_approval_flows_id_fk"
		}),
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "approvals_requester_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.currentNodeId],
			foreignColumns: [approvalNodes.id],
			name: "approvals_current_node_id_approval_nodes_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	tableName: text("table_name").notNull(),
	recordId: text("record_id").notNull(),
	action: text().notNull(),
	userId: uuid("user_id"),
	changedFields: jsonb("changed_fields"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_logs_table").using("btree", table.tableName.asc().nullsLast().op("text_ops")),
	index("idx_audit_logs_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "audit_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: uuid("user_id").notNull(),
	notificationType: varchar("notification_type", { length: 50 }).notNull(),
	channels: jsonb().default([]),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notif_prefs_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "notification_preferences_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_preferences_user_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const notificationQueue = pgTable("notification_queue", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	templateId: uuid("template_id"),
	templateCode: varchar("template_code", { length: 50 }),
	userId: uuid("user_id"),
	targetPhone: varchar("target_phone", { length: 20 }),
	targetEmail: varchar("target_email", { length: 100 }),
	channel: varchar({ length: 20 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	status: varchar({ length: 20 }).default('PENDING'),
	priority: varchar({ length: 20 }).default('NORMAL'),
	retryCount: varchar("retry_count", { length: 10 }).default('0'),
	maxRetries: varchar("max_retries", { length: 10 }).default('3'),
	lastError: text("last_error"),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notif_queue_scheduled").using("btree", table.scheduledAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notif_queue_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_notif_queue_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "notification_queue_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [notificationTemplates.id],
			name: "notification_queue_template_id_notification_templates_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_queue_user_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const notificationTemplates = pgTable("notification_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	notificationType: varchar("notification_type", { length: 50 }).notNull(),
	channels: jsonb().default(["IN_APP"]),
	titleTemplate: varchar("title_template", { length: 200 }).notNull(),
	contentTemplate: text("content_template").notNull(),
	smsTemplate: varchar("sms_template", { length: 500 }),
	wechatTemplateId: varchar("wechat_template_id", { length: 100 }),
	paramMapping: jsonb("param_mapping"),
	isActive: boolean("is_active").default(true),
	priority: varchar({ length: 20 }).default('NORMAL'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notif_template_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("idx_notif_template_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "notification_templates_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text(),
	type: varchar({ length: 50 }).default('SYSTEM'),
	channel: varchar({ length: 20 }).default('IN_APP'),
	isRead: boolean("is_read").default(false),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	linkUrl: text("link_url"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notifications_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_notifications_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "notifications_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const systemAnnouncements = pgTable("system_announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id"),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	type: varchar({ length: 50 }).default('INFO'),
	targetRoles: jsonb("target_roles"),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }),
	isPinned: boolean("is_pinned").default(false),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_announce_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_announce_time").using("btree", table.startAt.asc().nullsLast().op("timestamptz_ops"), table.endAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "system_announcements_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "system_announcements_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const loyaltyTransactions = pgTable("loyalty_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	source: varchar({ length: 50 }).notNull(),
	points: integer().notNull(),
	balanceAfter: integer("balance_after").notNull(),
	referenceType: varchar("reference_type", { length: 50 }),
	referenceId: uuid("reference_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_loyalty_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_loyalty_ref").using("btree", table.referenceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "loyalty_transactions_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "loyalty_transactions_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "loyalty_transactions_created_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const afterSalesTickets = pgTable("after_sales_tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	ticketNo: varchar("ticket_no", { length: 50 }).notNull(),
	orderId: uuid("order_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	installTaskId: uuid("install_task_id"),
	type: varchar({ length: 50 }).notNull(),
	status: afterSalesStatus().default('PENDING').notNull(),
	priority: varchar({ length: 20 }).default('MEDIUM'),
	description: text(),
	photos: text().array(),
	resolution: text(),
	estimatedCost: numeric("estimated_cost", { precision: 12, scale:  2 }),
	totalActualCost: numeric("total_actual_cost", { precision: 12, scale:  2 }).default('0.00'),
	actualDeduction: numeric("actual_deduction", { precision: 12, scale:  2 }).default('0.00'),
	internalLoss: numeric("internal_loss", { precision: 12, scale:  2 }).default('0.00'),
	isWarranty: boolean("is_warranty").default(true),
	satisfaction: integer(),
	channelSatisfaction: integer("channel_satisfaction"),
	assignedTo: uuid("assigned_to"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	slaResponseDeadline: timestamp("sla_response_deadline", { withTimezone: true, mode: 'string' }),
	slaVisitDeadline: timestamp("sla_visit_deadline", { withTimezone: true, mode: 'string' }),
	slaClosureDeadline: timestamp("sla_closure_deadline", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_as_assigned_to").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_as_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_as_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_as_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_as_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_as_ticket_no").using("btree", table.ticketNo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "after_sales_tickets_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "after_sales_tickets_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "after_sales_tickets_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.installTaskId],
			foreignColumns: [installTasks.id],
			name: "after_sales_tickets_install_task_id_install_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "after_sales_tickets_assigned_to_users_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "after_sales_tickets_created_by_users_id_fk"
		}),
	unique("after_sales_tickets_ticket_no_unique").on(table.ticketNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const workerSkills = pgTable("worker_skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	workerId: uuid("worker_id").notNull(),
	skillType: workerSkillType("skill_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_worker_skills_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_worker_skills_worker").using("btree", table.workerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "worker_skills_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.workerId],
			foreignColumns: [users.id],
			name: "worker_skills_worker_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const systemSettings = pgTable("system_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	category: varchar({ length: 50 }).notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text().notNull(),
	valueType: varchar("value_type", { length: 20 }).notNull(),
	description: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedBy: uuid("updated_by"),
}, (table) => [
	index("idx_system_settings_category").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.category.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_system_settings_tenant_key").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.key.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "system_settings_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "system_settings_updated_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const systemSettingsHistory = pgTable("system_settings_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	settingId: uuid("setting_id").notNull(),
	key: varchar({ length: 100 }).notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value").notNull(),
	changedBy: uuid("changed_by").notNull(),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_system_settings_history_setting").using("btree", table.settingId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "system_settings_history_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.settingId],
			foreignColumns: [systemSettings.id],
			name: "system_settings_history_setting_id_system_settings_id_fk"
		}),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "system_settings_history_changed_by_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const quotePlanItems = pgTable("quote_plan_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id").notNull(),
	templateId: uuid("template_id").notNull(),
	overridePrice: numeric("override_price", { precision: 10, scale:  2 }),
	role: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.planId],
			foreignColumns: [quotePlans.id],
			name: "quote_plan_items_plan_id_quote_plans_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [productTemplates.id],
			name: "quote_plan_items_template_id_product_templates_id_fk"
		}),
]);

export const packageProducts = pgTable("package_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	packageId: uuid("package_id").notNull(),
	productId: uuid("product_id").notNull(),
	isRequired: boolean("is_required").default(false),
	minQuantity: numeric("min_quantity", { precision: 10, scale:  2 }),
	maxQuantity: numeric("max_quantity", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_package_products_package").using("btree", table.packageId.asc().nullsLast().op("uuid_ops")),
	index("idx_package_products_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.packageId],
			foreignColumns: [productPackages.id],
			name: "package_products_package_id_product_packages_id_fk"
		}),
]);

export const quoteConfig = pgTable("quote_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: text().notNull(),
	entityId: uuid("entity_id").notNull(),
	config: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	updatedBy: uuid("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "quote_config_updated_by_users_id_fk"
		}),
]);

export const inventory = pgTable("inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	warehouseId: uuid("warehouse_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().default(0).notNull(),
	minStock: integer("min_stock").default(0),
	location: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_inventory_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_inventory_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_inventory_warehouse").using("btree", table.warehouseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "inventory_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "inventory_warehouse_id_warehouses_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inventory_product_id_products_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const warehouses = pgTable("warehouses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	address: text(),
	managerId: uuid("manager_id"),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_warehouses_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "warehouses_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [users.id],
			name: "warehouses_manager_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const inventoryLogs = pgTable("inventory_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	warehouseId: uuid("warehouse_id").notNull(),
	productId: uuid("product_id").notNull(),
	type: inventoryLogType().notNull(),
	quantity: integer().notNull(),
	balanceAfter: integer("balance_after").notNull(),
	reason: text(),
	referenceType: text("reference_type"),
	referenceId: uuid("reference_id"),
	operatorId: uuid("operator_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_inventory_logs_created").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_inventory_logs_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("idx_inventory_logs_warehouse").using("btree", table.warehouseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "inventory_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.warehouseId],
			foreignColumns: [warehouses.id],
			name: "inventory_logs_warehouse_id_warehouses_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inventory_logs_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.operatorId],
			foreignColumns: [users.id],
			name: "inventory_logs_operator_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const verificationCodes = pgTable("verification_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	phone: varchar({ length: 20 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	type: verificationCodeType().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	ip: varchar({ length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "verification_codes_user_id_users_id_fk"
		}),
]);

export const laborRates = pgTable("labor_rates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	entityType: laborRateEntityType("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	category: laborCategory().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).default('0').notNull(),
	baseFee: numeric("base_fee", { precision: 10, scale:  2 }).default('0').notNull(),
	unitType: laborUnitType("unit_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_labor_rates_entity").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_labor_rates_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "labor_rates_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	orderId: uuid("order_id").notNull(),
	quoteItemId: uuid("quote_item_id").notNull(),
	roomName: varchar("room_name", { length: 100 }).notNull(),
	productId: uuid("product_id").notNull(),
	productName: varchar("product_name", { length: 200 }).notNull(),
	category: productCategory().notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	width: numeric({ precision: 10, scale:  2 }),
	height: numeric({ precision: 10, scale:  2 }),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	poId: uuid("po_id"),
	supplierId: uuid("supplier_id"),
	status: orderItemStatus().default('PENDING'),
	remark: text(),
	sortOrder: integer("sort_order").default(0),
	attributes: jsonb().default({}),
	calculationParams: jsonb("calculation_params"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_order_items_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "order_items_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.quoteItemId],
			foreignColumns: [quoteItems.id],
			name: "order_items_quote_item_id_quote_items_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.poId],
			foreignColumns: [purchaseOrders.id],
			name: "order_items_po_id_purchase_orders_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "order_items_supplier_id_suppliers_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	permissions: jsonb().default([]),
	isSystem: boolean("is_system").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "roles_tenant_id_tenants_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const workOrders = pgTable("work_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	woNo: varchar("wo_no", { length: 50 }).notNull(),
	orderId: uuid("order_id").notNull(),
	poId: uuid("po_id").notNull(),
	supplierId: uuid("supplier_id").notNull(),
	status: workOrderStatus().default('PENDING'),
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	remark: text(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_work_orders_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_work_orders_po").using("btree", table.poId.asc().nullsLast().op("uuid_ops")),
	index("idx_work_orders_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "work_orders_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "work_orders_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.poId],
			foreignColumns: [purchaseOrders.id],
			name: "work_orders_po_id_purchase_orders_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "work_orders_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "work_orders_created_by_users_id_fk"
		}),
	unique("work_orders_wo_no_unique").on(table.woNo),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);

export const customerMergeLogs = pgTable("customer_merge_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	primaryCustomerId: uuid("primary_customer_id").notNull(),
	mergedCustomerIds: uuid("merged_customer_ids").array().notNull(),
	operatorId: uuid("operator_id").notNull(),
	fieldConflicts: jsonb("field_conflicts"),
	affectedTables: text("affected_tables").array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_merge_logs_primary").using("btree", table.primaryCustomerId.asc().nullsLast().op("uuid_ops")),
	index("idx_merge_logs_tenant").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customer_merge_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.primaryCustomerId],
			foreignColumns: [customers.id],
			name: "customer_merge_logs_primary_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.operatorId],
			foreignColumns: [users.id],
			name: "customer_merge_logs_operator_id_users_id_fk"
		}),
	pgPolicy("tenant_isolation_policy", { as: "permissive", for: "all", to: ["public"], using: sql`(tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)` }),
]);
