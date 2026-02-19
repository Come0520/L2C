import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { apLaborStatements, apLaborFeeDetails } from '@/shared/api/schema';
import { eq, and, desc, type InferSelectModel } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../auth-utils';

type LaborFeeDetail = InferSelectModel<typeof apLaborFeeDetails>;

/**
 * GET /api/miniprogram/engineer/earnings
 * 工费汇总
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    // 查询劳务结算单（按工人 ID 筛选）
    const statements = await db
      .select()
      .from(apLaborStatements)
      .where(
        and(eq(apLaborStatements.tenantId, user.tenantId), eq(apLaborStatements.workerId, user.id))
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

    // 获取最近的费用明细（最多 10 条）
    const recentDetails: LaborFeeDetail[] = [];
    if (statements.length > 0) {
      const recentStatementIds = statements.slice(0, 3).map((s) => s.id);

      for (const statementId of recentStatementIds) {
        const details = await db
          .select()
          .from(apLaborFeeDetails)
          .where(and(eq(apLaborFeeDetails.statementId, statementId), eq(apLaborFeeDetails.tenantId, user.tenantId)))
          .limit(10);

        recentDetails.push(...details);
      }
    }

    return apiSuccess({
      totalEarned: totalEarned.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      recentDetails: recentDetails.slice(0, 10).map((detail) => ({
        id: detail.id,
        description: detail.description,
        amount: detail.amount,
        feeType: detail.feeType,
        installTaskNo: detail.installTaskNo,
        createdAt: detail.createdAt,
      })),
    });
  } catch (error) {
    console.error('[GET /api/miniprogram/engineer/earnings] Error:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return apiError(message, 500);
  }
}
