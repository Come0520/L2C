'use server';
import { db } from '@/shared/api/db';
import {
    journalEntries,
    journalEntryLines,
    accountingPeriods,
    chartOfAccounts,
} from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';
import { eq, and, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidateTag } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { createJournalEntrySchema, updateJournalEntryStatusSchema } from './schema';
import { validateLinesBalance } from '../services/journal-validation-service';
import { reverseJournalEntry } from '../services/journal-reversal-service';
import { generateBusinessNo } from '@/shared/lib/generate-no';
import { getFinanceMode } from './simple-mode-actions';
import { canCreateJournal, canReviewJournal, canReverseJournal, canViewReports } from '../utils/finance-permissions';

/**
 * 获取凭证列表
 */
export async function getJournalEntries(params?: { limit?: number; offset?: number; status?: string; periodId?: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (!canViewReports(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.JOURNAL_VIEW)) {
        throw new Error('权限不足：需要财务查看权限');
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const tenantId = session.user.tenantId;

    const conditions = [eq(journalEntries.tenantId, tenantId)];
    if (params?.status) {
        conditions.push(eq(journalEntries.status, params.status as 'DRAFT' | 'PENDING_REVIEW' | 'POSTED'));
    }
    if (params?.periodId) {
        conditions.push(eq(journalEntries.periodId, params.periodId));
    }

    const whereClause = and(...conditions);

    // 注意：Next.js 未提供 unstable_cache 与 Server Action 联动的标准方案
    // 当前采用 revalidateTag 做缓存失效，后续可升级为 next/cache 原生方案
    return await db.query.journalEntries.findMany({
        where: whereClause,
        with: {
            period: true,
        },
        orderBy: [desc(journalEntries.createdAt)],
        limit,
        offset,
    });
}

/**
 * 获取单个凭证详情及分录明细
 */
export async function getJournalEntryById(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (!canViewReports(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.JOURNAL_VIEW)) {
        throw new Error('权限不足：需要财务查看权限');
    }

    const tenantId = session.user.tenantId;

    const entry = await db.query.journalEntries.findFirst({
        where: and(
            eq(journalEntries.id, id),
            eq(journalEntries.tenantId, tenantId)
        ),
        with: {
            period: true,
            lines: {
                with: {
                    account: true,
                },
                orderBy: (lines, { asc }) => [asc(lines.sortOrder)],
            }
        }
    });

    return entry;
}

/**
 * 创建草稿凭证
 */
export const createJournalEntry = createSafeAction(createJournalEntrySchema, async (data, { session }) => {
    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (!canCreateJournal(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.JOURNAL_CREATE)) {
        throw new Error('权限不足：需要财务创建或记账权限');
    }

    const { periodId, entryDate, description, lines } = data;

    // 1. 校验借贷平衡
    const balanceCheck = validateLinesBalance(
        lines.map(l => ({ debitAmount: String(l.debitAmount), creditAmount: String(l.creditAmount) }))
    );
    if (!balanceCheck.isValid) {
        throw new Error(`借贷不平衡：借方合计 ${balanceCheck.totalDebit}, 贷方合计 ${balanceCheck.totalCredit}`);
    }

    return await db.transaction(async (tx) => {
        // 2. 检查账期是否开放
        const [period] = await tx.select().from(accountingPeriods).where(eq(accountingPeriods.id, periodId));
        if (!period || period.status !== 'OPEN') {
            throw new Error('所选账单周期无效或已关闭');
        }

        // 3. 生成凭证主表
        const voucherNo = generateBusinessNo('PZ');
        const [newEntry] = await tx.insert(journalEntries).values({
            tenantId: session.user.tenantId,
            voucherNo,
            periodId,
            entryDate: entryDate.toISOString().split('T')[0],
            description,
            status: 'DRAFT',
            sourceType: 'MANUAL',
            totalDebit: balanceCheck.totalDebit,
            totalCredit: balanceCheck.totalCredit,
            createdBy: session.user.id!,
        }).returning();

        // 4. 插入明细行
        const lineValues = lines.map((line, index) => ({
            entryId: newEntry.id,
            accountId: line.accountId,
            debitAmount: String(line.debitAmount),
            creditAmount: String(line.creditAmount),
            description: line.description,
            sortOrder: index,
        }));
        await tx.insert(journalEntryLines).values(lineValues);

        // 5. 审计日志
        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'journal_entries',
            recordId: newEntry.id,
            action: 'CREATE',
            newValues: { ...newEntry },
        });

        revalidateTag(`finance-journal-${session.user.tenantId}`, {});
        return newEntry;
    });
});

/**
 * 更新凭证状态（提交复核、审核通过、驳回）
 */
export const updateJournalEntryStatus = createSafeAction(updateJournalEntryStatusSchema, async (data, { session }) => {
    const { id, status, rejectReason } = data;
    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (status === 'POSTED') {
        if (!canReviewJournal(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.APPROVE)) {
            throw new Error('权限不足：需要财务复核员审核权限');
        }
    } else {
        if (!canCreateJournal(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.JOURNAL_CREATE)) {
            throw new Error('权限不足：需要财务记账人员编辑权限');
        }
    }

    return await db.transaction(async (tx) => {
        const [entry] = await tx.select().from(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.tenantId, session.user.tenantId)));
        if (!entry) throw new Error('凭证不存在');

        // 状态机校验
        if (status === 'PENDING_REVIEW' && entry.status !== 'DRAFT') {
            throw new Error('只有草稿状态的凭证才能提交审核');
        }
        if (status === 'POSTED' && entry.status !== 'PENDING_REVIEW') {
            throw new Error('只有待审核状态的凭证才能记账');
        }
        if (status === 'DRAFT' && entry.status !== 'PENDING_REVIEW') {
            throw new Error('只有待审核状态的凭证才能被驳回');
        }

        const updateData: Partial<typeof journalEntries.$inferInsert> = { status, updatedAt: new Date() };
        const remarkBase = entry.description || '';

        if (status === 'POSTED') {
            updateData.reviewedBy = session.user.id;
            updateData.reviewedAt = new Date();
            updateData.postedAt = new Date();
        } else if (status === 'DRAFT' && rejectReason) {
            updateData.description = `${remarkBase} [驳回原因: ${rejectReason}]`;
        }

        const [updated] = await tx.update(journalEntries)
            .set(updateData)
            .where(eq(journalEntries.id, id))
            .returning();

        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'journal_entries',
            recordId: id,
            action: 'UPDATE',
            oldValues: { status: entry.status },
            newValues: { status },
            details: { action: 'STATUS_CHANGE', targetStatus: status, rejectReason }
        });

        revalidateTag(`finance-journal-${session.user.tenantId}`, {});
        return updated;
    });
});

/**
 * 红字冲销凭证
 */
export async function reverseJournal(id: string, description: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (!canReverseJournal(roles, isSimpleMode) && !await checkPermission(session, PERMISSIONS.FINANCE.APPROVE)) {
        throw new Error('权限不足：只有财务主管或具备审核权限的用户可操作红字冲销');
    }

    const result = await reverseJournalEntry(
        id,
        session.user.id!,
        session.user.tenantId,
        description
    );

    if (!result.success) {
        throw new Error(result.error);
    }

    revalidateTag(`finance-journal-${session.user.tenantId}`, {});
    return result;
}

/**
 * 获取科目下拉选项，用于新增凭证时的选项
 */
export async function getAccountOptions() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.JOURNAL_VIEW)) throw new Error('权限不足');

    return await db.query.chartOfAccounts.findMany({
        where: and(
            eq(chartOfAccounts.tenantId, session.user.tenantId),
            eq(chartOfAccounts.isActive, true)
        ),
        orderBy: (accounts, { asc }) => [asc(accounts.code)],
    });
}

/**
 * 获取开放账期选项
 */
export async function getOpenPeriods() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.accountingPeriods.findMany({
        where: and(
            eq(accountingPeriods.tenantId, session.user.tenantId),
            eq(accountingPeriods.status, 'OPEN')
        ),
        orderBy: (periods, { desc }) => [desc(periods.year), desc(periods.month)],
    });
}
