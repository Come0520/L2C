'use server';

import { logger } from "@/shared/lib/logger";
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { db } from '@/shared/api/db';
import { expenseRecords, chartOfAccounts } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { getOrCreateCurrentPeriod } from '../services/accounting-period-service';
import { AuditService } from '@/shared/services/audit-service';
import { generateAutoJournal } from '../services/auto-journal-service';
import { createExpenseSchema, importExpensesSchema } from '../schemas';
import { nanoid } from 'nanoid';

/**
 * 手工录入单笔费用记录
 */
const createExpenseActionInternal = createSafeAction(createExpenseSchema, async (params, { session }) => {
    const { accountId, amount, expenseDate, description, createVoucher } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    logger.info('[finance] 准备手工录入费用记录', { accountId, amount, createVoucher });

    // 取当月账期
    const period = await getOrCreateCurrentPeriod(tenantId);
    if (period.status === 'CLOSED') {
        return { error: '当前账期已关闭，无法记录费用' };
    }

    // 验证科目是否存在且类别是否为 EXPENSE
    const [account] = await db.select().from(chartOfAccounts).where(and(
        eq(chartOfAccounts.id, accountId),
        eq(chartOfAccounts.tenantId, tenantId)
    ));

    if (!account) return { error: '费用科目不存在' };
    if (account.category !== 'EXPENSE') return { error: `录入的并非费用类科目 (当前类别: ${account.category})` };
    if (!account.isActive) return { error: '该科目已被停用' };

    return await db.transaction(async (tx) => {
        // 1. 插入费用记录
        const [expense] = await tx.insert(expenseRecords).values({
            tenantId,
            periodId: period.id,
            accountId,
            amount: amount.toString(),
            description,
            expenseDate: expenseDate.toISOString().split('T')[0],
            createdBy: userId,
        }).returning({ id: expenseRecords.id });

        logger.info('[finance] 费用记录已创建', { expenseId: expense.id });

        // 审计日志
        await AuditService.log(tx, {
            tenantId,
            userId,
            action: 'CREATE',
            tableName: 'expense_records',
            recordId: expense.id,
            newValues: { accountId, amount, description, expenseDate },
            details: { strategy: 'MANUAL_ENTRY' }
        });

        // 2. 判断是否需要自动生成凭证
        if (createVoucher) {
            logger.info('[finance] 开始自动生成费用凭证');
            // 此处由于需要跨事务执行生成逻辑或将其包含，因为 generateAutoJournal 内也有独立事物
            // 为避免嵌套事务复杂性（Drizzle 原生 tx 嵌套不支持/容易出错），我们先返回记录，在最外层调，或修改 generate 为不强制开启自身事务
            // 这里为了安全，只保存 expense 并在 Action 最后再发起
        }

        return {
            expenseId: expense.id,
            needToGenerateVoucher: createVoucher,
        };
    });
});

export async function createExpenseRecord(params: import('zod').infer<typeof createExpenseSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // Todo: 需要特定的财务权限（如记账员权限）
    if (!await checkPermission(session, PERMISSIONS.FINANCE.EXPENSE_CREATE)) {
        throw new Error('权限不足：需要财务新增权限');
    }

    const res = await createExpenseActionInternal(params);

    // 类型安全获取返回数据
    const resultData = res?.success ? res.data as { expenseId: string; needToGenerateVoucher?: boolean } : null;

    // 如果成功并要求创建凭证
    if (resultData?.needToGenerateVoucher) {
        try {
            const journalRes = await generateAutoJournal({
                tenantId: session.user.tenantId,
                sourceType: 'AUTO_EXPENSE',
                sourceId: resultData.expenseId,
                amount: params.amount.toString(),
                description: `费用确认: ${params.description}`,
                operatorId: session.user.id!,
                date: params.expenseDate,
            });

            if (!journalRes.success) {
                logger.warn('[finance] 凭证自动生成失败', { error: journalRes.error });
                return { ...res, voucherError: journalRes.error };
            } else {
                // 回写 expenseRecord 关联凭证 ID（必须 await 以防数据丢失）
                await db.update(expenseRecords)
                    .set({ journalEntryId: journalRes.entryId })
                    .where(eq(expenseRecords.id, resultData.expenseId));

                return { ...res, voucherId: journalRes.entryId };
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error('❌ 生成费用凭证异常', err);
            return { ...res, voucherError: errorMessage };
        }
    }

    return res;
}

/**
 * 导入多条费用记录
 */
const importExpensesActionInternal = createSafeAction(importExpensesSchema, async (params, { session }) => {
    const { rows, createVoucher } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    logger.info('[finance] 准备批量导入费用', { rowCount: rows.length, createVoucher });

    const period = await getOrCreateCurrentPeriod(tenantId);
    if (period.status === 'CLOSED') {
        return { error: '当前账期已关闭，无法批量导入' };
    }

    // 获取所有可用费用科目以做校验
    const expenseAccounts = await db.select({ id: chartOfAccounts.id, code: chartOfAccounts.code })
        .from(chartOfAccounts)
        .where(and(
            eq(chartOfAccounts.tenantId, tenantId),
            eq(chartOfAccounts.category, 'EXPENSE'),
            eq(chartOfAccounts.isActive, true)
        ));

    const codeToIdMap = new Map<string, string>();
    expenseAccounts.forEach(a => codeToIdMap.set(a.code, a.id));

    const validRowsToInsert: Array<typeof expenseRecords.$inferInsert> = [];
    const errors: string[] = [];
    const batchId = `EXP-IMP-${nanoid(8).toUpperCase()}`;

    // 逐行验证与准备
    rows.forEach((row, index) => {
        const lineNum = index + 1;
        const accountId = codeToIdMap.get(row.accountCode.trim());

        if (!accountId) {
            errors.push(`第 ${lineNum} 行：找不到科目编码为 ${row.accountCode} 的有效费用科目`);
        } else {
            validRowsToInsert.push({
                tenantId,
                periodId: period.id,
                accountId,
                amount: row.amount.toString(),
                description: row.description,
                expenseDate: new Date(row.expenseDate).toISOString().split('T')[0],
                importBatchId: batchId,
                createdBy: userId,
            });
        }
    });

    if (errors.length > 0) {
        return { error: '部分数据校验失败，未能导入', details: errors };
    }

    // 事务执行插入
    const insertedIds = await db.transaction(async (tx) => {
        const results = await tx.insert(expenseRecords).values(validRowsToInsert).returning({ id: expenseRecords.id, amount: expenseRecords.amount, description: expenseRecords.description });

        await AuditService.log(tx, {
            tenantId,
            userId,
            action: 'IMPORT',
            tableName: 'expense_records',
            recordId: batchId,
            details: { batchId, count: results.length }
        });

        return results;
    });

    logger.info('[finance] 批量导入成功', { batchId, count: insertedIds.length });

    // 对于批量导入是否自动生成凭证？
    // 生成单张凭证（汇总所有费用分录）或按张生成，这里业务需要：按单张生成可能会很繁多
    // 此处要求如果勾选生成凭证，目前建议独立在后台处理或告知导入成功去流水页自己勾选。
    // 为了满足 Phase 6 要求：可以选择触发。若想自动生成，可以按笔单独调用。
    const successCount = insertedIds.length;
    let voucherSuccessCount = 0;
    const voucherErrors: string[] = [];

    if (createVoucher) {
        // 并发进行凭证生成（限制同时并发数以免过载，或者串行）
        for (const item of insertedIds) {
            const journalRes = await generateAutoJournal({
                tenantId,
                sourceType: 'AUTO_EXPENSE',
                sourceId: item.id,
                amount: String(item.amount),
                description: `批量导入费用: ${item.description}`,
                operatorId: session.user.id!,
                date: new Date(), // 或取原明细日期
            });

            if (journalRes.success) {
                voucherSuccessCount++;
                // 异步回写 ID
                await db.update(expenseRecords).set({ journalEntryId: journalRes.entryId }).where(eq(expenseRecords.id, item.id));
            } else {
                voucherErrors.push(`[${item.description}] 生成失败: ${journalRes.error}`);
            }
        }
    }

    return {
        batchId,
        insertCount: successCount,
        voucherSuccessCount,
        voucherErrors: voucherErrors.length > 0 ? voucherErrors : undefined
    };
});

export async function importExpenseRecords(params: import('zod').infer<typeof importExpensesSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限校验
    if (!await checkPermission(session, PERMISSIONS.FINANCE.EXPENSE_CREATE)) {
        throw new Error('权限不足：需要财务新增权限');
    }

    return importExpensesActionInternal(params);
}
