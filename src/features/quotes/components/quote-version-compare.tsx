'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function QuoteVersionCompare() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>版本对比 (Version Comparison)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">报价版本对比功能在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Quote version comparison is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
