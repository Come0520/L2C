import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
} from 'drizzle-orm/pg-core';

/**
 * 落地页用户評論/留言表
 * 支持公开投稿（无需登录），管理员审核后才在落地页展示
 */
export const landingTestimonials = pgTable('landing_testimonials', {
    id: uuid('id').primaryKey().defaultRandom(),

    /** 评论正文，最大 500 字 */
    content: text('content').notNull(),

    /** 署名 */
    authorName: varchar('author_name', { length: 100 }).notNull(),

    /** 职位/角色，如 "店长"、"创始人" */
    authorRole: varchar('author_role', { length: 100 }),

    /** 公司/门店名称 */
    authorCompany: varchar('author_company', { length: 200 }),

    /**
     * 是否已通过审核、可在落地页展示
     * 默认 false，管理员审核后改为 true
     */
    isApproved: boolean('is_approved').default(false).notNull(),

    /** 展示排序权重，数字越小越靠前 */
    sortOrder: integer('sort_order').default(100).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type LandingTestimonial = typeof landingTestimonials.$inferSelect;
export type NewLandingTestimonial = typeof landingTestimonials.$inferInsert;
