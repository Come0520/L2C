/**
 * 租户公开信息 API（无需鉴权）
 *
 * @description 根据租户 code 返回品牌展示信息，供小程序落地页使用。
 * 仅暴露公开字段，不返回 tenantId、内部配置等敏感信息。
 * 包含套餐类型（planType），供前端判断是否显示品牌落地页。
 * 若套餐已过期，强制降级返回 'base'，确保品牌页权益实时失效。
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';

/** 租户公开信息响应类型 */
export interface TenantPublicProfile {
  name: string;
  logoUrl: string | null;
  slogan: string | null;
  region: string | null;
  detailAddress: string | null;
  phone: string | null;
  contactWechat: string | null;
  landingCoverUrl: string | null;
  /** 套餐类型，前端据此决定显示品牌页还是 L2C 推广页 */
  planType: 'base' | 'pro' | 'enterprise';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少 code 参数' }, { status: 400 });
    }

    // 查询已激活的租户，含套餐字段
    const tenant = await db.query.tenants.findFirst({
      where: and(eq(tenants.code, code), eq(tenants.status, 'active'), eq(tenants.isActive, true)),
      columns: {
        name: true,
        logoUrl: true,
        slogan: true,
        region: true,
        detailAddress: true,
        applicantPhone: true,
        contactWechat: true,
        landingCoverUrl: true,
        planType: true,
        planExpiresAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: '未找到该商家' }, { status: 404 });
    }

    /**
     * 套餐有效性判断：
     * - planExpiresAt 为 null → 永久生效（免费版或祖父条款用户）
     * - planExpiresAt 已过期 → 强制降级为 base
     */
    const now = new Date();
    const isExpired = tenant.planExpiresAt !== null && tenant.planExpiresAt < now;
    const effectivePlanType: 'base' | 'pro' | 'enterprise' = isExpired
      ? 'base'
      : (tenant.planType ?? 'base');

    const profile: TenantPublicProfile = {
      name: tenant.name,
      logoUrl: tenant.logoUrl ?? null,
      slogan: tenant.slogan ?? null,
      region: tenant.region ?? null,
      detailAddress: tenant.detailAddress ?? null,
      phone: tenant.applicantPhone ?? null,
      contactWechat: tenant.contactWechat ?? null,
      landingCoverUrl: tenant.landingCoverUrl ?? null,
      planType: effectivePlanType,
    };

    return NextResponse.json(
      { success: true, data: profile },
      {
        /**
         * 缓存 60s：套餐降级需快速生效（相比功能信息降低了缓存时间）。
         * stale-while-revalidate 允许 CDN 在后台刷新时继续服务旧缓存。
         */
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    logger.error('获取租户公开信息失败:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
