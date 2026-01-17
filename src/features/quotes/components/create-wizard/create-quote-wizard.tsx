'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function CreateQuoteWizard() {
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>报价向导 (Create Quote Wizard)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">报价向导在恢复模式下暂不可用。</p>
                <p className="text-sm text-muted-foreground">(Quote Wizard is not available in recovery mode.)</p>
            </CardContent>
        </Card>
    );
}
