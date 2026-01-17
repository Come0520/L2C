'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export function QuoteVersionTabs() {
    return (
        <Tabs defaultValue="v1">
            <TabsList>
                <TabsTrigger value="v1">版本 1 (V1)</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
