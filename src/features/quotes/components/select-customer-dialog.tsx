'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { CustomerCombobox } from '@/features/customers/components/customer-combobox';

/**
 * 客户选择弹窗 Props 接口
 */
interface SelectCustomerDialogProps {
    /** 控制弹窗是否显示 */
    open: boolean;
    /** 弹窗显示状态变化回调 */
    onOpenChange: (open: boolean) => void;
    /** 确认选择客户后的回调，传入客户 ID */
    onConfirm: (customerId: string) => void;
    /** 当前用户 ID */
    userId: string;
    /** 当前租户 ID */
    tenantId: string;
}

/**
 * 客户选择弹窗组件
 *
 * 用于在新建报价单时选择客户，支持：
 * 1. 搜索并选择已有客户
 * 2. 新建客户并自动选中
 */
export function SelectCustomerDialog({
    open,
    onOpenChange,
    onConfirm,
    userId,
    tenantId,
}: SelectCustomerDialogProps) {
    // 当前选中的客户 ID
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

    /**
     * 处理客户选择变化
     */
    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomerId(customerId);
    };

    /**
     * 处理确认按钮点击
     */
    const handleConfirm = () => {
        if (selectedCustomerId) {
            onConfirm(selectedCustomerId);
            // 重置状态
            setSelectedCustomerId('');
        }
    };

    /**
     * 处理取消/关闭
     */
    const handleClose = () => {
        setSelectedCustomerId('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>选择客户</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        请选择一个已有客户或新建客户，然后点击确认创建报价单。
                    </p>
                    <CustomerCombobox
                        value={selectedCustomerId}
                        onChange={handleCustomerChange}
                        tenantId={tenantId}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedCustomerId}>
                        确认
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
