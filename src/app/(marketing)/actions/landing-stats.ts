'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema/infrastructure';
import { users } from '@/shared/api/schema/infrastructure';
import { orders } from '@/shared/api/schema/orders';
import { quotes } from '@/shared/api/schema/quotes';
import { landingTestimonials } from '@/shared/api/schema/landing-testimonials';
import { eq, count, isNull, sql, gte } from 'drizzle-orm';

/**
 * 落地页真实统计数据（不含城市）
 */
export interface LandingStats {
    /** 已激活的企业（租户）数量 */
    tenantCount: number;
    /** 所有报价单总数 */
    quoteCount: number;
    /** 活跃用户总数 */
    userCount: number;
    /** 历史订单总数 */
    orderCount: number;
}

/**
 * 增长图表单个数据点（某月的累计企业数）
 */
export interface GrowthDataPoint {
    /** 月份，格式 "YYYY-MM" */
    month: string;
    /** 本月底的累计激活企业数 */
    total: number;
}

/**
 * 落地页真实客户评价
 */
export interface LandingTestimonialData {
    id: string;
    content: string;
    authorName: string;
    authorRole: string | null;
    authorCompany: string | null;
}

/**
 * 查询落地页统计数字（企业数、报价单数）
 */
export async function getLandingStats(): Promise<LandingStats> {
    try {
        const [tenantResult, quoteResult, userResult, orderResult] = await Promise.all([
            // 已激活企业数
            db
                .select({ count: count() })
                .from(tenants)
                .where(eq(tenants.status, 'active')),
            // 报价单总数（未软删除）
            db
                .select({ count: count() })
                .from(quotes)
                .where(isNull(quotes.deletedAt)),
            // 活跃用户数
            db
                .select({ count: count() })
                .from(users)
                .where(eq(users.isActive, true)),
            // 订单总数
            db
                .select({ count: count() })
                .from(orders)
                .where(isNull(orders.deletedAt)),
        ]);

        return {
            tenantCount: tenantResult[0]?.count ?? 0,
            quoteCount: quoteResult[0]?.count ?? 0,
            userCount: userResult[0]?.count ?? 0,
            orderCount: orderResult[0]?.count ?? 0,
        };
    } catch {
        return { tenantCount: 0, quoteCount: 0, userCount: 0, orderCount: 0 };
    }
}

/**
 * 查询最近 N 个月的累计企业增长数据，用于绘制增长曲线图
 * 返回每个月底的累计激活企业总数（面积图数据）
 */
export async function getGrowthTrend(months = 12): Promise<GrowthDataPoint[]> {
    try {
        // 计算起始时间（N 个月前月初）
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months + 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // 按月统计新增激活企业数
        const rows = await db
            .select({
                month: sql<string>`to_char(date_trunc('month', ${tenants.createdAt}), 'YYYY-MM')`,
                newCount: count(),
            })
            .from(tenants)
            .where(gte(tenants.createdAt, startDate))
            .groupBy(sql`date_trunc('month', ${tenants.createdAt})`)
            .orderBy(sql`date_trunc('month', ${tenants.createdAt})`);

        // 查询起始日期之前已有的企业数（基数）
        const [baseResult] = await db
            .select({ count: count() })
            .from(tenants)
            .where(sql`${tenants.createdAt} < ${startDate.toISOString()}`);

        const base = baseResult?.count ?? 0;

        // 生成最近 N 个月的完整月份列表（确保没有数据的月份也有 0 显示）
        const allMonths: string[] = [];
        for (let i = 0; i < months; i++) {
            const d = new Date(startDate);
            d.setMonth(d.getMonth() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            allMonths.push(`${y}-${m}`);
        }

        // 构建月份 → 新增数量的 Map
        const monthMap = new Map<string, number>(rows.map((r) => [r.month, r.newCount]));

        // 累加成累计增长曲线
        let cumulative = base;
        const result: GrowthDataPoint[] = allMonths.map((month) => {
            cumulative += monthMap.get(month) ?? 0;
            return { month, total: cumulative };
        });

        return result;
    } catch {
        // 数据库失败时返回空数组，组件会自动隐藏图表
        return [];
    }
}

/**
 * 查询已审核通过的落地页客户评价（按排序权重升序）
 */
export async function getLandingTestimonials(): Promise<LandingTestimonialData[]> {
    try {
        const rows = await db
            .select({
                id: landingTestimonials.id,
                content: landingTestimonials.content,
                authorName: landingTestimonials.authorName,
                authorRole: landingTestimonials.authorRole,
                authorCompany: landingTestimonials.authorCompany,
            })
            .from(landingTestimonials)
            .where(eq(landingTestimonials.isApproved, true))
            .orderBy(landingTestimonials.sortOrder)
            .limit(20);

        return rows;
    } catch {
        return [];
    }
}

// ─── 留言提交 ───────────────────────────────────────────────

/** 提交留言的请求结构 */
export interface SubmitTestimonialInput {
    content: string;
    authorName: string;
    authorRole?: string;
    authorCompany?: string;
}

/** 提交留言的响应结构 */
export interface SubmitTestimonialResult {
    success: boolean;
    /** 提交失败时的错误信息 */
    error?: string;
}

/**
 * 用户提交留言（无需登录）
 * 提交后默认 isApproved = false，需要管理员审核后才展示
 */
export async function submitTestimonial(
    input: SubmitTestimonialInput
): Promise<SubmitTestimonialResult> {
    try {
        // 基础校验
        const content = input.content?.trim();
        const authorName = input.authorName?.trim();

        if (!content || content.length < 5) {
            return { success: false, error: '留言内容至少需要 5 个字' };
        }
        if (content.length > 500) {
            return { success: false, error: '留言内容不能超过 500 字' };
        }
        if (!authorName || authorName.length < 2) {
            return { success: false, error: '请填写您的称呼（至少 2 个字）' };
        }

        await db.insert(landingTestimonials).values({
            content,
            authorName,
            authorRole: input.authorRole?.trim() || null,
            authorCompany: input.authorCompany?.trim() || null,
            isApproved: false,
        });

        return { success: true };
    } catch {
        return { success: false, error: '提交失败，请稍后重试' };
    }
}
