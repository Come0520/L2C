'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { liabilityNotices, afterSalesDamageReports } from '@/shared/api/schema';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';

const signLiabilityNoticeSchema = z.object({
  noticeId: z.string().uuid(),
  signatureImage: z.string().url(),
});

/**
 * 责任方签字确认 (Server Action)
 * 核心逻辑：
 * 1. 更新自己的签名为 SIGNED
 * 2. 检查父级 Damage Report 下的所有 notice 是否全部都 SIGNED
 * 3. 若全部 SIGNED，则触发主单的 APPROVED，并通知执行结算计入账本
 */
export const signLiabilityNoticeAction = createSafeAction(
  signLiabilityNoticeSchema,
  async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
      const result = await db.transaction(async (tx) => {
        // 1. 获取要签字的 notice 及其附属主单
        const notice = await tx.query.liabilityNotices.findFirst({
          where: and(
            eq(liabilityNotices.id, data.noticeId),
            eq(liabilityNotices.tenantId, tenantId)
          ),
        });

        if (!notice) throw new Error('定责单不存在');
        if (notice.signatureStatus !== 'PENDING') throw new Error('该单据不在待签字状态');
        if (!notice.damageReportId) throw new Error('该单据缺少父级定损单关联');

        // 2. 更新本单为 SIGNED
        const [updatedNotice] = await tx
          .update(liabilityNotices)
          .set({
            signatureStatus: 'SIGNED',
            signatureImage: data.signatureImage,
            signedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(liabilityNotices.id, data.noticeId))
          .returning();

        // 3. 检查兄弟节点的全部签字状态
        const siblings = await tx.query.liabilityNotices.findMany({
          where: eq(liabilityNotices.damageReportId, notice.damageReportId),
        });

        const allSigned = siblings.every(
          (s) =>
            s.id === data.noticeId || // current updated
            s.signatureStatus === 'SIGNED' // others
        );

        let finalReportStatus = 'PENDING_SIGNATURES';

        if (allSigned) {
          // 所有人都签过了，推进主单进入 APPROVED 状态
          await tx
            .update(afterSalesDamageReports)
            .set({
              status: 'APPROVED',
              resolvedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(afterSalesDamageReports.id, notice.damageReportId));

          finalReportStatus = 'APPROVED';

          // P1 FIX: (Business Flow) Record Debts for all child notices since everything is approved
          const { recordDebtLedger } = await import('../logic/deduction-safety');
          for (const s of siblings) {
            if (Number(s.amount) > 0) {
              await recordDebtLedger(
                {
                  tenantId: tenantId,
                  liablePartyType: s.liablePartyType as any,
                  liablePartyId: s.liablePartyId || '',
                  originalAfterSalesId: notice.afterSalesId,
                  originalLiabilityNoticeId: s.id,
                  amount: Number(s.amount),
                },
                tx
              );
            }
          }
        }

        return {
          signatureStatus: updatedNotice.signatureStatus,
          damageReportStatus: finalReportStatus,
          afterSalesId: notice.afterSalesId,
        };
      });

      await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'SIGN', {
        new: { signatureStatus: 'SIGNED' },
      });

      revalidatePath(`/after-sales/${result.afterSalesId}`);
      return { success: true, data: result, message: '签字成功' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '服务器内部错误';
      logger.error('[After Sales] Sign Liability Failed:', { error: err });
      return { success: false, message };
    }
  }
);

export async function signLiabilityNotice(data: z.infer<typeof signLiabilityNoticeSchema>) {
  return signLiabilityNoticeAction(data);
}

const rejectLiabilityNoticeSchema = z.object({
  noticeId: z.string().uuid(),
  rejectReason: z.string().min(1, '必须提供拒签理由'),
});

/**
 * 责任方拒绝签字并发起争议 (Server Action)
 * 核心逻辑：
 * 1. 更新自身 notice 为 REJECTED
 * 2. 强制将主单 Damage Report 挂起为 DISPUTED 状态，中断自动结算
 */
export const rejectLiabilityNoticeAction = createSafeAction(
  rejectLiabilityNoticeSchema,
  async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
      const result = await db.transaction(async (tx) => {
        const notice = await tx.query.liabilityNotices.findFirst({
          where: and(
            eq(liabilityNotices.id, data.noticeId),
            eq(liabilityNotices.tenantId, tenantId)
          ),
        });

        if (!notice) throw new Error('定责单不存在');
        if (notice.signatureStatus !== 'PENDING') throw new Error('只有待签字的单据可拒绝');
        if (!notice.damageReportId) throw new Error('核心业务错误: 孤儿定责单');

        // 1. 设置本身被拒绝
        const [updatedNotice] = await tx
          .update(liabilityNotices)
          .set({
            signatureStatus: 'REJECTED',
            rejectReason: data.rejectReason,
            updatedAt: new Date(),
          })
          .where(eq(liabilityNotices.id, notice.id))
          .returning();

        // 2. 将主单升级到 DISPUTED
        const [disputedReport] = await tx
          .update(afterSalesDamageReports)
          .set({
            status: 'DISPUTED',
            updatedAt: new Date(),
          })
          .where(eq(afterSalesDamageReports.id, notice.damageReportId))
          .returning();

        return {
          signatureStatus: updatedNotice.signatureStatus,
          damageReportStatus: disputedReport.status,
          afterSalesId: notice.afterSalesId,
        };
      });

      await AuditService.recordFromSession(session, 'liability_notices', data.noticeId, 'REJECT', {
        new: { signatureStatus: 'REJECTED', rejectReason: data.rejectReason },
      });

      revalidatePath(`/after-sales/${result.afterSalesId}`);
      return { success: true, data: result, message: '已拒签，定损单进入争议仲裁流程' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '服务器内部错误';
      logger.error('[After Sales] Reject Liability Failed:', { error: err });
      return { success: false, message };
    }
  }
);

export async function rejectLiabilityNotice(data: z.infer<typeof rejectLiabilityNoticeSchema>) {
  return rejectLiabilityNoticeAction(data);
}
