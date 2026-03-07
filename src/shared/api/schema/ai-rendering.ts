import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants, users } from './infrastructure';

/**
 * AI 效果图渲染记录表
 * 存储每次窗帘效果图生成请求的完整信息，包括输入参数、结果图和积分消耗
 */
export const aiRenderings = pgTable(
  'ai_renderings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** 所属租户（与积分额度关联） */
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),

    /** 执行本次出图的用户 */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    /** 原始现场照片 URL（用户上传的房间照片） */
    originalImageUrl: text('original_image_url').notNull(),

    /** 蒙版/标注数据（JSON 格式，包含用户画的线条坐标） */
    maskData: jsonb('mask_data'),

    /** 用户备注（语音转文字或手动输入，提供给 AI 的额外说明） */
    userNotes: text('user_notes'),

    /** 面料来源：showroom=从云展厅选择，upload=用户自己上传 */
    fabricSource: text('fabric_source').notNull().default('showroom'),

    /** 云展厅商品 ID（fabricSource=showroom 时有值） */
    showroomProductId: uuid('showroom_product_id'),

    /** 自定义面料图片 URL（fabricSource=upload 时有值，需 +1 积分） */
    customFabricUrl: text('custom_fabric_url'),

    /** 窗帘款式模板 ID（关联 ai_curtain_style_templates） */
    curtainStyleId: uuid('curtain_style_id').references(() => aiCurtainStyleTemplates.id),

    /** 摄像机角度参数（x/y/z 三轴，控制出图视角） */
    cameraAngle: jsonb('camera_angle'),

    /** 输出模式：proposal=方案模式(4:3含型号价格)，marketing=营销模式(9:16含水印) */
    outputMode: text('output_mode').notNull().default('proposal'),

    /** 渲染状态：pending/processing/completed/failed */
    status: text('status').notNull().default('pending'),

    /** 生成的效果图 URL（completed 状态时有值） */
    resultImageUrl: text('result_image_url'),

    /** 本次渲染消耗的积分数（基础 2 点，上传面料 +1，高清出图 5 点） */
    creditsUsed: integer('credits_used').notNull().default(0),

    /** 关联原始渲染记录 ID（重试时指向首次渲染） */
    parentRenderingId: uuid('parent_rendering_id'),

    /** 当前是第几次尝试（0=首次，1=第一次重试免费，>=2 开始扣点） */
    retryCount: integer('retry_count').notNull().default(0),

    /** 失败原因（status=failed 时记录） */
    errorMessage: text('error_message'),

    /** 实际发送给 AI 模型的完整 Prompt（调试用） */
    aiPrompt: text('ai_prompt'),

    /** 创建人（执行出图的用户） */
    createdBy: uuid('created_by').references(() => users.id),

    /** 最后更新人 */
    updatedBy: uuid('updated_by').references(() => users.id),

    /** 创建时间 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    /** 按租户查询（积分统计、历史记录） */
    renderingTenantIdx: index('idx_ai_renderings_tenant').on(table.tenantId),
    /** 按用户查询 */
    renderingUserIdx: index('idx_ai_renderings_user').on(table.userId),
    /** 按状态过滤（查询进行中的任务） */
    renderingStatusIdx: index('idx_ai_renderings_status').on(table.status),
    /** 按面料来源过滤（统计上传面料的消耗） */
    renderingFabricIdx: index('idx_ai_renderings_fabric_source').on(table.fabricSource),
  })
);

/**
 * 窗帘款式模板表
 * 由 SUPER_ADMIN 在平台管理后台维护，供所有租户使用
 * 每个模板对应一种窗帘安装样式（如轨道双开帘、罗马帘等）
 */
export const aiCurtainStyleTemplates = pgTable(
  'ai_curtain_style_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** 款式名称（显示给用户，如"轨道双开帘"、"半罗马帘"） */
    name: varchar('name', { length: 100 }).notNull(),

    /**
     * 款式分类：
     * - track：轨道帘
     * - roman_pole：罗马杆
     * - roman_blind：罗马帘
     * - roller：卷帘
     * - venetian：百叶帘
     */
    category: text('category').notNull(),

    /** 缩略图 URL（在选款式步骤的卡片网格中展示，建议 200x200） */
    thumbnailUrl: text('thumbnail_url'),

    /** 参考大图 URL（发送给 AI 作为风格参考，建议 1024x1024） */
    referenceImageUrl: text('reference_image_url'),

    /**
     * AI Prompt 片段（中文描述，拼入主 Prompt）
     * 例如："轨道双开帘，左右各一幅，自然悬垂，白色轨道隐藏安装"
     */
    promptFragment: text('prompt_fragment').notNull(),

    /** 在款式选择界面的排列顺序（数字越小越靠前） */
    sortOrder: integer('sort_order').notNull().default(0),

    /** 是否启用（1=启用，0=禁用，禁用后在小程序端不显示） */
    isActive: integer('is_active').notNull().default(1),

    /** 创建人（SUPER_ADMIN） */
    createdBy: uuid('created_by'),

    /** 最后更新人 */
    updatedBy: uuid('updated_by'),

    /** 创建时间 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    /** 按分类过滤款式 */
    templateCategoryIdx: index('idx_ai_curtain_style_templates_category').on(table.category),
    /** 快速过滤已启用的款式 */
    templateActiveIdx: index('idx_ai_curtain_style_templates_active').on(table.isActive),
  })
);

// ============================================================
// 关系定义（Drizzle Relations）
// ============================================================

/** AI 渲染记录与租户、用户、款式模板的关联 */
export const aiRenderingsRelations = relations(aiRenderings, ({ one }) => ({
  /** 所属租户 */
  tenant: one(tenants, {
    fields: [aiRenderings.tenantId],
    references: [tenants.id],
  }),
  /** 操作用户 */
  user: one(users, {
    fields: [aiRenderings.userId],
    references: [users.id],
  }),
  /** 使用的款式模板 */
  curtainStyle: one(aiCurtainStyleTemplates, {
    fields: [aiRenderings.curtainStyleId],
    references: [aiCurtainStyleTemplates.id],
  }),
}));

/** 款式模板与渲染记录的反向关联 */
export const aiCurtainStyleTemplatesRelations = relations(aiCurtainStyleTemplates, ({ many }) => ({
  /** 使用该模板的所有渲染记录 */
  renderings: many(aiRenderings),
}));
