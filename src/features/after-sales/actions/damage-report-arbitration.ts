'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { liabilityNotices, afterSalesDamageReports } from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';

const arbitrateDamageReportSchema = z.object({
  damageReportId: z.string().uuid(),
  memo: z.string().min(1, '仲裁说明不能为空'),
  decisions: z
    .array(
      z.object({
        noticeId: z.string().uuid(),
        finalAmount: z.number().min(0),
      })
    )
    .min(1, '至少需要一条仲裁决定'),
});

export const arbitrateDamageReportAction = createSafeAction(
  arbitrateDamageReportSchema,
  async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
      const result = await db.transaction(async (tx) => {
        // 1. 获取定损主单
        const report = await tx.query.afterSalesDamageReports.findFirst({
          where: and(
            eq(afterSalesDamageReports.id, data.damageReportId),
            eq(afterSalesDamageReports.tenantId, tenantId)
          ),
        });

        if (!report) throw new Error('定损单不存在');
        if (report.status !== 'DISPUTED') {
          throw new Error('只有存在争议(DISPUTED)的定损单才能进行仲裁');
        }

        // 2. 获取所有现有的子项定责单
        const existingNotices = await tx.query.liabilityNotices.findMany({
          where: eq(liabilityNotices.damageReportId, report.id),
        });

        let sumOfNewAmounts = 0;
        const finalNotices = [];

        // 3. 遍历 decisions 更新金额
        for (const notice of existingNotices) {
          const decision = data.decisions.find((d) => d.noticeId === notice.id);
          const finalAmount = decision ? decision.finalAmount : Number(notice.amount);
          sumOfNewAmounts += finalAmount;

          if (decision) {
            // 记录最终修改
            const [updated] = await tx
              .update(liabilityNotices)
              .set({
                amount: finalAmount.toString(),
                updatedAt: new Date(),
              })
              .where(eq(liabilityNotices.id, notice.id))
              .returning();
            finalNotices.push(updated);
          } else {
            finalNotices.push(notice);
          }
        }

        // 4. 重查核对金额：重新定责的总额必须等于原定损总额
        if (sumOfNewAmounts !== Number(report.totalDamageAmount)) {
          throw new Error(
            `仲裁后责任总额(¥${sumOfNewAmounts})与定损总额(¥${report.totalDamageAmount})不符`
          );
        }

        // 5. 将主单状态升级为 ARBITRATED
        const [arbitratedReport] = await tx
          .update(afterSalesDamageReports)
          .set({
            status: 'ARBITRATED',
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(afterSalesDamageReports.id, report.id))
          .returning();

        // 6. 强制执行账本记账，跟 APPROVED 走一样的财务通道
        const { recordDebtLedger } = await import('../logic/deduction-safety');
        for (const n of finalNotices) {
          if (Number(n.amount) > 0) {
            await recordDebtLedger(
              {
                tenantId: tenantId,
                liablePartyType: n.liablePartyType as any,
                liablePartyId: n.liablePartyId || '',
                originalAfterSalesId: n.afterSalesId,
                originalLiabilityNoticeId: n.id,
                amount: Number(n.amount),
              },
              tx
            );
          }
        }

        return {
          damageReportStatus: arbitratedReport.status,
          afterSalesId: report.afterSalesTicketId,
        };
      });

      await AuditService.recordFromSession(
        session,
        'after_sales_damage_reports',
        data.damageReportId,
        'ARBITRATE',
        {
          changed: {
            memo: data.memo,
            decisions: data.decisions,
            status: 'ARBITRATED',
          },
        }
      );

      const { revalidatePath } = await import('next/cache');
      revalidatePath(`/after-sales/${result.afterSalesId}`);

      return { success: true, data: result, message: '仲裁已生效且成功入账' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '服务器内部错误';
      const { logger } = await import('@/shared/lib/logger');
      logger.error('[After Sales] Arbitrate Damage Report Failed:', { error: err });
      return { success: false, message };
    }
  }
);

export async function arbitrateDamageReport(data: z.infer<typeof arbitrateDamageReportSchema>) {
  return arbitrateDamageReportAction(data);
}
