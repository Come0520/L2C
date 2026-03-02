'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { CheckCircle2, Zap } from 'lucide-react';
import { type PlanType } from '../lib/plan-limits';
import { useState } from 'react';
import { initiatePayment } from '../actions/subscription-actions';

interface UpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  fromPlan?: PlanType;
}

export function UpgradeModal({
  isOpen,
  onOpenChange,
  title = '升级您的套餐',
  description = '当前免费版额度已满，升级专业版解锁全部无限制特权。',
  fromPlan = 'base',
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      // 调用 Server Action 发起支付
      // 此处假设我们有 tenantId context，但更好的是通过后端自动获取或传参
      // 为简化演示，实际实现应该触发 checkout 流程或跳转订阅管理页
      console.log('即将前往支付...');
      // 可以跳转至 /dashboard/settings/billing
      window.location.href = '/dashboard/settings/billing';
    } catch (error) {
      console.error('操作失败', error);
      alert('无法发起升级操作，请刷新重试');
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Zap className="text-primary h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="from-background to-muted/50 my-6 rounded-2xl border bg-gradient-to-br p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">企业专业版 Pro</h3>
              <p className="text-muted-foreground mt-1 text-sm">满足中大型企业的所有需求</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">¥99</span>
                <span className="text-muted-foreground">/月</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <FeatureItem text="最高支持 15 个子账号" />
            <FeatureItem text="最高支持 5000 个客户档案" />
            <FeatureItem text="不限量生成报价单与订单" />
            <FeatureItem text="解锁数据导出、多级审批等高级功能" />
            <FeatureItem text="去除所有基础版水印标识" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? '加载中...' : '立即升级解锁'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            稍后考虑
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
      <span className="text-foreground/90 text-sm">{text}</span>
    </div>
  );
}
