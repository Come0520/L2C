import { NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, users, orders, landingTestimonials } from '@/shared/api/schema';
import { eq, sql, isNull } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

/**
 * 落地页公开统计数据 API
 * 无需鉴权，任何人可访问
 * 返回真实账套数、用户数、订单数以及已审核的用户评论
 * 使用 unstable_cache 缓存 5 分钟，降低数据库频繁查询
 */

/** 查询统计数据并缓存 5 分钟 */
const getLandingStats = unstable_cache(
    async () => {
        const [
            [{ tenantCount }],
            [{ userCount }],
            [{ orderCount }],
            testimonialList,
        ] = await Promise.all([
            // 活跃账套数
            db
                .select({ tenantCount: sql<number>`count(*)::int` })
                .from(tenants)
                .where(eq(tenants.status, 'active')),

            // 活跃用户数（排除平台管理员）
            db
                .select({ userCount: sql<number>`count(*)::int` })
                .from(users)
                .where(eq(users.isActive, true)),

            // 总订单数（不限状态，展示真实业务量）
            db
                .select({ orderCount: sql<number>`count(*)::int` })
                .from(orders)
                .where(isNull(orders.deletedAt)),

            // 已审核通过的评论
            db
                .select({
                    id: landingTestimonials.id,
                    content: landingTestimonials.content,
                    authorName: landingTestimonials.authorName,
                    authorRole: landingTestimonials.authorRole,
                    authorCompany: landingTestimonials.authorCompany,
                    createdAt: landingTestimonials.createdAt,
                })
                .from(landingTestimonials)
                .where(eq(landingTestimonials.isApproved, true))
                .orderBy(landingTestimonials.sortOrder, landingTestimonials.createdAt),
        ]);

        return {
            tenantCount: tenantCount ?? 0,
            userCount: userCount ?? 0,
            orderCount: orderCount ?? 0,
            testimonials: testimonialList,
        };
    },
    ['landing-stats'],
    { revalidate: 300 } // 缓存 5 分钟
);

export async function GET() {
    try {
        const stats = await getLandingStats();
        return NextResponse.json(stats, {
            headers: {
                // 允许 CDN 缓存 5 分钟
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('[落地页统计 API] 查询失败:', error);
        // 返回安全的降级数据，避免落地页白屏
        return NextResponse.json(
            { tenantCount: 0, userCount: 0, orderCount: 0, testimonials: [] },
            { status: 200 }
        );
    }
}
