'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { ExcelImporter } from '@/shared/components/excel-import';
import { productImportConfig, type ProductImportItem } from '../import-config';
import { createProduct } from '../actions';
import { toast } from 'sonner';

export function ProductImportDialog({
    children,
}: {
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    const handleImport = async (data: ProductImportItem[]) => {
        let successCount = 0;
        let errors = 0;

        for (const item of data) {
            const res = await createProduct(item as any);
            if (res?.error) {
                errors++;
            } else {
                successCount++;
            }
        }

        if (errors > 0) {
            toast.warning(`导入完成: ${successCount} 成功, ${errors} 失败`);
        } else {
            toast.success(`成功导入 ${successCount} 条商品`);
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                <ExcelImporter<ProductImportItem>
                    schema={productImportConfig.schema}
                    columnMapping={productImportConfig.columnMapping}
                    templateUrl={productImportConfig.templateUrl}
                    title={productImportConfig.title}
                    description={productImportConfig.description}
                    onImport={handleImport}
                />
            </DialogContent>
        </Dialog>
    );
}
