import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './infrastructure';

export const quoteConfig = pgTable('quote_config', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(), // 'USER' | 'TENANT' | 'SYSTEM'
    entityId: uuid('entity_id').notNull(), // userId or tenantId

    // JSONB for flexible config
    // { 
    //   mode: 'simple' | 'advanced', 
    //   visibleFields: ['foldRatio', 'processFee', ...],
    //   defaultLoss: { curtain: { side: 10, ... } } 
    // }
    config: jsonb('config').notNull().default('{}'),

    updatedAt: timestamp('updated_at').defaultNow(),
    updatedBy: uuid('updated_by').references(() => users.id),
});
