'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/button';

export default function PurchaseOrdersPage() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">采购订单 (Purchase Orders)</h1>
                <Button>创建采购单 (Create PO)</Button>
            </div>
            <div className="flex-1 p-6">
                <div className="rounded-md border p-4 text-center text-muted-foreground">
                    采购订单页面在恢复模式下暂不可用。
                </div>
            </div>
        </div>
    );
}
