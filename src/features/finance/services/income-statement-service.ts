import { db } from '@/shared/api/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/shared/api/schema';
import { eq, inArray, and, gte, lte } from 'drizzle-orm';

export interface IncomeStatementData {
  periodStart: string;
  periodEnd: string;
  operatingIncome: {
    items: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
  operatingExpense: {
    items: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
  netIncome: number;
}

/**
 * 获取指定期间范围的利润表数据
 * 利润表是“期间数”，计算指定日期区间内的发生额
 */
export async function getIncomeStatementData(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<IncomeStatementData> {
  const formattedStart = startDate.toISOString().split('T')[0];
  const formattedEnd = endDate.toISOString().split('T')[0];

  const result: IncomeStatementData = {
    periodStart: formattedStart,
    periodEnd: formattedEnd,
    operatingIncome: { items: [], total: 0 },
    operatingExpense: { items: [], total: 0 },
    netIncome: 0,
  };

  // 1. 查出指定期间的已记账凭证
  const validEntries = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(journalEntries.status, 'POSTED'),
        gte(journalEntries.entryDate, formattedStart),
        lte(journalEntries.entryDate, formattedEnd)
      )
    );

  const entryIds = validEntries.map((e) => e.id);
  if (entryIds.length === 0) return result;

  // 2. 查出现有科目，过滤出 INCOME 和 EXPENSE 类（其它类不参与利润表计算）
  const accounts = await db
    .select()
    .from(chartOfAccounts)
    .where(
      and(
        eq(chartOfAccounts.tenantId, tenantId),
        inArray(chartOfAccounts.category, ['INCOME', 'EXPENSE'])
      )
    );

  if (accounts.length === 0) return result;

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // 3. 查出分录
  const allLines = await db
    .select()
    .from(journalEntryLines)
    .where(inArray(journalEntryLines.entryId, entryIds));

  // 4. 计算科目期间发生额
  const accountBalances = new Map<string, { debit: number; credit: number }>();
  for (const line of allLines) {
    // 只统计 INCOME 和 EXPENSE 科目
    if (!accountMap.has(line.accountId)) continue;

    const current = accountBalances.get(line.accountId) || { debit: 0, credit: 0 };
    current.debit += parseFloat(line.debitAmount);
    current.credit += parseFloat(line.creditAmount);
    accountBalances.set(line.accountId, current);
  }

  // 5. 按照利润表公式汇总数据
  for (const [accId, bal] of accountBalances.entries()) {
    const acc = accountMap.get(accId)!;

    // 收入类：贷方 - 借方
    if (acc.category === 'INCOME') {
      const balance = bal.credit - bal.debit;
      if (balance !== 0) {
        result.operatingIncome.items.push({ id: acc.id, code: acc.code, name: acc.name, balance });
        result.operatingIncome.total += balance;
      }
    }
    // 费用类：借方 - 贷方
    else if (acc.category === 'EXPENSE') {
      const balance = bal.debit - bal.credit;
      if (balance !== 0) {
        result.operatingExpense.items.push({ id: acc.id, code: acc.code, name: acc.name, balance });
        result.operatingExpense.total += balance;
      }
    }
  }

  // 排序
  result.operatingIncome.items.sort((a, b) => a.code.localeCompare(b.code));
  result.operatingExpense.items.sort((a, b) => a.code.localeCompare(b.code));

  // 计算净利润
  result.netIncome = result.operatingIncome.total - result.operatingExpense.total;

  // 保留两位小数
  result.operatingIncome.total = Number(result.operatingIncome.total.toFixed(2));
  result.operatingExpense.total = Number(result.operatingExpense.total.toFixed(2));
  result.netIncome = Number(result.netIncome.toFixed(2));

  return result;
}
