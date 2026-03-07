'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { getTenantUsageSummaryAction } from '../actions/usage-actions';
import { PlanResource, PLAN_LIMITS } from '../lib/plan-limits';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { UpgradeModal } from './upgrade-modal';

interface UsageItem {
  resource: PlanResource;
  currentValue: number;
  limitStr: string;
  isUnlimited: boolean;
  percentage: number;
}

export function UsageDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    planType: string;
    isGrandfathered: boolean;
    usages: UsageItem[];
  } | null>(null);
  const [error, setError] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getTenantUsageSummaryAction();
        setData(res);
      } catch (err: any) {
        setError(err.message || '加载用量失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { planType, isGrandfathered, usages } = data;
  const isFree = planType === 'base' && !isGrandfathered;

  const planNameMap: Record<string, string> = {
    base: '基础版 (Base)',
    pro: '专业版 (Pro)',
    enterprise: '企业版 (Enterprise)',
  };

  return (
    <Card className={isFree ? 'border-primary/20 bg-primary/5' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">用量与限制</CardTitle>
          <CardDescription>
            当前套餐：
            <span className="text-foreground font-semibold">
              {planNameMap[planType] || planType}
            </span>
            {isGrandfathered && <span className="ml-2 text-amber-500">(内测老用户，免限额)</span>}
          </CardDescription>
        </div>
        {isFree && (
          <Button onClick={() => setIsUpgradeModalOpen(true)} size="sm">
            升级套餐
          </Button>
        )}
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        {usages.map((item) => {
          let progressColor = 'bg-primary';
          if (item.percentage >= 90 && !item.isUnlimited) progressColor = 'bg-destructive';
          else if (item.percentage >= 70 && !item.isUnlimited) progressColor = 'bg-amber-500';

          return (
            <div key={item.resource} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getResourceLabel(item.resource)}</span>
                <span className="text-muted-foreground">
                  <span
                    className={
                      item.percentage >= 100 && !item.isUnlimited
                        ? 'text-destructive font-bold'
                        : ''
                    }
                  >
                    {item.currentValue}
                  </span>{' '}
                  / {item.limitStr}
                </span>
              </div>
              <div>
                {/* 自定义进度条颜色 */}
                <Progress
                  value={item.percentage}
                  className="h-2"
                  indicatorClassName={progressColor}
                />
              </div>
            </div>
          );
        })}
      </CardContent>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        title="套餐扩容"
        description="升级专业版以突破当前的配额限制，解锁更多高级特性。"
      />
    </Card>
  );
}

function getResourceLabel(r: PlanResource): string {
  const map: Record<PlanResource, string> = {
    users: '员工数量',
    customers: '客户数量',
    quotesPerMonth: '本月报价单生成量',
    ordersPerMonth: '本月订单生成量',
    showroomProducts: '云展厅上架名额',
    storageBytes: '存储空间 (MB)',
    aiRenderingCredits: 'AI 效果图积分',
  };
  return map[r] || r;
}

/** 扩展 Progress 以支持自定义颜色 */
// (如果 UI 组件库内的 Progress 不支持 indicatorClassName，这里可以通过覆盖 className 的方式，或者依靠全局样式。此处假定 indicatorClassName 存在)
