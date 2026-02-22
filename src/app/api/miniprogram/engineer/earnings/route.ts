/**
 * 工程师工费汇总 API
 *
 * GET /api/miniprogram/engineer/earnings
 * 返回工费累计和最近明细
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { apLaborStatements, apLaborFeeDetails } from '@/shared/api/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    // 查询劳务结算单（按工人 ID + 租户 ID 筛选）
    const statements = await db
      .select()
      .from(apLaborStatements)
      .where(
        and(
          eq(apLaborStatements.tenantId, user.tenantId),
          eq(apLaborStatements.workerId, user.id)
        )
      )
      .orderBy(desc(apLaborStatements.createdAt));

    // 计算累计已结算和待结算金额
    let totalEarned = 0;
    let pendingAmount = 0;

    for (const statement of statements) {
      const total = parseFloat(statement.totalAmount || '0');
      const paid = parseFloat(statement.paidAmount || '0');
      totalEarned += paid;
      pendingAmount += total - paid;
    }

    // 获取最近的费用明细（修复 N+1 查询：改为单次 inArray 查询）
    let recentDetails: Array<{
      id: string;
      description: string | null;
      amount: string | null;
      feeType: string | null;
      installTaskNo: string | null;
      createdAt: Date | null;
    }> = [];

    if (statements.length > 0) {
      const recentStatementIds = statements.slice(0, 3).map((s) => s.id);

      const details = await db
        .select({
          id: apLaborFeeDetails.id,
          description: apLaborFeeDetails.description,
          amount: apLaborFeeDetails.amount,
          feeType: apLaborFeeDetails.feeType,
          installTaskNo: apLaborFeeDetails.installTaskNo,
          createdAt: apLaborFeeDetails.createdAt,
        })
        .from(apLaborFeeDetails)
        .where(
          and(
            inArray(apLaborFeeDetails.statementId, recentStatementIds),
            eq(apLaborFeeDetails.tenantId, user.tenantId)
          )
        )
        .limit(10);

      recentDetails = details;
    }

    return apiSuccess({
      totalEarned: totalEarned.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      recentDetails,
    });
  } catch (error) {
    logger.error('[Earnings] 工费查询异常', { route: 'engineer/earnings', error });
    // 安全：不向客户端暴露 error.message
    return apiError('工费查询服务异常', 500);
  }
}
