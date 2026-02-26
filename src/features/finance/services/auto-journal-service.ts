import { db } from '@/shared/api/db';
import {
  journalEntries,
  journalEntryLines,
  voucherTemplates,
  receiptBills,
  paymentBills,
} from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { validateLinesBalance } from './journal-validation-service';
import { getOrCreateCurrentPeriod } from './accounting-period-service';
import { writeFinanceAuditLog } from './finance-audit-service';

/**
 * 自动记账核心引擎：根据上游业务单据自动生成标准会计凭证
 * @description
 * 该服务实现了业务发生即财务记账的自动化流程。
 * 支持防重校验（同一单据禁止重复生成凭证）和借贷平衡校验。
 *
 * @param params 生成凭证所需的基础参数
 * @param params.tenantId 租户 ID，用于数据隔离隔离
 * @param params.sourceType 单据来源类型 ( AUTO_RECEIPT | AUTO_PAYMENT | AUTO_EXPENSE )
 * @param params.sourceId 上游业务单据在源表中的主键 ID
 * @param params.amount 凭证发生金额
 * @param params.description 凭证摘要
 * @param params.operatorId 操作人 ID (创建该凭证草稿的用户)
 * @param params.date 业务发生日期
 * @returns 包含 `success` 状态, 成功时的 `entryId` 或失败时的 `error` 提示
 */
export async function generateAutoJournal(params: {
  tenantId: string;
  sourceType: 'AUTO_RECEIPT' | 'AUTO_PAYMENT' | 'AUTO_EXPENSE';
  sourceId: string;
  amount: string;
  description: string;
  operatorId: string;
  date: Date;
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  const { tenantId, sourceType, sourceId, amount, description, operatorId, date } = params;

  // 1. 防重校验：检查该单据是否已经生成过凭证，避免重复记账
  const [existingEntry] = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.sourceType, sourceType),
        eq(journalEntries.sourceId, sourceId),
        eq(journalEntries.status, 'POSTED')
      )
    );

  if (existingEntry) {
    return { success: false, error: '该业务单据已生成过记账凭证，不能重复生成' };
  }

  // 2. 查找凭证模板（模板定义了这种业务该借记什么科目，贷记什么科目）
  const [template] = await db
    .select()
    .from(voucherTemplates)
    .where(
      and(
        eq(voucherTemplates.tenantId, tenantId),
        eq(voucherTemplates.sourceType, sourceType),
        eq(voucherTemplates.isActive, true)
      )
    );

  if (!template) {
    return { success: false, error: `未找到 [${sourceType}] 对应的激活凭证模板，请先在系统配置。` };
  }

  // 3. 构建分录数据并进行安全校验（复用 Phase 2 安全引擎）
  const lines = [
    {
      accountId: template.debitAccountId,
      debitAmount: amount,
      creditAmount: '0',
      description: `${description} - 借方`,
    },
    {
      accountId: template.creditAccountId,
      debitAmount: '0',
      creditAmount: amount,
      description: `${description} - 贷方`,
    },
  ];

  const validation = validateLinesBalance(lines);
  if (!validation.isValid) {
    return { success: false, error: '生成的凭证分录借贷不平，请检查单据金额' };
  }

  // 4. 获取或开辟当月账期
  const period = await getOrCreateCurrentPeriod(tenantId);
  if (period.status === 'CLOSED') {
    return { success: false, error: '当前账期已关闭，无法自动生成凭证，请先开启新的账期' };
  }

  // 5. 使用事务落地凭证
  return await db.transaction(async (tx) => {
    // 调用标准发号器
    const { generateVoucherNo } = await import('./voucher-number-service');
    const voucherNo = await generateVoucherNo(tenantId, sourceType, date);

    // 插入主表
    const [entry] = await tx
      .insert(journalEntries)
      .values({
        tenantId,
        voucherNo,
        periodId: period.id,
        entryDate: date.toISOString().split('T')[0],
        description,
        status: 'PENDING_REVIEW', // 自动生成的进入待复核状态
        sourceType,
        sourceId,
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit,
        createdBy: operatorId,
      })
      .returning({ id: journalEntries.id });

    // 插入分录附表
    const insertLines = lines.map((line, idx) => ({
      entryId: entry.id,
      accountId: line.accountId,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      description: line.description,
      sortOrder: idx,
    }));
    await tx.insert(journalEntryLines).values(insertLines);

    // 触发审计日志
    await writeFinanceAuditLog({
      tenantId,
      userId: operatorId,
      action: 'CREATE',
      entityType: 'journal_entry_auto',
      entityId: entry.id,
      after: { sourceId, sourceType, voucherNo },
    });

    return { success: true, entryId: entry.id };
  });
}

/**
 * 业务切面：从收款单直接生成凭证
 */
export async function generateEntryFromReceiptBill(receiptBillId: string, operatorId: string) {
  const [receipt] = await db.select().from(receiptBills).where(eq(receiptBills.id, receiptBillId));
  if (!receipt) throw new Error('收款单不存在');

  return generateAutoJournal({
    tenantId: receipt.tenantId,
    sourceType: 'AUTO_RECEIPT',
    sourceId: receipt.id,
    amount: receipt.totalAmount,
    description: `自动凭证-收款单核销 [客户: ${receipt.customerName}]`,
    operatorId,
    date: new Date(receipt.receivedAt),
  });
}

/**
 * 业务切面：从付款单直接生成凭证
 */
export async function generateEntryFromPaymentBill(paymentBillId: string, operatorId: string) {
  const [payment] = await db.select().from(paymentBills).where(eq(paymentBills.id, paymentBillId));
  if (!payment) throw new Error('付款单不存在');

  return generateAutoJournal({
    tenantId: payment.tenantId,
    sourceType: 'AUTO_PAYMENT',
    sourceId: payment.id,
    amount: payment.amount,
    description: `自动凭证-付款单结算 [收款方: ${payment.payeeName}]`,
    operatorId,
    date: new Date(payment.paidAt || new Date()),
  });
}
