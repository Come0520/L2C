'use client';

import { useState, useCallback } from 'react';
import type { QuoteItem, WarningDialogState } from './types';

interface UseTableStateReturn {
  advancedDrawerOpen: boolean;
  editingItem: QuoteItem | null;
  warningDialog: WarningDialogState;
  expandedRoomIds: Set<string>;
  expandedItemIds: Set<string>;
  handleAdvancedEdit: (item: QuoteItem) => void;
  setAdvancedDrawerOpen: (open: boolean) => void;
  setWarningDialog: (state: WarningDialogState) => void;
  handleToggleRoom: (roomId: string) => void;
  handleToggleItem: (itemId: string) => void;
  initializeExpandedRooms: (roomIds: string[]) => void;
}

export function useTableState(rooms: { id: string }[]): UseTableStateReturn {
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [warningDialog, setWarningDialog] = useState<WarningDialogState>({
    open: false,
    title: '',
    message: '',
  });
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(() => {
    return rooms.length > 0 ? new Set([rooms[0].id]) : new Set();
  });
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const handleAdvancedEdit = useCallback((item: QuoteItem) => {
    setEditingItem(item);
    setAdvancedDrawerOpen(true);
  }, []);

  const handleToggleRoom = useCallback((roomId: string) => {
    setExpandedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.clear();
        next.add(roomId);
      }
      return next;
    });
  }, []);

  const handleToggleItem = useCallback((itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const initializeExpandedRooms = useCallback((roomIds: string[]) => {
    if (roomIds.length > 0) {
      setExpandedRoomIds(new Set([roomIds[0]]));
    }
  }, []);

  return {
    advancedDrawerOpen,
    editingItem,
    warningDialog,
    expandedRoomIds,
    expandedItemIds,
    handleAdvancedEdit,
    setAdvancedDrawerOpen,
    setWarningDialog,
    handleToggleRoom,
    handleToggleItem,
    initializeExpandedRooms,
  };
}
