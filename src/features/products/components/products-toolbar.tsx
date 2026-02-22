'use client';

import { logger } from "@/shared/lib/logger";

import React from 'react';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { ProductImportDialog } from './product-import-dialog';

interface ProductsToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onAdd: () => void;
    onImportSuccess: () => void;
    loading?: boolean;
    className?: string;
}

export function ProductsToolbar({
    search,
    onSearchChange,
    onRefresh,
    onAdd,
    onImportSuccess,
    loading,
    className
}: ProductsToolbarProps) {
    return (
        <DataTableToolbar
            className={className}
            searchProps={{
                value: search,
                onChange: onSearchChange,
                placeholder: "搜索 SKU 或名称..."
            }}
            onRefresh={onRefresh}
            loading={loading}
        >
            <ProductImportDialog onSuccess={onImportSuccess} />
            <Button onClick={onAdd} className="shadow-md transition-all hover:shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> 新增产品
            </Button>
        </DataTableToolbar>
    );
}
