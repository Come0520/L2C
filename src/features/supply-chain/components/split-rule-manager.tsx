'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

export function SplitRuleManager() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Split Rule Configuration</CardTitle>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                </Button>
            </CardHeader>
            <CardContent>
                <div className="py-4 text-center text-muted-foreground">
                    Split rules configuration not available in recovery mode.
                </div>
            </CardContent>
        </Card>
    );
}
