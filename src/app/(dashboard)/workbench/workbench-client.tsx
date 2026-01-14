'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../shared/ui/card';

export default function WorkbenchClient() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>WorkBench</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Workbench is currently under maintenance.</p>
                </CardContent>
            </Card>
        </div>
    );
}
