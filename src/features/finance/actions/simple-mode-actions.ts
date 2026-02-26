'use server';

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { financeConfigs, expenseRecords, chartOfAccounts } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';

// ==========================
// 模式管理: Config读写
// ==========================

// 判断当前使用者属于专业状态还是简易状态 (默认为 simple)
export async function getFinanceMode() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  const tenantId = session.user.tenantId;

  try {
    const config = await db.query.financeConfigs.findFirst({
      where: and(
        eq(financeConfigs.tenantId, tenantId),
        eq(financeConfigs.configKey, 'finance_mode')
      ),
    });

    if (!config) {
      // 默认走简单模式
      return { success: true, mode: 'simple' as 'simple' | 'professional' };
    }

    return { success: true, mode: config.configValue as 'simple' | 'professional' };
  } catch (error) {
    logger.error('[finance] 获取财务模式失败', { error });
    throw new Error('加载数据失败');
  }
}

// 切换模式
export async function toggleFinanceMode(newMode: 'simple' | 'professional') {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: '未授权访问' };
  }

  const tenantId = session.user.tenantId;

  try {
    const config = await db.query.financeConfigs.findFirst({
      where: and(
        eq(financeConfigs.tenantId, tenantId),
        eq(financeConfigs.configKey, 'finance_mode')
      ),
    });

    if (config) {
      await db
        .update(financeConfigs)
        .set({ configValue: newMode })
        .where(eq(financeConfigs.id, config.id));
    } else {
      await db.insert(financeConfigs).values({
        tenantId,
        configKey: 'finance_mode',
        configValue: newMode,
      });
    }

    revalidatePath('/finance', 'layout');
    return { success: true };
  } catch (error) {
    logger.error('[finance] 切换财务模式失败', { error });
    return { error: '模式切换失败' };
  }
}

// ==========================
// 简易流水管理
// ==========================

// 初始化/获取极简科目（用于对接底层架构的占位）
async function getOrCreateSimpleBaseAccounts(tenantId: string) {
  let incomeAccount = await db.query.chartOfAccounts.findFirst({
    where: and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.code, 'SIMPLE_INCOME')),
  });

  let expenseAccount = await db.query.chartOfAccounts.findFirst({
    where: and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.code, 'SIMPLE_EXPENSE')),
  });

  if (!incomeAccount) {
    const inserted = await db
      .insert(chartOfAccounts)
      .values({
        tenantId,
        code: 'SIMPLE_INCOME',
        name: '基础收入(简易模式)',
        category: 'INCOME',
        isSystemDefault: true,
        description: '简易记账的底层收入科目统签',
      })
      .returning();
    incomeAccount = inserted[0];
  }

  if (!expenseAccount) {
    const inserted = await db
      .insert(chartOfAccounts)
      .values({
        tenantId,
        code: 'SIMPLE_EXPENSE',
        name: '基础支出(简易模式)',
        category: 'EXPENSE',
        isSystemDefault: true,
        description: '简易记账的底层支出科目统签',
      })
      .returning();
    expenseAccount = inserted[0];
  }

  return { incomeAccountId: incomeAccount.id, expenseAccountId: expenseAccount.id };
}

import { SimpleTransactionSchema, type SimpleTransactionInput } from '../types/simple-transaction';

// 新增简易流水 (使用 expenseRecords 借壳，类型靠底层占位科目区分)
export async function addSimpleTransaction(data: SimpleTransactionInput) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: '未授权访问' };
  }

  const parseResult = SimpleTransactionSchema.safeParse(data);
  if (!parseResult.success) {
    return { error: '输入数据验证失败', details: parseResult.error.flatten() };
  }

  const { type, amount, expenseDate, description } = parseResult.data;
  const tenantId = session.user.tenantId;

  try {
    const { incomeAccountId, expenseAccountId } = await getOrCreateSimpleBaseAccounts(tenantId);
    const targetAccountId = type === 'INCOME' ? incomeAccountId : expenseAccountId;

    /**
     * 设计决策：简易模式下的流水不自动映射到正规凭证或账期。
     * 简易模式面向小微商户，仅提供最轻量的收支记录功能。
     * 当用户从简易模式升级到专业模式时，可通过数据迁移服务批量生成对应凭证。
     */
    await db.insert(expenseRecords).values({
      tenantId,
      accountId: targetAccountId,
      amount: amount.toString(), // DB decimal
      description,
      expenseDate: expenseDate.toISOString(),
      createdBy: session.user.id,
    });

    revalidatePath('/finance/simple');
    return { success: true };
  } catch (error) {
    logger.error('[finance] 新增简易流水失败', { error });
    return { error: '新增失败，请稍后重试' };
  }
}

// 提取指定月份的流水记录列表
export async function getSimpleTransactions(yearMonthQuery: string) {
  // 格式: "2026-02"
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  const tenantId = session.user.tenantId;

  try {
    /**
     * 性能优化：使用数据库级 SQL 过滤替代全表查询后的内存过滤。
     * 利用 idx_expense_records_date 索引加速月份范围查询。
     */
    const records = await db.query.expenseRecords.findMany({
      where: and(
        eq(expenseRecords.tenantId, tenantId),
        sql`CAST(${expenseRecords.expenseDate} AS TEXT) LIKE ${yearMonthQuery + '%'}`
      ),
      orderBy: [desc(expenseRecords.expenseDate), desc(expenseRecords.createdAt)],
      with: {
        account: true,
      },
      limit: 500, // 防护性分页上限
    });

    // 提取简化视图
    const formatRecords = records.map((r) => ({
      id: r.id,
      date: r.expenseDate.split('T')[0],
      type: r.account.code === 'SIMPLE_INCOME' ? '收入' : '支出',
      amount: parseFloat(r.amount as string),
      description: r.description,
      createdAt: r.createdAt,
    }));

    return { success: true, data: formatRecords };
  } catch (error) {
    logger.error('[finance] 解析简易流水失败', { error });
    throw new Error('加载流水数据失败');
  }
}

// 当月收支汇总计算
export async function getSimpleSummary(yearMonthQuery: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  try {
    const transactionRes = await getSimpleTransactions(yearMonthQuery);
    if (!transactionRes.success) throw new Error();

    const rows = transactionRes.data || [];

    const totalIncome = rows.filter((r) => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = rows
      .filter((r) => r.type === '支出')
      .reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpense;

    return {
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
      },
    };
  } catch (error) {
    logger.error('[finance] 收支汇总统计失败', { error });
    throw new Error('统计数据失败');
  }
}
