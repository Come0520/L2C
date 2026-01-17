'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface QuoteBundleEditorProps {
    bundleId?: string;
    initialCustomerId?: string;
    initialLeadId?: string;
    initialData?: any;
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
                {/* TODO: Implement full editor */}
            </CardContent>
        </Card>
    );
}
