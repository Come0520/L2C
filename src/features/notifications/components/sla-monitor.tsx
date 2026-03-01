'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { runSLACheck as runSLACheckAction } from '../actions';
import { toast } from 'sonner';
import { Loader2, BellRing, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSession } from 'next-auth/react';

interface SLACheckResult {
  type: string;
  found: number;
  sent: number;
}

export function SLAMonitor() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SLACheckResult[] | null>(null);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

  const isAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

  const handleRunCheck = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await runSLACheckAction();
      if (res?.data?.success) {
        toast.success('SLA 检查完成');
        setLastResult(res.data.data as unknown as SLACheckResult[]);
        setLastRunAt(new Date());
      } else {
        toast.error(res?.error || 'SLA 检查失败');
      }
    } catch (_error) {
      toast.error('执行过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdminOrManager) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">SLA 监控面板</CardTitle>
        <BellRing className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          手动触发 SLA 检查 (包括线索跟进、测量派单及审批超时)。
        </p>

        <Button onClick={handleRunCheck} disabled={isLoading} variant="outline" className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          立即运行 SLA 检查
        </Button>

        {lastResult && lastResult.length > 0 ? (
          <div className="bg-muted/50 mt-4 space-y-2 rounded-md border p-4 text-sm">
            {lastResult.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">{r.type}</span>
                <span
                  className={cn(
                    'font-mono font-bold',
                    r.found > 0
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  发现: {r.found} / 已发送: {r.sent}
                </span>
              </div>
            ))}
          </div>
        ) : (
          lastResult && (
            <div className="mt-4 flex items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              系统运行正常
            </div>
          )
        )}

        {lastRunAt && (
          <p className="text-muted-foreground mt-2 text-right text-[10px]">
            上次运行: {lastRunAt.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
