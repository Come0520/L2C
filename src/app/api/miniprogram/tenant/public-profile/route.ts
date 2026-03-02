/**
 * 租户公开信息 API（无需鉴权）
 *
 * @description 根据租户 code 返回品牌展示信息，供小程序落地页使用。
 * 仅暴露公开字段，不返回 tenantId、内部配置等敏感信息。
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少 code 参数' }, { status: 400 });
    }

    // 查询已激活的租户
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
      },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: '未找到该商家' }, { status: 404 });
    }

    const profile: TenantPublicProfile = {
      name: tenant.name,
      logoUrl: tenant.logoUrl ?? null,
      slogan: tenant.slogan ?? null,
      region: tenant.region ?? null,
      detailAddress: tenant.detailAddress ?? null,
      phone: tenant.applicantPhone ?? null,
      contactWechat: tenant.contactWechat ?? null,
      landingCoverUrl: tenant.landingCoverUrl ?? null,
    };

    return NextResponse.json(
      { success: true, data: profile },
      {
        // 公开信息低频变更，缓存 5 分钟
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    logger.error('获取租户公开信息失败:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
