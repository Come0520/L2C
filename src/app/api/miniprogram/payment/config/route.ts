/**
 * 支付配置查询 API (普通用户可用)
 *
 * GET /api/miniprogram/payment/config
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';



export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    const tenantId = user?.tenantId;
    if (!tenantId) {
      return apiError('未授权', 401);
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { settings: true },
    });

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const paymentConfig = (settings.payment as Record<string, unknown>) || {
      enabled: true,
      offline: { enabled: true, instructions: '' },
      online: { enabled: false },
    };

    return apiSuccess(paymentConfig);
  } catch (error) {
    console.error('Get Payment Config Error:', error);
    return apiError('Failed', 500);
  }
}
