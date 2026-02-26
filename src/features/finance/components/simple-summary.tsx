import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

interface SimpleSummaryProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export function SimpleSummaryCards({ summary }: SimpleSummaryProps) {
  const isProfit = summary.balance >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">当月总收入</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ¥{summary.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">当月总支出</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            ¥{summary.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">本月结余</CardTitle>
          <Wallet className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfit ? 'text-black' : 'text-red-600'}`}>
            ¥{summary.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
