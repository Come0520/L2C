'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { ProductForm } from './product-form';
import { createProduct, updateProduct } from '../actions/mutations';
import { toast } from 'sonner';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

export function ProductDialog({ open, onOpenChange, initialData, onSuccess }: ProductDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        setIsLoading(true);
        try {
            if (initialData?.id) {
                const result = await updateProduct({ ...values, id: initialData.id });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success('产品更新成功');
            } else {
                const result = await createProduct(values);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success('产品创建成功');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error('操作失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? '编辑产品' : '添加产品'}</DialogTitle>
                </DialogHeader>
                <ProductForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
