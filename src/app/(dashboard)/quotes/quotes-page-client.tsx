'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function QuotesPageClient() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">报价列表 (Quotes)</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新建报价 (New Quote)
                </Button>
            </div>
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                报价列表组件在恢复模式下暂不可用。
            </div>
        </div>
    );
}
