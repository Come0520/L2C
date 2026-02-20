'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface QuoteBundleEditorProps {
    bundleId?: string;
    initialCustomerId?: string;
    initialLeadId?: string;
    initialData?: Record<string, unknown>;
}

export function QuoteBundleEditor({ bundleId, initialCustomerId, initialLeadId }: QuoteBundleEditorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>报价单编辑器</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    编辑器加载中... (Bundle ID: {bundleId || 'New'}, Customer: {initialCustomerId}, Lead: {initialLeadId})
                </p>
                {/* 占位组件：报价单编辑器的完整实现在后续版本中提供 */}
            </CardContent>
        </Card>
    );
}
