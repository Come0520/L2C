import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { workerSkillTypeEnum } from './enums';

/**
 * 师傅技能关联表
 * 记录每个师傅可以承接的任务类型（二元标签模式）
 */
export const workerSkills = pgTable('worker_skills', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    workerId: uuid('worker_id').references(() => users.id).notNull(),
    skillType: workerSkillTypeEnum('skill_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    workerSkillsTenantIdx: index('idx_worker_skills_tenant').on(table.tenantId),
    workerSkillsWorkerIdx: index('idx_worker_skills_worker').on(table.workerId),
}));
