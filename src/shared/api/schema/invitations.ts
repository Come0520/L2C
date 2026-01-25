import { pgTable, uuid, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

export const invitationRoleEnum = pgEnum('invitation_role', [
  'admin',
  'sales',
  'installer',
  'customer', // less common to invite customer via code, but possible
]);

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  inviterId: uuid('inviter_id')
    .references(() => users.id)
    .notNull(),
  code: varchar('code', { length: 10 }).unique().notNull(), // 6-digit numeric or alphanumeric
  role: varchar('role', { length: 50 }).notNull(), // Using varchar to be flexible or map to invitationRoleEnum
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  maxUses: varchar('max_uses', { length: 10 }).default('1'), // 'unlimited' or number
  usedCount: varchar('used_count', { length: 10 }).default('0'), // Track usage
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
