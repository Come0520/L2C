'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function CreateQuoteBundleForm() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>创建报价单 (Create Quote Bundle)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">创建报价单表单在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Create quote bundle form is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
