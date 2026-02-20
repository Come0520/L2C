'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ProductForm, ProductFormValues } from './product-form';
import { Product } from '../types';
import { createProduct, updateProduct } from '../actions';
import { toast } from 'sonner';

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

    const handleSubmit = async (values: ProductFormValues) => {
        setIsLoading(true);
        try {
            if (initialData?.id) {
                const result = await updateProduct({ ...values, id: initialData.id });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success('更新成功');
            } else {
                const result = await createProduct(values);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success('创建成功');
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error('操作失败');
        } finally {
            setIsLoading(false);
        }
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
                    initialData={initialData as unknown as ProductFormValues}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
