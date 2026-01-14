'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function SplitRulesConfig() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Split Rules</CardTitle>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Rule
                </Button>
            </CardHeader>
            <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                    Split rules configuration not available in recovery mode.
                </div>
            </CardContent>
        </Card>
    );
}
