'use client';
import { logger } from '@/shared/lib/logger';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Save from 'lucide-react/dist/esm/icons/save';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  getTenantLaborRates,
  batchUpsertTenantLaborRates,
} from '@/features/service/installation/actions/pricing-actions';

/**
 * 劳务工费定价配置（重构版）
 *
 * 功能：
 * 1. 按产品品类设置基础单价
 * 2. 支持"按窗户数"或"按面积"计费模式
 * 3. 测量任务支持起步费
 */

// 品类配置定义
const CATEGORIES = [
  { key: 'CURTAIN', label: '窗帘安装', defaultUnit: 'WINDOW' },
  { key: 'WALLPAPER', label: '墙纸安装', defaultUnit: 'SQUARE_METER' },
  { key: 'WALLCLOTH', label: '墙布安装', defaultUnit: 'SQUARE_METER' },
  { key: 'WALLPANEL', label: '墙咔安装', defaultUnit: 'SQUARE_METER' },
  { key: 'MEASURE_LEAD', label: '线索测量', defaultUnit: 'WINDOW' },
  { key: 'MEASURE_PRECISE', label: '精准测量', defaultUnit: 'WINDOW' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

interface RateRow {
  category: CategoryKey;
  unitPrice: number;
  baseFee: number;
  unitType: 'WINDOW' | 'SQUARE_METER' | 'FIXED';
}

interface LaborPricingConfigProps {
  entityType?: 'TENANT' | 'WORKER';
  entityId?: string;
}

export function LaborPricingConfig({ entityType = 'TENANT', entityId }: LaborPricingConfigProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [rates, setRates] = useState<RateRow[]>([]);

  // 初始化加载
  useEffect(() => {
    async function loadRates() {
      setIsLoading(true);
      try {
        const result = await getTenantLaborRates();
        if (result.success && 'data' in result && result.data) {
          // 定义从数据库获取的费率数据接口
          interface LaborRateRecord {
            category: string;
            unitPrice: string | number | null;
            baseFee: string | number | null;
            unitType: string | null;
          }

          // 将数据库数据映射为表格行
          const existingRates = new Map<string, LaborRateRecord>(
            (result.data as LaborRateRecord[]).map((r) => [r.category, r])
          );

          const initialRates: RateRow[] = CATEGORIES.map((cat) => {
            const existing = existingRates.get(cat.key);
            return {
              category: cat.key,
              unitPrice: existing?.unitPrice ? parseFloat(existing.unitPrice.toString()) : 0,
              baseFee: existing?.baseFee ? parseFloat(existing.baseFee.toString()) : 0,
              unitType: (existing?.unitType || cat.defaultUnit) as RateRow['unitType'],
            };
          });

          setRates(initialRates);
        } else {
          // 使用默认值
          setRates(
            CATEGORIES.map((cat) => ({
              category: cat.key,
              unitPrice: 0,
              baseFee: 0,
              unitType: cat.defaultUnit as RateRow['unitType'],
            }))
          );
        }
      } catch (error) {
        logger.error('加载工费配置失败:', error);
        toast.error('加载工费配置失败');
      } finally {
        setIsLoading(false);
      }
    }

    loadRates();
  }, [entityType, entityId]);

  // 更新单条规则
  const updateRate = (category: CategoryKey, field: keyof RateRow, value: number | string) => {
    setRates((prev) =>
      prev.map((r) =>
        r.category === category
          ? { ...r, [field]: field === 'unitType' ? value : Number(value) || 0 }
          : r
      )
    );
  };

  // 保存所有规则
  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await batchUpsertTenantLaborRates(rates);
        if (result.success) {
          toast.success('工费配置已保存');
        } else {
          toast.error(result.error || '保存失败');
        }
      } catch (error) {
        logger.error('保存工费配置失败:', error);
        toast.error('保存失败');
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">劳务工费定价</CardTitle>
            <CardDescription className="text-sm">
              {entityType === 'TENANT'
                ? '设置租户标准工费，作为所有师傅的默认定价'
                : '设置该师傅的个性化工费（覆盖标准价）'}
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存配置
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">品类</TableHead>
                <TableHead className="w-[150px]">计费模式</TableHead>
                <TableHead className="w-[120px]">单价 (元)</TableHead>
                <TableHead className="w-[120px]">起步费 (元)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => {
                const catConfig = CATEGORIES.find((c) => c.key === rate.category);
                const isMeasure = rate.category.startsWith('MEASURE');

                return (
                  <TableRow key={rate.category}>
                    <TableCell className="font-medium">
                      {catConfig?.label || rate.category}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={rate.unitType}
                        onValueChange={(v) => updateRate(rate.category, 'unitType', v)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WINDOW">按窗户</SelectItem>
                          <SelectItem value="SQUARE_METER">按平米</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={rate.unitPrice}
                        onChange={(e) => updateRate(rate.category, 'unitPrice', e.target.value)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      {isMeasure ? (
                        <Input
                          type="number"
                          min={0}
                          step={10}
                          value={rate.baseFee}
                          onChange={(e) => updateRate(rate.category, 'baseFee', e.target.value)}
                          className="h-8 w-24"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          💡 提示：测量任务支持"起步费"，安装任务仅按单价计费。远程费在派单时单独填写。
        </p>
      </CardContent>
    </Card>
  );
}
