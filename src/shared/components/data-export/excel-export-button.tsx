'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/shared/ui/button';
import { exportToExcel, ExportColumn } from '@/shared/lib/export-utils';
import { toast } from 'sonner';

interface ExcelExportButtonProps<T> extends Omit<ButtonProps, 'onClick'> {
    /**
     * 要导出的数据，或者获取数据的异步函数
     */
    data: T[] | (() => Promise<T[]>);
    /**
     * 列配置
     */
    columns: ExportColumn<T>[];
    /**
     * 导出的文件名（不含扩展名）
     */
    filename?: string;
    /**
     * 工作表名称
     */
    sheetName?: string;
}

/**
 * 通用 Excel 导出按钮
 */
export function ExcelExportButton<T extends Record<string, unknown>>({
    data,
    columns,
    filename = 'export-data',
    children,
    variant = 'outline',
    size = 'sm',
    ...props
}: ExcelExportButtonProps<T>) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            let exportData: T[];
            if (typeof data === 'function') {
                exportData = await data();
            } else {
                exportData = data;
            }

            if (!exportData || exportData.length === 0) {
                toast.error('没有可导出的数据');
                return;
            }

            exportToExcel(exportData, columns, filename);
            toast.success('导出成功');
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('导出失败，请稍后重试');
        } finally {
            setExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExport}
            disabled={exporting || props.disabled}
            {...props}
        >
            {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            {children || '导出 Excel'}
        </Button>
    );
}
