import { db } from '@/shared/api/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/shared/api/schema';
import { eq, inArray, and, gte, lte } from 'drizzle-orm';

export interface CashFlowData {
  periodStart: string;
  periodEnd: string;
  operatingActivities: {
    inflows: Array<{ sourceId: string; description: string; amount: number }>;
    totalInflow: number;
    outflows: Array<{ sourceId: string; description: string; amount: number }>;
    totalOutflow: number;
    netCashFlow: number;
  };
  // 简易处理：目前的系统主要业务皆为经营活动，这里预留投资和筹资类的扩展字段。
  netIncrease: number;
}

/**
 * 获取指定期间范围的现金流量表数据（简易法近似推导）
 * 逻辑：寻找分录中涉及“现金及现金等价物”的凭证。如果现金科目在借方，为净流入；在贷方，为净流出。
 */
export async function getCashFlowData(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<CashFlowData> {
  const formattedStart = startDate.toISOString().split('T')[0];
  const formattedEnd = endDate.toISOString().split('T')[0];

  const result: CashFlowData = {
    periodStart: formattedStart,
    periodEnd: formattedEnd,
    operatingActivities: {
      inflows: [],
      totalInflow: 0,
      outflows: [],
      totalOutflow: 0,
      netCashFlow: 0,
    },
    netIncrease: 0,
  };

  // 1. 获取所有的现金及现金等价物科目
  // 简化定义：名称包含"现金","银行","微信","支付"或者是 1001, 1002 开头的资产科目
  const accounts = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.tenantId, tenantId), eq(chartOfAccounts.category, 'ASSET')));

  const cashAccountIds = new Set(
    accounts
      .filter(
        (a) =>
          a.code.startsWith('1001') ||
          a.code.startsWith('1002') ||
          a.name.includes('现金') ||
          a.name.includes('银行') ||
          a.name.includes('微信') ||
          a.name.includes('支付')
      )
      .map((a) => a.id)
  );

  if (cashAccountIds.size === 0) return result;

  // 2. 查询指定日期的记账凭证
  const validEntries = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.tenantId, tenantId),
        eq(journalEntries.status, 'POSTED'),
        gte(journalEntries.entryDate, formattedStart),
        lte(journalEntries.entryDate, formattedEnd)
      )
    );

  if (validEntries.length === 0) return result;
  const entryMap = new Map(validEntries.map((e) => [e.id, e]));
  const entryIds = Array.from(entryMap.keys());

  // 3. 查出这些凭证的所有涉及现金科目的分录
  const cashLines = await db
    .select()
    .from(journalEntryLines)
    .where(
      and(
        inArray(journalEntryLines.entryId, entryIds),
        inArray(journalEntryLines.accountId, Array.from(cashAccountIds))
      )
    );

  // 4. 根据现金在借方（流入）或贷方（流出）分类
  for (const line of cashLines) {
    const entry = entryMap.get(line.entryId);
    if (!entry) continue;

    const debit = parseFloat(line.debitAmount);
    const credit = parseFloat(line.creditAmount);

    // 如果凭证本身是红字冲销凭证，所有的发生额视为相反效果
    const direction = entry.isReversal ? -1 : 1;

    if (debit > 0) {
      // 现金增加 = 流入
      const amount = debit * direction;
      if (amount !== 0) {
        result.operatingActivities.inflows.push({
          sourceId: entry.id,
          description: entry.description || '收款确认',
          amount: amount,
        });
        result.operatingActivities.totalInflow += amount;
      }
    }

    if (credit > 0) {
      // 现金减少 = 流出
      const amount = credit * direction;
      if (amount !== 0) {
        result.operatingActivities.outflows.push({
          sourceId: entry.id,
          description: entry.description || '付款支出',
          amount: amount,
        });
        result.operatingActivities.totalOutflow += amount;
      }
    }
  }

  // 计算净额
  result.operatingActivities.netCashFlow =
    result.operatingActivities.totalInflow - result.operatingActivities.totalOutflow;
  result.netIncrease = result.operatingActivities.netCashFlow;

  // 保留两位小数
  result.operatingActivities.totalInflow = Number(
    result.operatingActivities.totalInflow.toFixed(2)
  );
  result.operatingActivities.totalOutflow = Number(
    result.operatingActivities.totalOutflow.toFixed(2)
  );
  result.operatingActivities.netCashFlow = Number(
    result.operatingActivities.netCashFlow.toFixed(2)
  );
  result.netIncrease = Number(result.netIncrease.toFixed(2));

  return result;
}
