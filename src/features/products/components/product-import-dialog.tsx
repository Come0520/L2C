'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { ExcelImporter } from '@/shared/components/excel-import';
import { productImportConfig, type ProductImportItem } from '../import-config';
import { batchCreateProducts } from '../actions';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';

/**
 * 产品批量导入对话框
 * [Product-02] 优化版本 - 支持批量创建和详细错误报告
 */
export function ProductImportDialog({
    children,
}: {
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [importResult, setImportResult] = useState<{
        successCount: number;
        errorCount: number;
        errors: { row: number; sku: string; error: string }[];
    } | null>(null);

    const handleImport = async (data: ProductImportItem[]) => {
        setImportResult(null);

        // 数据预处理：添加创建产品所需的默认值
        const enrichedData = data.map(item => ({
            ...item,
            // 确保必填字段有默认值
            unit: item.unit || '件',
            purchasePrice: item.purchasePrice || 0,
            retailPrice: item.retailPrice || 0,
            logisticsCost: 0,
            processingCost: 0,
            lossRate: 0.05,
            channelPriceMode: 'FIXED' as const,
            channelPrice: 0,
            channelDiscountRate: 1,
            floorPrice: 0,
            isToBEnabled: true,
            isToCEnabled: true,
            isStockable: false,
            attributes: {},
        }));

        try {
            const result = await batchCreateProducts(enrichedData);

            // 处理返回结果
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resultData = result as any;

            if (resultData.successCount !== undefined) {
                setImportResult({
                    successCount: resultData.successCount || 0,
                    errorCount: resultData.errorCount || 0,
                    errors: resultData.errors || []
                });

                if (resultData.errorCount === 0) {
                    toast.success(`成功导入 ${resultData.successCount} 条商品`);
                    setTimeout(() => setOpen(false), 1500);
                } else if (resultData.successCount > 0) {
                    toast.warning(`部分导入成功: ${resultData.successCount} 成功, ${resultData.errorCount} 失败`);
                } else {
                    toast.error(`导入失败: ${resultData.errorCount} 条记录有错误`);
                }
            } else if (resultData.error) {
                toast.error(resultData.error);
            }
        } catch (error) {
            console.error('导入异常:', error);
            toast.error('导入过程中发生错误');
        }
    };

    const handleReset = () => {
        setImportResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) setImportResult(null);
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                {importResult ? (
                    <div className="bg-card p-6 rounded-lg border shadow-lg space-y-4">
                        {/* 导入结果概览 */}
                        <div className="flex items-center gap-4">
                            {importResult.errorCount === 0 ? (
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : importResult.successCount > 0 ? (
                                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">
                                    导入完成
                                </h3>
                                <p className="text-muted-foreground">
                                    成功 {importResult.successCount} 条，
                                    失败 {importResult.errorCount} 条
                                </p>
                            </div>
                        </div>

                        {/* 错误详情 */}
                        {importResult.errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>导入错误详情</AlertTitle>
                                <AlertDescription>
                                    <ScrollArea className="h-48 mt-2">
                                        <div className="space-y-1">
                                            {importResult.errors.map((err, idx) => (
                                                <div key={idx} className="text-sm py-1 border-b border-destructive/20 last:border-0">
                                                    <span className="font-medium">第 {err.row} 行</span>
                                                    {err.sku && <span className="text-muted-foreground ml-2">(SKU: {err.sku})</span>}
                                                    <span className="ml-2">{err.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex justify-end gap-2 pt-2">
                            {importResult.errorCount > 0 && (
                                <Button variant="outline" onClick={handleReset}>
                                    重新导入
                                </Button>
                            )}
                            <Button onClick={() => setOpen(false)}>
                                关闭
                            </Button>
                        </div>
                    </div>
                ) : (
                    <ExcelImporter<ProductImportItem>
                        schema={productImportConfig.schema}
                        columnMapping={productImportConfig.columnMapping}
                        templateUrl={productImportConfig.templateUrl}
                        title={productImportConfig.title}
                        description={productImportConfig.description}
                        onImport={handleImport}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
