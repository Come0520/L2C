'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PiggyBank, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleFinanceMode } from '../actions/simple-mode-actions';

interface FinanceModeCardsProps {
  currentMode: 'simple' | 'professional' | null;
}

export function FinanceModeCards({ currentMode }: FinanceModeCardsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeMode, setActiveMode] = useState<'simple' | 'professional' | null>(currentMode);

  const handleSelectMode = (mode: 'simple' | 'professional') => {
    if (activeMode === mode) {
      // 已经处于该模式，直接跳转
      router.push(mode === 'simple' ? '/finance/simple' : '/finance');
      return;
    }

    if (mode === 'simple') {
      if (
        !confirm(
          '注意：切换到简易模式后，当前界面的凭证、科目都将被屏蔽，新发生的收支仅以“收入/支出”方式记录。\n\n您确定要切换吗？'
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await toggleFinanceMode(mode);
        if (res.error) {
          toast.error(res.error);
        } else {
          setActiveMode(mode);
          toast.success(`已切换至${mode === 'simple' ? '极简收支' : '专业会计'}模式`);

          if (mode === 'simple') {
            router.push('/finance/simple');
          } else {
            // 专业模式自动进入到 /finance 仪表盘 (本页面刷新渲染即可展示看板)
            router.push('/finance');
            router.refresh();
          }
        }
      } catch (_error) {
        toast.error('模式切换操作失败');
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 极简模式卡片 */}
      <Card
        className={`hover:border-primary-500 relative cursor-pointer transition-all hover:shadow-md ${activeMode === 'simple' ? 'border-primary-500 bg-primary-50/50 border-2' : 'border'
          }`}
        onClick={() => handleSelectMode('simple')}
      >
        {activeMode === 'simple' && (
          <div className="text-primary-600 absolute top-4 right-4">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        )}
        <CardHeader>
          <div className="mb-2 inline-flex w-fit items-center justify-center rounded-lg bg-green-100 p-3 text-green-600">
            <PiggyBank className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">极简收支流水模式</CardTitle>
          <CardDescription className="mt-2 text-sm">
            适合个体户或小微初创团队。系统不强制使用借贷记账法，仅以简单的“收入”和“支出”方式记录资金往来。界面清爽简单，一目了然。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
            <li>无需学习会计复式记账知识</li>
            <li>简单的收入支出分类录入</li>
            <li>图表化展示当月收支情况</li>
            <li>审批单据仅关联收支记录，不生成专业凭证</li>
          </ul>
          <div className="mt-6">
            <Button
              variant={activeMode === 'simple' ? 'default' : 'outline'}
              className="w-full"
              disabled={isPending}
            >
              {isPending ? '切换中...' : activeMode === 'simple' ? '进入极简版' : '选择极简版'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 专业模式卡片 */}
      <Card
        className={`relative cursor-pointer transition-all hover:border-blue-500 hover:shadow-md ${activeMode === 'professional' ? 'border-2 border-blue-500 bg-blue-50/50' : 'border'
          }`}
        onClick={() => handleSelectMode('professional')}
      >
        {activeMode === 'professional' && (
          <div className="absolute top-4 right-4 text-blue-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        )}
        <CardHeader>
          <div className="mb-2 inline-flex w-fit items-center justify-center rounded-lg bg-blue-100 p-3 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">专业企业复式记账</CardTitle>
          <CardDescription className="mt-2 text-sm">
            适合拥有专职财务或需要专业报表的企业。系统将强制采用标准的借贷复式记账法，启用完整的五大类会计科目及日记账管理。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
            <li>标准五类会计科目树（资产、负债等）</li>
            <li>严格的凭证录入与红字冲销纪律</li>
            <li>自动生成资产负债表与利润表</li>
            <li>业务单据审批可自动映射生成会计凭证</li>
          </ul>
          <div className="mt-6">
            <Button
              variant={activeMode === 'professional' ? 'default' : 'outline'}
              className="w-full"
              disabled={isPending}
            >
              {isPending
                ? '切换中...'
                : activeMode === 'professional'
                  ? '进入专业版看板'
                  : '升级至专业版'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
