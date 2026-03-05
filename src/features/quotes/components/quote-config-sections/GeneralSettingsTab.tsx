'use client';

import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Card, CardContent } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { AVAILABLE_FIELDS } from '../../constants/quote-config';

interface GeneralSettingsTabProps {
  /** 当前报价模式 */
  mode: 'simple' | 'advanced';
  /** 模式切换回调 */
  onModeChange: (mode: 'simple' | 'advanced') => void;
  /** 当前默认方案 */
  defaultPlan: 'ECONOMIC' | 'COMFORT' | 'LUXURY';
  /** 默认方案切换回调 */
  onDefaultPlanChange: (plan: 'ECONOMIC' | 'COMFORT' | 'LUXURY') => void;
  /** 已选中的显示字段 */
  selectedFields: string[];
  /** 字段切换回调 */
  onFieldToggle: (fieldId: string) => void;
}

/**
 * 通用设置 Tab 面板
 *
 * @description 包含报价模式选择、默认方案选择和显示字段勾选配置。
 */
export function GeneralSettingsTab({
  mode,
  onModeChange,
  defaultPlan,
  onDefaultPlanChange,
  selectedFields,
  onFieldToggle,
}: GeneralSettingsTabProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 模式 + 默认方案选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>报价模式</Label>
              <Select value={mode} onValueChange={(v: 'simple' | 'advanced') => onModeChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">极简模式</SelectItem>
                  <SelectItem value="advanced">专业模式</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>默认方案</Label>
              <Select
                value={defaultPlan}
                onValueChange={(v: 'ECONOMIC' | 'COMFORT' | 'LUXURY') => onDefaultPlanChange(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMIC">经济型</SelectItem>
                  <SelectItem value="COMFORT">舒适型</SelectItem>
                  <SelectItem value="LUXURY">豪华型</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            极简模式隐藏实测数据和复杂参数。专业模式支持三级价格方案切换。
          </p>

          {/* 显示字段勾选 */}
          <div className="space-y-3">
            <Label>显示字段</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_FIELDS.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => onFieldToggle(field.id)}
                  />
                  <Label htmlFor={field.id} className="cursor-pointer text-sm font-normal">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
