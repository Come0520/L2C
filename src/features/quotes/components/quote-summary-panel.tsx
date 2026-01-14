'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function QuoteSummaryPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>报价摘要 (Quote Summary)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">摘要面板在恢复模式下暂不可用。</p>
            </CardContent>
        </Card>
    );
}
