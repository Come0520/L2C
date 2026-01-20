'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { GlassIcons, type GlassIconItem } from '@/shared/ui/glass-icons';
import { ShoppingCart, Wrench, DollarSign } from 'lucide-react';
import { Layers } from 'lucide-react';

export interface RelatedDocumentsProps {
    orderId: string;
    purchaseOrderCount?: number;
    installTaskCount?: number;
    receiptBillCount?: number;
    className?: string;
}

/**
 * 订单关联单据组件
 * 使用玻璃质感文件夹卡片展示
 */
export function RelatedDocuments({
    orderId,
    purchaseOrderCount = 0,
    installTaskCount = 0,
    receiptBillCount = 0,
    className,
}: RelatedDocumentsProps) {
    const items: GlassIconItem[] = [
        {
            icon: <ShoppingCart />,
            color: 'blue',
            label: '采购单',
            href: `/supply-chain/purchase?orderId=${orderId}`,
            badge: purchaseOrderCount,
        },
        {
            icon: <Wrench />,
            color: 'green',
            label: '安装单',
            href: `/service/installation?orderId=${orderId}`,
            badge: installTaskCount,
        },
        {
            icon: <DollarSign />,
            color: 'purple',
            label: '收款单',
            href: `/finance/ar?orderId=${orderId}`,
            badge: receiptBillCount,
        },
    ];

    return (
        <Card className={`glass-liquid border-white/10 ${className || ''}`}>
            <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    关联单据
                </CardTitle>
            </CardHeader>
            <CardContent>
                <GlassIcons items={items} className="py-4" />
            </CardContent>
        </Card>
    );
}

export default RelatedDocuments;
