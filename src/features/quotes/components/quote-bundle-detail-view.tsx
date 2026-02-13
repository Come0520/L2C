'use client';

import React from 'react';

interface QuoteBundleDetailViewProps {
    bundle: any;
    plans: any;
}

export function QuoteBundleDetailView({ bundle, plans }: QuoteBundleDetailViewProps) {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">报价单详情 (Bundle Detail)</h2>
            <p className="text-muted-foreground">详情视图在恢复模式下暂不可用。</p>
        </div>
    );
}
