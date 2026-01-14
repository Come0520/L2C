'use client';

import React from 'react';

export default function SupplyChainSettingsPage() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">供应链配置 (Supply Chain Settings)</h1>
            </div>
            <div className="flex-1 p-6">
                <div className="rounded-md border p-4 text-center text-muted-foreground">
                    供应链配置页面在恢复模式下暂不可用。
                </div>
            </div>
        </div>
    );
}
