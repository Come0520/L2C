import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './infrastructure';

export const verificationCodeTypeEnum = pgEnum('verification_code_type', [
  'LOGIN_MFA',
  'PASSWORD_RESET',
  'BIND_PHONE',
  'MAGIC_LOGIN',
]);

export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  phone: varchar('phone', { length: 20 }), // Made optional
  email: varchar('email', { length: 255 }), // Added for email resets
  code: varchar('code', { length: 10 }).notNull(),
  token: varchar('token', { length: 255 }), // Added for unique reset link tokens
  type: verificationCodeTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false),
  // 审计字段 (H4 统一追加)
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  ip: varchar('ip', { length: 50 }), // Optional: Record IP for security audit
});
