'use client';

import React from 'react';

export function CategoryView({ quote }: { quote: any }) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Category View</h3>
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Category view not available in recovery mode.
            </div>
        </div>
    );
}
