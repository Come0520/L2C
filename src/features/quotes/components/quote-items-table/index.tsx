'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { RoomSelectorWithConfig } from '../room-selector-popover';
import {
  createQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  updateRoom,
  deleteRoom,
} from '@/features/quotes/actions/mutations';
import { logger } from '@/shared/lib/logger';
import { useTableState } from './use-table-state';
import { useClientCalc } from './use-client-calc';
import { CategoryView, RoomView } from './views';
import type { RoomData, ViewMode, WarningDialogState } from './types';
import type { QuoteItem } from './types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

const QuoteItemAdvancedDrawer = dynamic(
  () => import('../quote-item-advanced-drawer').then((mod) => mod.QuoteItemAdvancedDrawer),
  { ssr: false }
);

const buildTree = (items: QuoteItem[]): QuoteItem[] => {
  const itemMap = new Map<string, QuoteItem>();
  items.forEach((item) => itemMap.set(item.id, { ...item, children: [] }));

  const rootItems: QuoteItem[] = [];
  itemMap.forEach((item) => {
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }
    } else {
      rootItems.push(item);
    }
  });

  // 稳定排序：先按 sortOrder，相同时按 createdAt 兜底，保证行顺序不跳动
  const stableSort = (a: QuoteItem, b: QuoteItem) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  };

  rootItems.sort(stableSort);
  itemMap.forEach((item) => {
    if (item.children && item.children.length > 1) {
      item.children.sort(stableSort);
    }
  });

  return rootItems;
};

interface QuoteItemsTableProps {
  quoteId: string;
  rooms: RoomData[];
  items: QuoteItem[];
  onItemUpdate?: () => void;
  onAddRoom?: (name: string) => void;
  mode?: 'simple' | 'advanced';
  visibleFields?: string[];
  readOnly?: boolean;
  dimensionLimits?: {
    heightWarning: number;
    heightMax: number;
    widthWarning: number;
    widthMax: number;
    enabled: boolean;
  };
  allowedCategories?: string[];
  viewMode?: ViewMode;
  activeCategory?: string;
  onRowClick?: (item: QuoteItem) => void;
}

export const QuoteItemsTable = React.memo(function QuoteItemsTable({
  quoteId,
  rooms,
  items,
  onItemUpdate,
  onAddRoom,
  mode = 'simple',
  visibleFields,
  readOnly = false,
  allowedCategories,
  viewMode = 'room',
  onRowClick,
}: QuoteItemsTableProps) {
  const isFieldVisible = (field: string) => {
    if (visibleFields && visibleFields.length > 0) {
      return visibleFields.includes(field);
    }
    return mode !== 'simple';
  };

  const showImage = true; // 强制显示商品图片列，满足用户在商品和尺寸之间添加图片的要求
  const showWidth = isFieldVisible('width');
  const showHeight = isFieldVisible('height');
  const showFold = isFieldVisible('foldRatio');
  const showProcessFee = isFieldVisible('processFee');
  const showQuantity = isFieldVisible('quantity');
  const showUnit = true;
  const showUnitPrice = isFieldVisible('unitPrice');
  const showAmount = isFieldVisible('amount') || isFieldVisible('subtotal');
  const showRemark = isFieldVisible('remarks') || isFieldVisible('remark');

  const {
    advancedDrawerOpen,
    editingItem,
    warningDialog,
    expandedRoomIds,
    expandedItemIds,
    setAdvancedDrawerOpen,
    setWarningDialog,
    handleToggleItem,
    handleToggleRoom,
    initializeExpandedRooms,
  } = useTableState(rooms);

  const { calculate } = useClientCalc();

  const prevRoomIdsRef = useRef<Set<string>>(new Set(rooms.map((r) => r.id)));

  useEffect(() => {
    const currentRoomIds = new Set(rooms.map((r) => r.id));
    const prevRoomIds = prevRoomIdsRef.current;

    let newRoomId: string | null = null;
    for (const roomId of currentRoomIds) {
      if (!prevRoomIds.has(roomId)) {
        newRoomId = roomId;
        break;
      }
    }

    prevRoomIdsRef.current = currentRoomIds;

    if (newRoomId) {
      const roomToExpand = newRoomId;
      requestAnimationFrame(() => {
        initializeExpandedRooms([roomToExpand]);
      });
    }
  }, [rooms, initializeExpandedRooms]);

  const tree = useMemo(() => buildTree(items), [items]);

  const itemsByRoom = useMemo(() => {
    const mapping: Record<string, QuoteItem[]> = {};
    const unassigned: QuoteItem[] = [];
    tree.forEach((root) => {
      if (root.roomId) {
        if (!mapping[root.roomId]) mapping[root.roomId] = [];
        mapping[root.roomId].push(root);
      } else {
        unassigned.push(root);
      }
    });
    return { mapping, unassigned };
  }, [tree]);

  const getRoomSubtotal = React.useCallback(
    (roomId: string) => {
      const roomItems = items.filter((item) => item.roomId === roomId);
      return roomItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    },
    [items]
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (readOnly) return;
      if (confirm('确定删除此项吗？')) {
        try {
          const result = await deleteQuoteItem({ id });
          if (result?.success) {
            toast.success('已删除');
            onItemUpdate?.();
          } else {
            toast.error(result?.error || '删除失败');
          }
        } catch (_error) {
          toast.error('删除发生异常');
        }
      }
    },
    [readOnly, onItemUpdate]
  );

  const handleUpdate = React.useCallback(
    async (id: string, data: Record<string, unknown>) => {
      if (readOnly) return;
      try {
        const result = await updateQuoteItem({ id, ...data });
        if (result?.success) {
          toast.success('已更新');
          onItemUpdate?.();
        } else {
          toast.error(result?.error || '更新失败');
        }
      } catch (_error) {
        console.error('Failed to update item', _error);
        toast.error('更新发生异常');
      }
    },
    [readOnly, onItemUpdate]
  );

  const handleRoomRename = React.useCallback(
    async (id: string, name: string) => {
      if (readOnly) return;
      try {
        const result = await updateRoom({ id, name });
        if (result?.success) {
          toast.success('空间已重命名');
          onItemUpdate?.();
        } else {
          toast.error(result?.error || '重命名失败');
        }
      } catch (_error) {
        toast.error('重命名发生异常');
      }
    },
    [readOnly, onItemUpdate]
  );

  const handleDeleteRoom = React.useCallback(
    async (id: string) => {
      if (readOnly) return;
      if (confirm('确定删除此空间及其所有明细吗？此操作不可恢复。')) {
        try {
          const result = await deleteRoom({ id });
          if (result?.success) {
            toast.success('空间及其明细已删除');
            onItemUpdate?.();
          } else {
            toast.error(result?.error || '删除空间失败');
          }
        } catch (_error) {
          toast.error('删除空间发生异常');
        }
      }
    },
    [readOnly, onItemUpdate]
  );

  const _handleAddAccessory = React.useCallback(
    async (parentId: string, roomId: string | null) => {
      if (readOnly) return;

      try {
        const res = (await createQuoteItem({
          quoteId,
          roomId: roomId || undefined,
          parentId,
          category: 'CURTAIN_ACCESSORY',
          productName: '(点击选择附件)',
          unit: '个',
          unitPrice: 0,
          quantity: 1,
          width: 0,
          height: 0,
        })) as any;

        if (res?.data?.id || res?.data?.success || res?.success || res?.id) {
          toast.success('已添加附件行');
          await onItemUpdate?.();
        } else {
          toast.error(res?.data?.error || res?.error || res?.serverError || '添加附件失败');
        }
      } catch (_error) {
        logger.error('添加附件异常', _error);
        toast.error('添加异常');
      }
    },
    [readOnly, quoteId, onItemUpdate]
  );

  const handleProductSelect = React.useCallback(
    async (id: string, product: ProductSearchResult) => {
      if (readOnly) return;

      const parsedPrice = product.unitPrice ? parseFloat(String(product.unitPrice)) : 0;

      if (parsedPrice <= 0) {
        toast.warning('该商品未设置价格，请手动输入单价');
      }

      await handleUpdate(id, {
        productId: product.id,
        productName: product.name,
        unitPrice: parsedPrice > 0 ? parsedPrice : undefined,
        attributes: {
          ...product.specs,
          productImage: product.images?.[0],
        },
      });
    },
    [readOnly, handleUpdate]
  );

  const handleClientCalc = React.useCallback(
    (item: QuoteItem, field: string, value: number) => {
      return calculate(item, field, value);
    },
    [calculate]
  );

  const columnVisibility = {
    showImage,
    showWidth,
    showHeight,
    showFold,
    showProcessFee,
    showQuantity,
    showUnit,
    showUnitPrice,
    showAmount,
    showRemark,
  };

  return (
    <div className="space-y-8">
      {rooms.length === 0 && itemsByRoom.unassigned.length === 0 && (
        <div className="glass-empty-state text-muted-foreground py-12 text-center">
          <p className="text-sm">暂无报价文件明细</p>
          <p className="mt-1 text-xs opacity-60">请先添加空间或从产品库导入主材</p>
          {!readOnly && onAddRoom && (
            <div className="mt-4">
              <RoomSelectorWithConfig onSelect={onAddRoom} align="center" />
            </div>
          )}
        </div>
      )}

      {viewMode === 'category' && (
        <CategoryView
          quoteId={quoteId}
          rooms={rooms}
          items={tree}
          allowedCategories={allowedCategories}
          readOnly={readOnly}
          {...columnVisibility}
          expandedItemIds={expandedItemIds}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAddAccessory={_handleAddAccessory}
          handleToggleItem={handleToggleItem}
          handleToggleRoom={handleToggleRoom}
          expandedRoomIds={expandedRoomIds}
          onAddRoom={onAddRoom}
          onRowClick={onRowClick}
        />
      )}

      {viewMode === 'room' && (
        <RoomView
          quoteId={quoteId}
          rooms={rooms}
          items={items}
          itemsByRoom={itemsByRoom}
          readOnly={readOnly}
          {...columnVisibility}
          expandedRoomIds={expandedRoomIds}
          expandedItemIds={expandedItemIds}
          onAddRoom={onAddRoom}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAddAccessory={_handleAddAccessory}
          handleToggleItem={handleToggleItem}
          handleToggleRoom={handleToggleRoom}
          handleRoomRename={handleRoomRename}
          handleDeleteRoom={handleDeleteRoom}
          getRoomSubtotal={getRoomSubtotal}
          allowedCategories={allowedCategories}
          onRowClick={onRowClick}
        />
      )}

      <QuoteItemAdvancedDrawer
        open={advancedDrawerOpen}
        onOpenChange={setAdvancedDrawerOpen}
        item={editingItem}
        onSuccess={onItemUpdate}
      />

      <Dialog
        open={warningDialog.open}
        onOpenChange={(open) => setWarningDialog((prev: WarningDialogState) => ({ ...prev, open }))}
        aria-labelledby="warning-dialog-title"
        aria-describedby="warning-dialog-description"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              id="warning-dialog-title"
              className="text-destructive flex items-center gap-2"
            >
              {warningDialog.title}
            </DialogTitle>
            <DialogDescription
              id="warning-dialog-description"
              className="text-foreground pt-4 text-base font-medium"
            >
              {warningDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 text-muted-foreground mt-2 rounded-md p-3 text-sm">
            💡
            您可以通过修改"高级配置"调整工艺（如：改用贴布带），或确认此尺寸进行生产（可能需要拼接）。
          </div>
          <DialogFooter>
            <Button
              aria-label="关闭警告"
              onClick={() =>
                setWarningDialog((prev: WarningDialogState) => ({ ...prev, open: false }))
              }
            >
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export type { QuoteItem, RoomData, ViewMode, CalcResult, QuoteItemAttributes } from './types';
