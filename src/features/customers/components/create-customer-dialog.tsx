'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { CustomerForm } from './customer-form';
import { useState } from 'react';

interface CreateCustomerDialogProps {
    trigger: React.ReactNode;
    tenantId: string;
    /** 可选：创建成功后的回调，传入新建客户的 ID */
    onSuccess?: (customer?: { id: string }) => void;
}

/**
 * 新建客户弹窗组件
 *
 * 用于快速创建新客户，可选择在创建成功后执行回调
 */
export function CreateCustomerDialog({ trigger, tenantId, onSuccess }: CreateCustomerDialogProps) {
    const [open, setOpen] = useState(false);

    /**
     * 处理创建成功
     */
    const handleSuccess = (customer?: { id: string }) => {
        setOpen(false);
        onSuccess?.(customer);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>新建客户</DialogTitle>
                </DialogHeader>
                <CustomerForm
                    tenantId={tenantId}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}
