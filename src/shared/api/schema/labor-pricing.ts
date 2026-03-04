import { pgTable, uuid, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './infrastructure';
import { laborRateEntityTypeEnum, laborCategoryEnum, laborUnitTypeEnum } from './enums';

export const laborRates = pgTable(
  'labor_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),

    // Entity to which this rate applies
    entityType: laborRateEntityTypeEnum('entity_type').notNull(), // 'TENANT' (default) or 'WORKER'
    entityId: uuid('entity_id').notNull(), // tenantId or workerId

    // Pricing rule
    category: laborCategoryEnum('category').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull().default('0'),
    baseFee: decimal('base_fee', { precision: 10, scale: 2 }).notNull().default('0'), // Startup fee
    unitType: laborUnitTypeEnum('unit_type').notNull(),

    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    laborRatesTenantIdx: index('idx_labor_rates_tenant').on(table.tenantId),
    laborRatesEntityIdx: index('idx_labor_rates_entity').on(table.entityType, table.entityId),
  })
);
