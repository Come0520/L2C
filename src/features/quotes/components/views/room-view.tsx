'use client';

import React from 'react';

export function RoomView({ items, rooms = [], isEditable = false }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Room View</h3>
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Room view not available in recovery mode.
            </div>
        </div>
    );
}
