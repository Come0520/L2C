import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { apLaborStatements, apLaborFeeDetails } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

/**
 * Helper: Parse User from Token
 */
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.userId as string,
      tenantId: payload.tenantId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/miniprogram/engineer/earnings
 * 工费汇总
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
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
    const recentDetails: any[] = [];
    if (statements.length > 0) {
      const recentStatementIds = statements.slice(0, 3).map((s) => s.id);

      for (const statementId of recentStatementIds) {
        const details = await db
          .select()
          .from(apLaborFeeDetails)
          .where(eq(apLaborFeeDetails.statementId, statementId))
          .limit(10);

        recentDetails.push(...details);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error: any) {
    console.error('[GET /api/miniprogram/engineer/earnings] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
