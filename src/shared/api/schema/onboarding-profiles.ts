import { pgTable, uuid, varchar, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

// ============ 枚举定义 ============

/**
 * 租户初始化引导状态
 *
 * - pending: 待填写（BOSS 首次登录时拦截）
 * - completed: 已完成问卷并应用了推荐配置
 * - skipped: 用户主动跳过，选择自行配置
 */
export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'pending',
  'completed',
  'skipped',
]);

/**
 * 系统推荐的配置模版类型
 *
 * 由问卷答案组合推导而出，决定初始化的角色、权限、审批流配置
 */
export const profileTemplateEnum = pgEnum('profile_template', [
  'ONE_MAN_ARMY', // 一人战神模式
  'PARALLEL_PARTNERS', // 小微协作 - 平行合伙人
  'FRONT_BACK_SPLIT', // 小微协作 - 前后端分工
  'IN_OUT_SPLIT', // 小微协作 - 主外主内 (夫妻店)
  'STANDARD_CORP', // 标准企业模式
]);

// ============ 数据表定义 ============

/**
 * 租户初始化配置画像表
 *
 * 记录新租户在首次登录引导流程中提交的问卷答案及最终应用的配置模版。
 * 该表同时兼顾 BI 分析需求，将关键业务特征提取为独立列以方便聚合查询。
 */
export const tenantProfiles = pgTable('tenant_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** 关联租户 */
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull()
    .unique(),

  /** 填写问卷的用户（通常是申请入驻的 BOSS） */
  submittedBy: uuid('submitted_by').references(() => users.id),

  // ─── 问卷原始数据 ───

  /** 问卷完整答案的 JSON 快照，保留所有原始选项 */
  questionnaireRaw: jsonb('questionnaire_raw').default({}),

  // ─── 模版推荐 ───

  /** 系统根据问卷答案推导出的推荐模版 */
  recommendedTemplate: profileTemplateEnum('recommended_template'),

  /** 最终实际应用的模版（用户可能选择了"自行配置"，则为 null） */
  appliedTemplate: profileTemplateEnum('applied_template'),

  // ─── 关键业务特征（快照列，方便 BI） ───

  /** 团队规模档位，例如 '1', '2', '3', '4', '5', '6-10', '11-15', '15+' */
  teamSize: varchar('team_size', { length: 20 }),

  /** 协作模式描述（仅 2-5 人时填写），如 'parallel', 'front_back', 'in_out' */
  collaborationMode: varchar('collaboration_mode', { length: 50 }),

  /** 销售架构类型（仅 6 人以上填写），如 'flat', 'sales_lead', 'manager' */
  salesStructure: varchar('sales_structure', { length: 50 }),

  /** 是否有专职财务/内勤 */
  hasDedicatedFinance: boolean('has_dedicated_finance').default(false),

  /** 是否有专职派单员 */
  hasDedicatedDispatch: boolean('has_dedicated_dispatch').default(false),

  /** 是否有专职采购员 */
  hasDedicatedProcurement: boolean('has_dedicated_procurement').default(false),

  // ─── 时间戳 ───

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
