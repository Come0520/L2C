'use client';

import { useState, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { SupplierForm, SupplierFormValues } from './supplier-form';
import { createSupplier, updateSupplier } from '../actions/supplier-actions';
import { toast } from 'sonner';

interface SupplierDialogProps {
    trigger?: React.ReactNode;
    initialData?: SupplierFormValues;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function SupplierDialog({
    trigger,
    initialData,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    onSuccess
}: SupplierDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Determine if controlled or uncontrolled
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

    const handleSubmit = (values: SupplierFormValues) => {
        startTransition(async () => {
            try {
                if (initialData?.id) {
                    const res = await updateSupplier({ ...values, id: initialData.id });
                    if (res?.error) throw new Error(res.error);
                    toast.success('供应商更新成功');
                } else {
                    const res = await createSupplier(values);
                    if (res?.error) throw new Error(res.error);
                    toast.success('供应商创建成功');
                }
                setOpen(false);
                onSuccess?.();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '未知系统错误';
                toast.error('操作失败', { description: message });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? '编辑供应商' : '新增供应商'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? '修改供应商信息。' : '填写新的供应商信息。'}
                    </DialogDescription>
                </DialogHeader>
                <SupplierForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isLoading={isPending}
                />
            </DialogContent>
        </Dialog>
    );
}
