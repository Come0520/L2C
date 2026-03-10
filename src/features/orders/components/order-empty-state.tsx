import React from 'react';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';

export interface OrderEmptyStateProps {
    title?: string;
    description?: string;
    actionNode?: React.ReactNode;
}

export function OrderEmptyState({
    title = '暂无符合条件的订单记录',
    description = '当前状态下没有找到任何订单。您可以更改筛选条件，或者新建一个订单。',
    actionNode,
}: OrderEmptyStateProps) {
    return (
        <Card className="flex h-[450px] w-full flex-col items-center justify-center border-dashed p-8 text-center bg-white/50 dark:bg-black/20 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center space-y-4 pb-0">
                <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
                    <ShoppingCart className="text-muted-foreground h-10 w-10 opacity-50" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
                </div>
                {actionNode !== undefined ? (
                    actionNode
                ) : (
                    <div className="pt-4">
                        <Button asChild variant="outline">
                            <Link href="/quotes">从报价单转入</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
