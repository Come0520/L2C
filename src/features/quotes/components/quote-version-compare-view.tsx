'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function QuoteVersionCompareView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>版本对比视图 (Version Compare View)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">报价版本对比视图在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Quote version compare view is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
