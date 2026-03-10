'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { afterSalesTickets, afterSalesDamageReports, liabilityNotices } from '@/shared/api/schema';
import { generateNoticeNo } from '../utils'; // We'll adapt this for Damage Report below mapping
import { AuditService } from '@/shared/services/audit-service';
import { checkMultipleDeductionsAllowed } from '../logic/deduction-safety';
import { logger } from '@/shared/lib/logger';
import { liablePartyTypeEnum } from '@/shared/api/schema/enums';

// schema for liability assignments under a damage report
const LIABILITY_ITEM_SCHEMA = z.object({
  liablePartyType: z.enum(liablePartyTypeEnum.enumValues),
  liablePartyId: z.string().uuid().optional(),
  amount: z.coerce.number().min(0, '金额必须大于等于0'),
  reason: z.string().min(1, '原因描述不能为空'),
});

const createDamageReportSchema = z.object({
  afterSalesTicketId: z.string().uuid(),
  totalDamageAmount: z.coerce.number().min(0),
  description: z.string().min(1),
  evidencePhotos: z.array(z.string()).optional(),
  liabilities: z.array(LIABILITY_ITEM_SCHEMA).min(1, '至少分配一个责任方'),
});

const createDamageReportAction = createSafeAction(
  createDamageReportSchema,
  async (data, { session }) => {
    const tenantId = session.user.tenantId;

    try {
      // 1. Math verification: sum of liabilities must exactly equal totalDamageAmount
      const sumLiabilities = data.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
      if (Math.abs(sumLiabilities - data.totalDamageAmount) > 0.01) {
        // Floating point safety
        return {
          success: false,
          message: `责任划分总额(¥${sumLiabilities})必须等于定损总金额(¥${data.totalDamageAmount})`,
        };
      }

      // 2. Deduction Safety Checks for all liable parties BEFORE starting transaction
      // 2. Batch Deduction Safety Checks (P2: Fix N+1 Query)
      if (data.liabilities && data.liabilities.length > 0) {
        const checkResults = await checkMultipleDeductionsAllowed(
          data.liabilities.map((l) => ({
            partyType: l.liablePartyType,
            partyId: l.liablePartyId || '',
            amount: l.amount.toString(),
          }))
        );

        for (let i = 0; i < checkResults.length; i++) {
          if (!checkResults[i].allowed) {
            return {
              success: false,
              message: `[${data.liabilities[i].liablePartyType}] 额度校验失败: ${checkResults[i].message}`,
            };
          }
        }
      }

      // 3. Create Damage Report and Liability Notices Transactionally
      const newReport = await db.transaction(async (tx) => {
        // Validate ticket exists and is open
        const ticket = await tx.query.afterSalesTickets.findFirst({
          where: and(
            eq(afterSalesTickets.id, data.afterSalesTicketId),
            eq(afterSalesTickets.tenantId, tenantId)
          ),
          columns: { id: true, tenantId: true, status: true },
        });

        if (!ticket) throw new Error('售后工单不存在或无权操作');
        if (ticket.status === 'CLOSED') throw new Error('已关闭的售后工单无法发起定损');

        // Note: For real world use, we should create a generateReportNo util. Reusing LN logic for mock demo purpose.
        const reportNo = await generateNoticeNo(tenantId, tx);

        // 3a. Insert main Damage Report
        const [insertedReport] = await tx
          .insert(afterSalesDamageReports)
          .values({
            tenantId,
            reportNo: reportNo.replace('LN', 'DR'), // hack for correct prefix
            afterSalesTicketId: ticket.id,
            totalDamageAmount: data.totalDamageAmount.toString(),
            description: data.description,
            evidencePhotos: data.evidencePhotos,
            status: 'PENDING_SIGNATURES',
            creatorId: session.user.id,
          })
          .returning();

        // 3b. Insert child liability notices
        for (let i = 0; i < data.liabilities.length; i++) {
          const liability = data.liabilities[i];
          const noticeNo = `${insertedReport.reportNo}-L${i + 1}`; // sequential child NO

          await tx.insert(liabilityNotices).values({
            tenantId,
            noticeNo,
            afterSalesId: ticket.id, // Legacy compatibility
            damageReportId: insertedReport.id,
            liablePartyType: liability.liablePartyType,
            liablePartyId: liability.liablePartyId,
            amount: liability.amount.toString(),
            reason: liability.reason,
            status: 'DRAFT',
            signatureStatus: 'PENDING',
            createdBy: session.user.id,
          });
        }

        return insertedReport;
      });

      await AuditService.recordFromSession(
        session,
        'after_sales_damage_reports',
        newReport.id,
        'CREATE',
        {
          new: newReport as Record<string, unknown>,
        }
      );

      logger.info(`[After Sales] Successfully created damage report: ${newReport.id}`);

      revalidatePath(`/after-sales/${data.afterSalesTicketId}`);
      return { success: true, data: newReport, message: '定损单发起成功，等待多方签字' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '服务器内部错误';
      logger.error('[After Sales] Create Damage Report Failed:', { error: err });
      return { success: false, message };
    }
  }
);

export async function createDamageReport(data: z.infer<typeof createDamageReportSchema>) {
  return createDamageReportAction(data);
}
