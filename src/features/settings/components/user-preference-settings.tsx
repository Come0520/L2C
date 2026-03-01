'use client';

import { useTransition, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { toast } from 'sonner';
import { updateUserPreferences } from '@/features/settings/actions/preference-actions';
import { cn } from '@/shared/lib/utils';

interface UserPreferenceSettingsProps {
  initialQuoteMode: 'PRODUCT_FIRST' | 'SPACE_FIRST';
}

export function UserPreferenceSettings({ initialQuoteMode }: UserPreferenceSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [currentMode, setCurrentMode] = useState(initialQuoteMode);

  const handleModeChange = (value: string) => {
    const newMode = value as 'PRODUCT_FIRST' | 'SPACE_FIRST';
    setCurrentMode(newMode);

    startTransition(async () => {
      const result = await updateUserPreferences({ quoteMode: newMode });
      if (result.success) {
        toast.success('偏好设置已更新');
      } else {
        toast.error(result.error ?? '更新失败');
        // 回滚 UI 状态
        setCurrentMode(initialQuoteMode);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>报价偏好</CardTitle>
          <CardDescription>选择您偏好的报价工作流程</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentMode}
            onValueChange={handleModeChange}
            disabled={isPending}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div
              className={cn(
                'flex cursor-pointer items-start space-y-0 space-x-3 rounded-md border p-4 transition-colors',
                currentMode === 'PRODUCT_FIRST'
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="PRODUCT_FIRST" id="mode-product" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="mode-product" className="cursor-pointer font-bold">
                  产品优先
                </Label>
                <p className="text-muted-foreground text-sm">直接向报价单添加产品</p>
              </div>
            </div>
            <div
              className={cn(
                'flex cursor-pointer items-start space-y-0 space-x-3 rounded-md border p-4 transition-colors',
                currentMode === 'SPACE_FIRST'
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              )}
            >
              <RadioGroupItem value="SPACE_FIRST" id="mode-space" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="mode-space" className="cursor-pointer font-bold">
                  空间优先
                </Label>
                <p className="text-muted-foreground text-sm">按房间/空间组织产品</p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
