'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, Calculator } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import {
  CurtainStrategy,
  CurtainCalcParams,
  CurtainCalcResult,
} from '../calc-strategies/curtain-strategy';
import { Separator } from '@/shared/ui/separator';

// ================= Types =================

interface ProductItem {
  id: string;
  name: string;
  retailPrice?: string | number;
  unitPrice?: string | number;
  specs?: Record<string, unknown>;
  defaultFoldRatio?: number;
}

export interface CurtainFormValues {
  measuredWidth: number;
  measuredHeight: number;
  foldRatio: number;
  clearance: number;
  openingType: 'SINGLE' | 'DOUBLE';
  headerType: 'WRAPPED' | 'ATTACHED';
  sideLoss: number;
  bottomLoss: number;
}

export interface CurtainQuoteFormProps {
  product: ProductItem | null;
  initialValues?: Partial<CurtainFormValues>;
  /** Callback when calculations or values update */
  onChange?: (values: CurtainFormValues, result: CurtainCalcResult | null) => void;
}

const DEFAULT_VALUES: CurtainFormValues = {
  measuredWidth: 0,
  measuredHeight: 0,
  foldRatio: 2.0,
  clearance: 0,
  openingType: 'DOUBLE', // 默认双开
  headerType: 'WRAPPED', // 默认包布带
  sideLoss: 0, // 0 表示自动计算 (Default in strategy is 10 for Double, 5 for Single)
  bottomLoss: 10, // 默认10cm
};

// ================= Component =================

export function CurtainFabricQuoteForm({
  product,
  initialValues,
  onChange,
}: CurtainQuoteFormProps) {
  const [values, setValues] = useState<CurtainFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Strategy Instance (memoized to avoid recreation, though it's cheap)
  const strategy = useMemo(() => new CurtainStrategy(), []);

  // --- Handlers ---
  const handleValueChange = (field: keyof CurtainFormValues, val: number | string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  // --- Calculation (Derived State) ---
  const calcResult = useMemo<CurtainCalcResult | null>(() => {
    if (!product) return null;

    const fabricWidth = Number(product.specs?.fabricWidth || 280);
    const fabricType =
      (product.specs?.fabricType as 'FIXED_HEIGHT' | 'FIXED_WIDTH') || 'FIXED_HEIGHT';
    const unitPrice = Number(product.retailPrice || product.unitPrice || 0);

    const params: CurtainCalcParams = {
      measuredWidth: values.measuredWidth,
      measuredHeight: values.measuredHeight,
      foldRatio: values.foldRatio,
      clearance: values.clearance,
      fabricWidth: fabricWidth,
      fabricType: fabricType,
      unitPrice: unitPrice,
      sideLoss: values.sideLoss || undefined,
      bottomLoss: values.bottomLoss,
      headerType: values.headerType,
      openingType: values.openingType,
    };

    return strategy.calculate(params);
  }, [values, product, strategy]);

  // --- Notify Parent Effect ---
  useEffect(() => {
    if (onChange) {
      onChange(values, calcResult);
    }
  }, [values, calcResult, onChange]);

  // If no product selected, show empty state or minimal inputs
  if (!product) {
    return (
      <div className="text-muted-foreground p-4 text-center text-sm">
        请先选择一个产品以进行计算
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground space-y-4 rounded-lg border p-4">
      {/* Header / Title */}
      <div className="mb-2 flex items-center gap-2">
        <Calculator className="text-primary h-4 w-4" />
        <h3 className="text-sm font-medium">尺寸与配置</h3>
      </div>

      {/* Basic Dimensions Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">测量宽度 (cm)</Label>
          <Input
            type="number"
            min={0}
            value={values.measuredWidth || ''}
            onChange={(e) => handleValueChange('measuredWidth', Number(e.target.value))}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">测量高度 (cm)</Label>
          <Input
            type="number"
            min={0}
            value={values.measuredHeight || ''}
            onChange={(e) => handleValueChange('measuredHeight', Number(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      {/* Fold & Opening Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">褶皱倍数</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step={0.1}
              min={1}
              max={3.5}
              value={values.foldRatio}
              onChange={(e) => handleValueChange('foldRatio', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">开合方式</Label>
          <Select
            value={values.openingType}
            onValueChange={(val: 'DOUBLE' | 'SINGLE') => handleValueChange('openingType', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DOUBLE">双开 (2片)</SelectItem>
              <SelectItem value="SINGLE">单开 (1片)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Trigger */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground flex w-full justify-between px-0"
          >
            <span className="text-xs">高级工艺参数 (损耗/离地)</span>
            {isAdvancedOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4 border-t pt-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Header Type */}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">帘头工艺</Label>
              <Select
                value={values.headerType}
                onValueChange={(val: 'WRAPPED' | 'ATTACHED') =>
                  handleValueChange('headerType', val)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WRAPPED">包布带 (默认20cm)</SelectItem>
                  <SelectItem value="ATTACHED">贴布带 (默认7cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Clearance */}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">离地扣减 (cm)</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={values.clearance}
                onChange={(e) => handleValueChange('clearance', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">底边损耗 (cm)</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={values.bottomLoss}
                onChange={(e) => handleValueChange('bottomLoss', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">侧边损耗 (cm/总)</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                placeholder="Auto"
                value={values.sideLoss || ''}
                onChange={(e) => handleValueChange('sideLoss', Number(e.target.value))}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-2" />

      {/* Results Live View */}
      {calcResult && (
        <div className="bg-muted/50 space-y-2 rounded-md p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">预估成品</span>
            <Badge variant="outline" className="bg-background">
              {calcResult.details.finishedWidth.toFixed(0)} x{' '}
              {calcResult.details.finishedHeight.toFixed(0)} cm
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-primary text-sm font-medium">计算用量</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold">{calcResult.usage.toFixed(2)}</span>
              <span className="text-muted-foreground text-xs">米</span>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>裁切宽: {calcResult.details.cutWidth.toFixed(0)}cm</span>
            <span>裁切高: {calcResult.details.cutHeight.toFixed(0)}cm</span>
          </div>

          {/* Warning / Constraint Status */}
          {calcResult.details.warning && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">超高提醒</AlertTitle>
              <AlertDescription className="text-xs">{calcResult.details.warning}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
