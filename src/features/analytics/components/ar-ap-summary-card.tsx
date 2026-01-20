'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { cn } from '@/shared/lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard } from 'lucide-react';

interface ArApSummaryCardProps {
    pendingReceivables: string | number; // AR: 应收账款
    pendingPayables: string | number;    // AP: 应付账款
    className?: string;
}

/**
 * 财务应收/应付摘要卡片
 * 展示待收款 (AR) 和待付款 (AP) 信息
 */
export function ArApSummaryCard({ pendingReceivables, pendingPayables, className }: ArApSummaryCardProps) {
    const receivables = typeof pendingReceivables === 'string'
        ? parseFloat(pendingReceivables)
        : pendingReceivables;
    const payables = typeof pendingPayables === 'string'
        ? parseFloat(pendingPayables)
        : pendingPayables;

    // Net position: positive means net receivable, negative means net payable
    const netPosition = receivables - payables;

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    财务收支概览
                </CardTitle>
                <CardDescription>应收 / 应付账款实时状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* AR - Receivables */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">应收账款 (AR)</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                        ¥{receivables.toLocaleString()}
                    </span>
                </div>

                {/* AP - Payables */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">应付账款 (AP)</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                        ¥{payables.toLocaleString()}
                    </span>
                </div>

                {/* Net Position */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">净头寸</span>
                        </div>
                        <span className={cn(
                            "text-lg font-bold",
                            netPosition >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {netPosition >= 0 ? '+' : ''}¥{netPosition.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {netPosition >= 0
                            ? '正向头寸，现金流健康'
                            : '负向头寸，注意现金流管理'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
