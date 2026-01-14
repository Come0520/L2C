'use client';

import React from 'react';
import { ExcelImportDialog } from '@/shared/components/excel-import';
import { productImportConfig, type ProductImportItem } from '../import-config';

/**
 * 商品批量导入弹窗
 * 使用通用 Excel 导入组件 + 商品业务配置
 */
export function ProductImportDialog({
    children,
}: {
    children?: React.ReactNode;
}) {
    return (
        <ExcelImportDialog<ProductImportItem> config={productImportConfig}>
            {children}
        </ExcelImportDialog>
    );
}
