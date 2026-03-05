import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../../hooks/use-product-form';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface ProductPriceAndProfitProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductPriceAndProfit({ form }: ProductPriceAndProfitProps) {
  const getProfitMargin = (cost: number, price: number) => {
    if (price === 0) return { value: 0, danger: false };
    const margin = ((price - cost) / price) * 100;
    return { value: margin, danger: margin < 15 };
  };

  const purchasePrice = form.watch('purchasePrice') || 0;
  const logisticsCost = form.watch('logisticsCost') || 0;
  const processingCost = form.watch('processingCost') || 0;
  const lossRate = form.watch('lossRate') || 0;

  // 计算总成本: (采购价 + 物流 + 加工) * (1 + 损耗率)
  const baseCost = purchasePrice + logisticsCost + processingCost;
  const totalCost = baseCost * (1 + lossRate);

  const retailPrice = form.watch('retailPrice') || 0;
  const floorPrice = form.watch('floorPrice') || 0;

  const retailProfit = getProfitMargin(totalCost, retailPrice);
  const floorProfit = getProfitMargin(totalCost, floorPrice);

  return (
    <section className="space-y-4">
      <h3 className="border-l-4 border-green-500 pl-2 text-sm font-semibold">价格与利润</h3>
      <div className="rounded-md border p-4">
        {/* 成本 */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>采购价</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground block w-4 text-center">¥</span>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logisticsCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>物流预估成本</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground block w-4 text-center">¥</span>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="processingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>加工辅料成本</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground block w-4 text-center">¥</span>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lossRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>损耗率</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      placeholder="0.05"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <span className="text-muted-foreground">%</span>
                </div>
                <FormDescription>输入 0.05 表示 5%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 综合成本展示 */}
        <div className="mb-6 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">综合测算成本 (含损耗)</span>
            <span className="text-lg font-bold">¥{totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* 销售价格 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 零售价 */}
          <div className="bg-muted/50 space-y-3 rounded-lg p-3">
            <FormField
              control={form.control}
              name="retailPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>零售价 (指导价)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">¥</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {retailPrice > 0 && (
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>预期毛利</span>
                <span className="flex items-center gap-1 font-medium">
                  ¥{(retailPrice - totalCost).toFixed(2)}
                  <Badge
                    variant={retailProfit.danger ? 'destructive' : 'secondary'}
                    className="ml-1 px-1.5 py-0 text-[10px]"
                  >
                    {retailProfit.danger ? (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    )}
                    {retailProfit.value.toFixed(1)}%
                  </Badge>
                </span>
              </div>
            )}
          </div>

          {/* 底价 */}
          <div className="bg-muted/50 space-y-3 rounded-lg p-3">
            <FormField
              control={form.control}
              name="floorPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>销售底价</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">¥</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {floorPrice > 0 && (
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>预期毛利</span>
                <span className="flex items-center gap-1 font-medium">
                  ¥{(floorPrice - totalCost).toFixed(2)}
                  <Badge
                    variant={floorProfit.danger ? 'destructive' : 'secondary'}
                    className="ml-1 px-1.5 py-0 text-[10px]"
                  >
                    {floorProfit.danger ? (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    )}
                    {floorProfit.value.toFixed(1)}%
                  </Badge>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 毛利告警 */}
        {(retailProfit.danger || floorProfit.danger) && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>注意：部分价格利润率低于建议值(15%)，可能存在亏损风险。</p>
          </div>
        )}
      </div>
    </section>
  );
}
