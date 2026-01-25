'use client';

import { useState } from 'react';
import { ExcelImporter } from '@/shared/components/excel-import/excel-importer';
import { productImportConfig, ProductImportItem } from '@/features/products/import-config';
import { batchCreateProducts } from '@/features/products/actions/mutations';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FileUp } from 'lucide-react';

interface ProductImportDialogProps {
  onSuccess?: () => void;
}

export function ProductImportDialog({ onSuccess }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false);

  const handleImport = async (data: ProductImportItem[]) => {
    try {
      // Transform simplified import data to full product creation schema
      // @ts-expect-error - Valid default values injection
      const payload = data.map((item) => ({
        ...item,
        // Default values for fields not in Excel
        isToBEnabled: true,
        isToCEnabled: true,
        channelPriceMode: 'discount', // Default mode
        channelDiscountRate: 1,
        floorPrice: 0,
        isStockable: true,
        logisticsCost: 0,
        processingCost: 0,
        lossRate: 0,
        channelPrice: item.retailPrice, // Default channel price to retail price
        defaultSupplierId: undefined, // Optional
        attributes: {},
      }));

      // @ts-expect-error - Payload type compatibility check
      const result = await batchCreateProducts(payload);

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
      console.error('Import failed', error);
      toast.error('导入处理失败');
      throw error; // Re-throw to let ExcelImporter handle state
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <ExcelImporter
          {...productImportConfig}
          onImport={handleImport}
          title="批量导入商品"
          description="请使用模板文件导入商品数据。支持 .xlsx 格式。"
        />
      </DialogContent>
    </Dialog>
  );
}
