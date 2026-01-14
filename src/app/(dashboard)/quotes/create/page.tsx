'use client';

import React from 'react';

export default function CreateQuotePage() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">创建报价 (Create Quote)</h1>
            </div>
            <div className="flex-1 p-6">
                <div className="rounded-md border p-4 text-center text-muted-foreground">
                    创建报价向导在此模式下不可用。
                </div>
            </div>
        </div>
    );
}
