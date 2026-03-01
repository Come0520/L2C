'use client';

import React from 'react';
import type { RoomViewProps } from '../../types';

export function RoomView({ items, rooms = [], isEditable = false }: RoomViewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Room View</h3>
      <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center">
        Room view not available in recovery mode.
      </div>
    </div>
  );
}
