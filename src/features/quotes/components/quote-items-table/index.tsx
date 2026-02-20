'use client';

import { useMemo, useEffect, useRef } from 'react';
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
import type { QuoteItem, RoomData, ViewMode, WarningDialogState } from './types';
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

export function QuoteItemsTable({
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

  const showImage = isFieldVisible('imageUrl');
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
    handleAdvancedEdit,
    setAdvancedDrawerOpen,
    setWarningDialog,
    handleToggleRoom,
    handleToggleItem,
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

  const getRoomSubtotal = (roomId: string) => {
    const roomItems = items.filter((item) => item.roomId === roomId);
    return roomItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (confirm('确定删除此项吗？')) {
      await deleteQuoteItem({ id });
      toast.success('已删除');
      onItemUpdate?.();
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    if (readOnly) return;
    try {
      await updateQuoteItem({ id, ...data });
      toast.success('已更新');
      onItemUpdate?.();
    } catch (_error) {
      logger.error('Failed to update item', _error);
      toast.error('更新失败');
    }
  };

  const handleRoomRename = async (id: string, name: string) => {
    if (readOnly) return;
    try {
      await updateRoom({ id, name });
      toast.success('空间已重命名');
      onItemUpdate?.();
    } catch (_error) {
      toast.error('重命名失败');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (readOnly) return;
    if (confirm('确定删除此空间及其所有明细吗？此操作不可恢复。')) {
      await deleteRoom({ id });
      toast.success('空间及其明细已删除');
      onItemUpdate?.();
    }
  };

  const handleAddAccessory = async (parentId: string, roomId: string | null) => {
    if (readOnly) return;

    try {
      await createQuoteItem({
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
      });
      toast.success('已添加附件行');
      await onItemUpdate?.();
    } catch (_error) {
      logger.error('添加附件失败', _error);
      toast.error('添加失败');
    }
  };

  const handleProductSelect = async (id: string, product: ProductSearchResult) => {
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
  };

  const handleClientCalc = (item: QuoteItem, field: string, value: number) => {
    return calculate(item, field, value);
  };

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
          items={items}
          readOnly={readOnly}
          {...columnVisibility}
          expandedItemIds={expandedItemIds}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleAddAccessory={handleAddAccessory}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAdvancedEdit={handleAdvancedEdit}
          handleToggleItem={handleToggleItem}
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
          handleAddAccessory={handleAddAccessory}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAdvancedEdit={handleAdvancedEdit}
          handleToggleRoom={handleToggleRoom}
          handleToggleItem={handleToggleItem}
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
        // @ts-expect-error - Expected structural mismatch
        item={editingItem}
        onSuccess={onItemUpdate}
      />

      <Dialog
        open={warningDialog.open}
        onOpenChange={(open) => setWarningDialog((prev: WarningDialogState) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              {warningDialog.title}
            </DialogTitle>
            <DialogDescription className="text-foreground pt-4 text-base font-medium">
              {warningDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 text-muted-foreground mt-2 rounded-md p-3 text-sm">
            💡
            您可以通过修改"高级配置"调整工艺（如：改用贴布带），或确认此尺寸进行生产（可能需要拼接）。
          </div>
          <DialogFooter>
            <Button onClick={() => setWarningDialog((prev: WarningDialogState) => ({ ...prev, open: false }))}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { QuoteItem, RoomData, ViewMode, CalcResult, QuoteItemAttributes } from './types';
