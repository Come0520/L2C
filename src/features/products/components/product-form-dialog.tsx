'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ProductForm } from './product-form';
import { Product } from '..';

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Product;
    onSuccess?: () => void;
}

export function ProductFormDialog({
    open,
    onOpenChange,
    initialData,
    onSuccess,
}: ProductFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = () => {
        setIsLoading(false);
        onOpenChange(false);
        onSuccess?.();
    };

    const handleCancel = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? '编辑商品' : '新建商品'}
                    </DialogTitle>
                </DialogHeader>
                <ProductForm
                    initialData={initialData}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </DialogContent>
        </Dialog>
    );
}
