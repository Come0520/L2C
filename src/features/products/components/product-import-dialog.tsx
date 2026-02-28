'use client';

import { logger } from "@/shared/lib/logger";

import { useState } from 'react';
import { ExcelImporter } from '@/shared/components/excel-import/excel-importer';
import { getImportConfigByCategory, BaseProductImportItem } from '@/features/products/import-config';
import { batchCreateProducts } from '@/features/products/actions/mutations';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FileUp, Info } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { CATEGORY_LABELS, CATEGORY_GROUPS } from '@/features/quotes/constants';
import { Alert, AlertDescription } from '@/shared/ui/alert';

interface ProductImportDialogProps {
  onSuccess?: () => void;
}

export function ProductImportDialog({ onSuccess }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleImport = async (data: BaseProductImportItem[]) => {
    try {
      const payload = data.map((item) => ({
        ...item,
        // Default values for fields not in Excel
        isToBEnabled: true,
        isToCEnabled: true,
        floorPrice: 0,
        isStockable: true,
        logisticsCost: 0,
        processingCost: 0,
        lossRate: 0,
        // channelPrice: item.retailPrice, // [Removed]
        defaultSupplierId: undefined, // Optional
        // attributes 由 preprocess 或 excel-importer 提取
        attributes: item.attributes || {},
      }));

      // 暂时用 unknown 断言，因为我们在 import-config 中移除了强类型转成的 payload
      const result = await batchCreateProducts(payload as unknown as Parameters<typeof batchCreateProducts>[0]);

      if (result.success && result.data) {
        const { successCount, errorCount, errors } = result.data;

        if (errorCount > 0) {
          // Show partial success or failure
          toast.warning(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`, {
            description: (
              <div className="mt-2 max-h-32 overflow-auto text-xs">
                {errors.map((err: { sku: string; error: string }, i: number) => (
                  <div key={i}>
                    {err.sku}: {err.error}
                  </div>
                ))}
              </div>
            ),
            duration: 5000,
          });
        } else {
          toast.success(`成功导入 ${successCount} 条商品`);
          setOpen(false);
        }

        if (successCount > 0) {
          onSuccess?.();
        }
      } else {
        toast.error(result.error || '导入操作失败');
      }
    } catch (error) {
      logger.error('Import failed', error);
      toast.error('导入处理失败');
      throw error; // Re-throw to let ExcelImporter handle state
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          批量导入数据
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <div className="bg-background rounded-lg border shadow-lg overflow-hidden flex flex-col h-[80vh]">
          <DialogHeader className="p-6 border-b bg-muted/30">
            <DialogTitle className="text-xl">批量导入商品</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">第一步：选择商品类型</label>
                <div className="flex gap-4 items-center">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="选择要导入的商品类型..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_GROUPS.map((group) => (
                        <SelectGroup key={group.value}>
                          <SelectLabel className="font-bold text-primary bg-muted/30">{group.label}</SelectLabel>
                          {group.categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="ml-2">
                              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  不同的商品类型拥有不同的规格尺寸和计价属性，请先选择对应的类型，再下载该类型的专属填写模板。图片（主图/场景图）请先完成数据的导入后，在商品列表通过「批量图片上传」匹配。
                </AlertDescription>
              </Alert>
            </div>

            {selectedCategory ? (
              <div className="space-y-4 pt-4 border-t">
                <label className="text-sm font-medium">第二步：下载模板并上传数据</label>
                <ExcelImporter
                  {...(getImportConfigByCategory(selectedCategory) as any)}
                  onImport={handleImport as any}
                />
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground text-sm">请先选择商品类型以获取专属的导入模板</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
