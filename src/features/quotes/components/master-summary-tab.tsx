'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function MasterSummaryTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>汇总信息 (Summary Information)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">报价汇总视图在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Summary view is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
