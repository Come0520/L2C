'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function CurtainFabricQuoteForm() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>窗帘面料报价 (Curtain Fabric Quote)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">窗帘面料报价表单在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Curtain fabric quote form is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
