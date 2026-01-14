'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface QuoteBundleEditorProps {
    bundleId?: string;
    initialData?: any;
}

export function QuoteBundleEditor({ bundleId }: QuoteBundleEditorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>报价单编辑器 (Quote Bundle Editor)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">报价单编辑器在恢复模式下暂不可用。正在编辑 ID: {bundleId || '新报价'}</p>
                <p className="text-sm text-muted-foreground">(Quote Bundle Editor is not available in recovery mode. Editing ID: {bundleId || 'New Quote'})</p>
            </CardContent>
        </Card>
    );
}
