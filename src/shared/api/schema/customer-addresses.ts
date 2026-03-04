import { pgTable, uuid, varchar, boolean, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { tenants } from './infrastructure';

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id)
      .notNull(),

    label: varchar('label', { length: 50 }), // e.g., 'Home', 'Office'

    province: varchar('province', { length: 50 }),
    city: varchar('city', { length: 50 }),
    district: varchar('district', { length: 50 }),
    community: varchar('community', { length: 100 }),
    address: varchar('address', { length: 255 }).notNull(), // Detailed address

    isDefault: boolean('is_default').default(false),
    version: integer('version').default(0).notNull(),

    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    custAddrCustomerIdx: index('idx_cust_addresses_customer').on(table.customerId),
  })
);
