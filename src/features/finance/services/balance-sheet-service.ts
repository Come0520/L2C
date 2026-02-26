import { db } from '@/shared/api/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/shared/api/schema';
import { eq, inArray, and, lte } from 'drizzle-orm';

export interface BalanceSheetData {
  assets: {
    items: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
  liabilities: {
    items: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
  equity: {
    items: Array<{ id: string; code: string; name: string; balance: number }>;
    total: number;
  };
  isBalanced: boolean;
}

/**
 * 获取截至指定日期的资产负债表数据
 * 资产负债表是“时点数”，计算截至该日期的累计余额
 */
export async function getBalanceSheetData(
  tenantId: string,
  asOfDate: Date
): Promise<BalanceSheetData> {
  const formattedDate = asOfDate.toISOString().split('T')[0];

  // 1. 查出所有已记账凭证并且日期早于等于截止日期
  const validEntries = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(journalEntries.status, 'POSTED'),
        lte(journalEntries.entryDate, formattedDate)
      )
    );

  const entryIds = validEntries.map((e) => e.id);

  // 2. 查出所有启用的会计科目（只需要获取1级或者明细，这里我们按1级科目汇总展示）
  // 为了简化，我们取出所有科目，但是汇总到一级科目上。现阶段展示所有科目余额也行。
  const allAccounts = await db
    .select()
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.tenantId, tenantId));

  if (entryIds.length === 0) {
    return buildEmptyBalanceSheet();
  }

  // 3. 查出这些凭证的所有分录
  const allLines = await db
    .select()
    .from(journalEntryLines)
    .where(inArray(journalEntryLines.entryId, entryIds));

  // 4. 按科目汇总借贷发生额
  const accountBalances = new Map<string, { debit: number; credit: number }>();
  for (const line of allLines) {
    const current = accountBalances.get(line.accountId) || { debit: 0, credit: 0 };
    current.debit += parseFloat(line.debitAmount);
    current.credit += parseFloat(line.creditAmount);
    accountBalances.set(line.accountId, current);
  }

  // 5. 将余额分配到五大类计算
  let totalIncome = 0;
  let totalExpense = 0;

  const result: BalanceSheetData = {
    assets: { items: [], total: 0 },
    liabilities: { items: [], total: 0 },
    equity: { items: [], total: 0 },
    isBalanced: false,
  };

  for (const acc of allAccounts) {
    const bal = accountBalances.get(acc.id) || { debit: 0, credit: 0 };

    // 资产类科目余额 = 借方 - 贷方
    if (acc.category === 'ASSET') {
      const balance = bal.debit - bal.credit;
      if (balance !== 0) {
        result.assets.items.push({ id: acc.id, code: acc.code, name: acc.name, balance });
        result.assets.total += balance;
      }
    }
    // 负债类科目余额 = 贷方 - 借方
    else if (acc.category === 'LIABILITY') {
      const balance = bal.credit - bal.debit;
      if (balance !== 0) {
        result.liabilities.items.push({ id: acc.id, code: acc.code, name: acc.name, balance });
        result.liabilities.total += balance;
      }
    }
    // 权益类科目余额 = 贷方 - 借方
    else if (acc.category === 'EQUITY') {
      const balance = bal.credit - bal.debit;
      if (balance !== 0) {
        result.equity.items.push({ id: acc.id, code: acc.code, name: acc.name, balance });
        result.equity.total += balance;
      }
    }
    // 收入类：贷方 - 借方
    else if (acc.category === 'INCOME') {
      totalIncome += bal.credit - bal.debit;
    }
    // 费用类：借方 - 贷方
    else if (acc.category === 'EXPENSE') {
      totalExpense += bal.debit - bal.credit;
    }
  }

  // 6. 核心逻辑：将未分配利润（本年利润）结转入所有者权益
  // 净利润 = 收入 - 费用
  const netProfit = totalIncome - totalExpense;
  if (netProfit !== 0) {
    // 查找或虚拟一条“本年利润”记录放入 equity
    result.equity.items.push({
      id: 'virtual-net-profit',
      code: '3131', // 常见的本年利润科目代码
      name: '未分配利润(本期内)',
      balance: netProfit,
    });
    result.equity.total += netProfit;
  }

  // 按照 code 排序
  result.assets.items.sort((a, b) => a.code.localeCompare(b.code));
  result.liabilities.items.sort((a, b) => a.code.localeCompare(b.code));
  result.equity.items.sort((a, b) => a.code.localeCompare(b.code));

  // 解决浮点数精度
  result.assets.total = Number(result.assets.total.toFixed(2));
  result.liabilities.total = Number(result.liabilities.total.toFixed(2));
  result.equity.total = Number(result.equity.total.toFixed(2));

  const roundingDiff = Math.abs(
    result.assets.total - (result.liabilities.total + result.equity.total)
  );
  result.isBalanced = roundingDiff < 0.01;

  return result;
}

function buildEmptyBalanceSheet(): BalanceSheetData {
  return {
    assets: { items: [], total: 0 },
    liabilities: { items: [], total: 0 },
    equity: { items: [], total: 0 },
    isBalanced: true,
  };
}
