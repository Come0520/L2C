import { useMemo, memo, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  createQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  updateRoom,
  deleteRoom,
} from '@/features/quotes/actions/mutations';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import Info from 'lucide-react/dist/esm/icons/info';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { ProductAutocomplete } from './product-autocomplete';
import { QuoteRoomAccordion } from './quote-room-accordion';
import { RoomSelectorWithConfig } from './room-selector-popover';
import { QuoteInlineAddRow } from './quote-inline-add-row';
import { QuoteItemExpandRow } from './quote-item-expand-row';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';
import { CurtainStrategy, type CurtainCalcParams } from '../calc-strategies/curtain-strategy';

import {
  WallpaperCalculator,
  type CurtainFormula,
  type WallpaperFormula,
} from '@/features/quotes/logic/calculator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import dynamic from 'next/dynamic';

const QuoteItemAdvancedDrawer = dynamic(
  () => import('./quote-item-advanced-drawer').then((mod) => mod.QuoteItemAdvancedDrawer),
  { ssr: false }
);

/** 计算结果详情接口 */
interface CalcResult {
  finishedWidth?: number;
  finishedHeight?: number;
  cutWidth?: number;
  cutHeight?: number;
  stripCount?: number;
  fabricWidthCm?: number;
  quantity?: number;
  warning?: string;
}

/** 商品属性接口 */
interface QuoteItemAttributes {
  calcResult?: CalcResult;
  _warnings?: string;
  productImage?: string;
  fabricWidth?: number;
  rollLength?: number;
  patternRepeat?: number;
  formula?: CurtainFormula | 'WALLPAPER' | 'WALLCLOTH';
  sideLoss?: number;
  bottomLoss?: number;
  headerLoss?: number;
  [key: string]: unknown;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  roomId: string | null;
  parentId: string | null;
  category: string;
  productId?: string;
  productName: string;
  unitPrice: string | number;
  quantity: string | number;
  width: string | number;
  height: string | number;
  foldRatio?: string | number;
  processFee?: string | number;
  subtotal: string | number;
  remark?: string;
  unit?: string;
  attributes?: QuoteItemAttributes;
  children?: QuoteItem[];
}

interface QuoteItemRowProps {
  item: QuoteItem;
  level: number;
  readOnly: boolean;
  showImage: boolean;
  showWidth: boolean;
  showHeight: boolean;
  showFold: boolean;
  showProcessFee: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showAmount: boolean;
  showRemark: boolean;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: (
    item: QuoteItem,
    field: string,
    value: number
  ) => { quantity: number; calcResult?: CalcResult } | number | null;
  handleAdvancedEdit: (item: QuoteItem) => void;
  renderChildren: (nodes: QuoteItem[], level: number) => React.ReactNode;
  /** 行展开状态 */
  isExpanded: boolean;
  /** 切换展开状态 */
  onToggleExpand: () => void;
  /** 表格列数（用于 colSpan） */
  colSpan: number;
}

const QuoteItemRow = memo(
  ({
    item,
    level,
    readOnly,
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
    handleUpdate,
    handleDelete,
    handleAddAccessory,
    handleProductSelect,
    handleClientCalc,
    handleAdvancedEdit,
    renderChildren,
    isExpanded,
    onToggleExpand,
    colSpan,
  }: QuoteItemRowProps) => {
    const warning = item.attributes?.calcResult?.warning || item.attributes?._warnings;
    const calcDetails = item.attributes?.calcResult;
    const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(item.category);
    const isAccessory = item.category === 'CURTAIN_ACCESSORY';

    // Calculate colSpan for the middle section (Width/Height + Fold + ProcessFee) items
    // This is used to merge cells for Accessories to show a large Remark input
    const middleSectionColSpan =
      (showWidth || showHeight ? 1 : 0) + (showFold ? 1 : 0) + (showProcessFee ? 1 : 0);

    return (
      <>
        <TableRow
          key={item.id}
          className={cn(
            'glass-row-hover transition-all duration-200',
            level > 0 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
          )}
        >
          <TableCell className="p-2 font-medium">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {level > 0 && (
                <div className="relative mr-2 flex h-full items-center">
                  <div className="border-muted-foreground/30 absolute -top-3 left-0 h-4 w-4 rounded-bl-md border-b border-l"></div>
                  <CornerDownRight className="text-muted-foreground/50 h-4 w-4" />
                </div>
              )}
              {readOnly ? (
                <span className="block max-w-[200px] truncate">{item.productName}</span>
              ) : (
                <div className="w-48">
                  <ProductAutocomplete
                    value={item.productName}
                    onSelect={(p) => handleProductSelect(item.id, p)}
                    // 如果是附件行，锁定搜索范围为窗帘辅料；否则按原逻辑（自动或全部）
                    // 根据 constants.ts，辅料的 Category 是 CURTAIN_ACCESSORY
                    allowedCategories={
                      item.category === 'CURTAIN_ACCESSORY' ? ['CURTAIN_ACCESSORY'] : undefined
                    }
                    category={item.category}
                    placeholder={
                      item.category === 'CURTAIN_ACCESSORY' ? '搜索辅料(绑带等)...' : '选择商品...'
                    }
                  />
                </div>
              )}
              {!readOnly &&
                showImage &&
                (item.attributes?.productImage ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="bg-muted group relative ml-2 h-8 w-8 shrink-0 cursor-zoom-in overflow-hidden rounded border">
                        <Image
                          src={String(item.attributes.productImage)}
                          alt="Product"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-64 overflow-hidden border-none p-0 shadow-xl"
                      side="right"
                    >
                      <Image
                        src={String(item.attributes.productImage)}
                        alt="Preview"
                        width={256}
                        height={256}
                        className="h-auto w-full"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 opacity-50"
                    title="No Image"
                  >
                    <span className="text-muted-foreground text-[10px]">图</span>
                  </div>
                ))}
              {warning && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Badge
                      variant="error"
                      className="ml-2 shrink-0 cursor-pointer text-xs hover:opacity-80"
                    >
                      !
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent
                    className="glass-popover text-destructive w-64 p-3 text-sm"
                    side="top"
                  >
                    <div className="mb-1 font-semibold">⚠️ 警报</div>
                    <div className="text-xs opacity-90">{warning}</div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </TableCell>
          {/* 中间区域：对于附件，合并单元格显示备注；对于普通商品，显示尺寸/倍数/工费 */}
          {isAccessory && middleSectionColSpan > 0 ? (
            <TableCell colSpan={middleSectionColSpan} className="p-2">
              <Input
                disabled={readOnly}
                className="h-8 w-full bg-transparent/50 px-2 text-xs"
                defaultValue={item.remark || ''}
                placeholder="附件备注 (如：需要对花、加长)"
                onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
              />
            </TableCell>
          ) : (
            <>
              {(showWidth || showHeight) && (
                <TableCell className="p-2">
                  <div className="flex items-center space-x-1">
                    {showWidth && (
                      <Input
                        disabled={readOnly}
                        type="number"
                        className="h-8 w-16 bg-transparent/50 px-1 text-right"
                        defaultValue={Number(item.width) || ''}
                        placeholder="宽"
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          const res = handleClientCalc(item, 'width', val);
                          if (res && typeof res === 'object') {
                            // Check for warning and trigger dialog
                            if (res.calcResult?.warning) {
                              // setWarningDialog({
                              //     open: true,
                              //     title: '⚠️ 尺寸预警',
                              //     message: res.calcResult.warning
                              // });
                            }

                            handleUpdate(item.id, {
                              width: val,
                              quantity: res.quantity,
                              attributes: { ...item.attributes, calcResult: res.calcResult },
                            });
                          } else if (typeof res === 'number') {
                            handleUpdate(item.id, { width: val, quantity: res });
                          } else {
                            handleUpdate(item.id, { width: val });
                          }
                        }}
                      />
                    )}
                    {showWidth && showHeight && (
                      <span className="text-muted-foreground text-xs">x</span>
                    )}
                    {showHeight && (
                      <Input
                        disabled={readOnly}
                        type="number"
                        className="h-8 w-16 bg-transparent/50 px-1 text-right"
                        defaultValue={Number(item.height) || ''}
                        placeholder="高"
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          const res = handleClientCalc(item, 'height', val);
                          if (res && typeof res === 'object') {
                            if (res.calcResult?.warning) {
                              // setWarningDialog({
                              //     open: true,
                              //     title: '⚠️ 尺寸预警',
                              //     message: res.calcResult.warning
                              // });
                            }
                            handleUpdate(item.id, {
                              height: val,
                              quantity: res.quantity,
                              attributes: { ...item.attributes, calcResult: res.calcResult },
                            });
                          } else if (typeof res === 'number') {
                            handleUpdate(item.id, { height: val, quantity: res });
                          } else {
                            handleUpdate(item.id, { height: val });
                          }
                        }}
                      />
                    )}
                  </div>
                </TableCell>
              )}

              {showFold && (
                <TableCell className="p-2">
                  <Input
                    disabled={readOnly}
                    type="number"
                    className="h-8 w-14 bg-transparent/50 px-1 text-right"
                    defaultValue={Number(item.foldRatio) || ''}
                    placeholder="倍数"
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) return;
                      const res = handleClientCalc(item, 'foldRatio', val);
                      if (res && typeof res === 'object') {
                        handleUpdate(item.id, {
                          foldRatio: val,
                          quantity: res.quantity,
                          attributes: { ...item.attributes, calcResult: res.calcResult },
                        });
                      } else if (typeof res === 'number') {
                        handleUpdate(item.id, { foldRatio: val, quantity: res });
                      } else {
                        handleUpdate(item.id, { foldRatio: val });
                      }
                    }}
                  />
                </TableCell>
              )}
              {showProcessFee && (
                <TableCell className="p-2">
                  <Input
                    disabled={readOnly}
                    type="number"
                    className="h-8 w-16 bg-transparent/50 px-1 text-right"
                    defaultValue={Number(item.processFee) || ''}
                    placeholder="工费"
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) return;
                      handleUpdate(item.id, { processFee: val });
                    }}
                  />
                </TableCell>
              )}
            </>
          )}

          {showQuantity && (
            <TableCell className="p-2">
              <div className="flex items-center gap-1">
                <Input
                  key={item.quantity} // Force re-render when calculated quantity changes
                  disabled={readOnly}
                  type="number"
                  className="text-primary h-8 w-16 bg-transparent/50 px-1 text-right font-medium"
                  defaultValue={Number(item.quantity)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) return;
                    handleUpdate(item.id, { quantity: val });
                  }}
                />
                {calcDetails && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary h-6 w-6 shrink-0"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="glass-popover w-64 overflow-hidden p-0" side="right">
                      <div className="glass-section-header p-3">
                        <h4 className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
                          计算详情
                        </h4>
                      </div>
                      <div className="space-y-2 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">成品展示:</span>
                          <span className="font-mono">
                            {calcDetails.finishedWidth} x {calcDetails.finishedHeight} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">预留净尺寸:</span>
                          <span className="text-primary font-mono">
                            {calcDetails.cutWidth} x {calcDetails.cutHeight} cm
                          </span>
                        </div>
                        {calcDetails.stripCount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">消耗份数:</span>
                            <span className="font-mono">{calcDetails.stripCount}</span>
                          </div>
                        )}
                        {calcDetails.fabricWidthCm !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">参考幅宽:</span>
                            <span className="font-mono">{calcDetails.fabricWidthCm} cm</span>
                          </div>
                        )}
                        {calcDetails.warning && (
                          <div className="text-destructive mt-2 border-t border-dashed pt-2 text-xs">
                            <div className="mb-0.5 font-semibold">⚠️ 异常提醒:</div>
                            <div>{calcDetails.warning}</div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </TableCell>
          )}

          {showUnit && (
            <TableCell className="p-2">
              <Input
                disabled={readOnly}
                className="h-8 w-12 bg-transparent/50 px-1 text-center text-xs"
                defaultValue={item.unit || '-'}
                placeholder="单位"
                onBlur={(e) => handleUpdate(item.id, { unit: e.target.value })}
              />
            </TableCell>
          )}
          {showUnitPrice && (
            <TableCell className="p-2 text-right">
              <Input
                disabled={readOnly}
                type="number"
                className="h-8 w-20 bg-transparent/50 px-1 text-right"
                defaultValue={Number(item.unitPrice)}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isNaN(val)) return;
                  handleUpdate(item.id, { unitPrice: val });
                }}
              />
            </TableCell>
          )}
          {showAmount && (
            <TableCell className="p-2 text-right font-medium">
              <span className="font-mono text-slate-700 dark:text-slate-100">
                ¥{Number(item.subtotal).toFixed(2)}
              </span>
            </TableCell>
          )}

          {showRemark && (
            <TableCell className="p-2">
              {(!isAccessory || middleSectionColSpan === 0) && (
                <Input
                  disabled={readOnly}
                  className="h-8 w-24 bg-transparent/50 px-2 text-xs"
                  defaultValue={item.remark || ''}
                  placeholder="备注"
                  onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
                />
              )}
            </TableCell>
          )}

          <TableCell className="p-2">
            {!readOnly && (
              <div className="flex items-center space-x-1">
                {level === 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleAddAccessory(item.id, item.roomId)}
                    className="hover:bg-primary/10 hover:text-primary h-7 w-7"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {/* 展开/折叠按钮（仅主商品且为窗帘类显示） */}
                {level === 0 && isCurtain && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      'h-7 w-7',
                      isExpanded
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                    onClick={onToggleExpand}
                    title={isExpanded ? '收起高级配置' : '展开高级配置'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary h-7 w-7"
                  onClick={() => handleAdvancedEdit(item)}
                  title="高级配置"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TableCell>
        </TableRow>
        {/* 行内展开区域（高级配置） */}
        {level === 0 && isExpanded && (
          <QuoteItemExpandRow
            itemId={item.id}
            productName={item.productName}
            category={item.category}
            attributes={item.attributes as Record<string, unknown>}
            foldRatio={Number(item.foldRatio) || 2}
            processFee={Number(item.processFee) || 0}
            remark={item.remark}
            attachments={[]} // TODO: 从 children 中提取附件
            readOnly={readOnly}
            isExpanded={isExpanded}
            onToggle={onToggleExpand}
            onSave={() => {
              /* 刷新数据 */
            }}
            colSpan={colSpan}
          />
        )}
        {item.children && item.children.length > 0 && renderChildren(item.children, level + 1)}
      </>
    );
  }
);
QuoteItemRow.displayName = 'QuoteItemRow';

// Helper to build tree
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

/** 房间数据结构 */
interface RoomData {
  id: string;
  name: string;
  [key: string]: unknown;
}

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
  /** 允许添加的商品品类列表（过滤商品选择器） */
  allowedCategories?: string[];
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
}: QuoteItemsTableProps) {
  // 字段可见性判断
  const isFieldVisible = (field: string) => {
    if (visibleFields && visibleFields.length > 0) {
      return visibleFields.includes(field);
    }
    return mode !== 'simple'; // 默认为非简易模式显示所有? 或者根据默认配置
  };

  const _showProductSku = isFieldVisible('productSku');
  const showImage = isFieldVisible('imageUrl');
  const showWidth = isFieldVisible('width');
  const showHeight = isFieldVisible('height');
  const showFold = isFieldVisible('foldRatio');
  const showProcessFee = isFieldVisible('processFee');
  const showUnit = true; // 强制开启单位显示 (或 isFieldVisible('unit') 如果有开关)

  const showQuantity = isFieldVisible('quantity');
  const showUnitPrice = isFieldVisible('unitPrice');
  const showAmount = isFieldVisible('amount') || isFieldVisible('subtotal'); // Handle both keys
  const showRemark = isFieldVisible('remarks') || isFieldVisible('remark');

  // 高级编辑抽屉状态
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);

  // Warning Dialog State
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: '',
    message: '',
  });

  // 空间展开状态（聚焦模式：默认只展开第一个）
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(() => {
    return rooms.length > 0 ? new Set([rooms[0].id]) : new Set();
  });

  // 行展开状态（快速/高级报价切换）
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // 跟踪之前的空间 ID 集合，用于检测新增空间
  const prevRoomIdsRef = useRef<Set<string>>(new Set(rooms.map((r) => r.id)));

  // 自动展开新创建的空间
  useEffect(() => {
    const currentRoomIds = new Set(rooms.map((r) => r.id));
    const prevRoomIds = prevRoomIdsRef.current;

    // 检测新增的空间
    let newRoomId: string | null = null;
    for (const roomId of currentRoomIds) {
      if (!prevRoomIds.has(roomId)) {
        newRoomId = roomId;
        break; // 每次只处理一个新空间
      }
    }

    // 更新 ref
    prevRoomIdsRef.current = currentRoomIds;

    // 使用 requestAnimationFrame 延迟状态更新，避免级联渲染
    if (newRoomId) {
      const roomToExpand = newRoomId;
      requestAnimationFrame(() => {
        setExpandedRoomIds(new Set([roomToExpand]));
      });
    }
  }, [rooms]);

  const handleAdvancedEdit = useCallback((item: QuoteItem) => {
    setEditingItem(item);
    setAdvancedDrawerOpen(true);
  }, []);

  // 计算空间小计（包含所有主商品+附件）
  const getRoomSubtotal = useCallback(
    (roomId: string) => {
      const roomItems = items.filter((item) => item.roomId === roomId);
      return roomItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    },
    [items]
  );

  // 切换空间展开状态（聚焦模式）
  const handleToggleRoom = useCallback((roomId: string) => {
    setExpandedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        // 聚焦模式：展开当前，收起其他
        next.clear();
        next.add(roomId);
      }
      return next;
    });
  }, []);

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

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (confirm('确定删除此项吗？')) {
      await deleteQuoteItem({ id });
      toast.success('已删除');
      if (onItemUpdate) onItemUpdate();
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    if (readOnly) return;
    try {
      await updateQuoteItem({ id, ...data });
      toast.success('已更新');
      if (onItemUpdate) onItemUpdate();
    } catch (_error) {
      console.error('Failed to update item');
      toast.error('更新失败');
    }
  };

  const handleRoomRename = async (id: string, name: string) => {
    if (readOnly) return;
    try {
      await updateRoom({ id, name });
      toast.success('空间已重命名');
      if (onItemUpdate) onItemUpdate();
    } catch (_error) {
      toast.error('重命名失败');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (readOnly) return;
    if (confirm('确定删除此空间及其所有明细吗？此操作不可恢复。')) {
      await deleteRoom({ id });
      toast.success('空间及其明细已删除');
      if (onItemUpdate) onItemUpdate();
    }
  };

  const handleAddAccessory = async (parentId: string, roomId: string | null) => {
    if (readOnly) return;

    try {
      await createQuoteItem({
        quoteId,
        roomId: roomId || undefined,
        parentId,
        // 使用具体的窗帘辅料分类，以便后续搜索过滤
        category: 'CURTAIN_ACCESSORY',
        productName: '(点击选择附件)', // 显式占位符，避免空字符串可能导致的显示问题
        unit: '个',
        unitPrice: 0,
        quantity: 1,
        width: 0,
        height: 0,
      });
      toast.success('已添加附件行');
      // 触发回调以更新父组件数据
      if (onItemUpdate) {
        await onItemUpdate();
      }
    } catch (_error) {
      console.error(_error);
      toast.error('添加失败');
    }
  };

  const handleProductSelect = async (id: string, product: ProductSearchResult) => {
    if (readOnly) return;
    await handleUpdate(id, {
      productId: product.id,
      productName: product.name,
      unitPrice: product.unitPrice ? parseFloat(String(product.unitPrice)) : undefined,
      attributes: {
        ...product.specs,
        productImage: product.images?.[0],
      },
    });
  };

  const handleClientCalc = (
    item: QuoteItem,
    field: string,
    value: number
  ): { quantity: number; calcResult?: CalcResult } | number | null => {
    // ... (保持不变)
    const newItem = { ...item, [field]: value };
    const category = newItem.category;

    // 调试日志
    console.log('[handleClientCalc] 触发计算', {
      field,
      value,
      category,
      width: newItem.width,
      height: newItem.height,
      foldRatio: newItem.foldRatio,
    });

    // 窗帘类品类：支持 CURTAIN, CURTAIN_FABRIC, CURTAIN_SHEER (Case Insensitive)
    const upperCategory = category.toUpperCase();
    const isCurtainCategory =
      ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(upperCategory) ||
      upperCategory.includes('CURTAIN');
    // 墙纸/墙布类品类
    const isWallCategory = ['WALLPAPER', 'WALLCLOTH'].includes(upperCategory);

    if (isCurtainCategory || isWallCategory) {
      const attributes = (newItem.attributes || {}) as Record<string, unknown>;
      const strategy = new CurtainStrategy();

      if (isCurtainCategory) {
        // Default Values matching CurtainFabricQuoteForm
        const params: CurtainCalcParams = {
          measuredWidth: Number(newItem.width) || 0,
          measuredHeight: Number(newItem.height) || 0,
          foldRatio: Number(newItem.foldRatio) || 2,
          fabricWidth: Number(attributes.fabricWidth) || 280,
          // Use correct type for fabricType
          fabricType: (attributes.fabricType as 'FIXED_HEIGHT' | 'FIXED_WIDTH') || 'FIXED_HEIGHT',
          unitPrice: Number(item.unitPrice) || 0,
          // Advanced attributes with fallbacks
          openingType: (attributes.openingType as 'SINGLE' | 'DOUBLE') || 'DOUBLE',
          headerType: (attributes.headerType as 'WRAPPED' | 'ATTACHED') || 'WRAPPED',
          clearance: Number(attributes.clearance) || 0,
          sideLoss: attributes.sideLoss !== undefined ? Number(attributes.sideLoss) : undefined,
          bottomLoss: attributes.bottomLoss !== undefined ? Number(attributes.bottomLoss) : 10,
        };

        const result = strategy.calculate(params);
        console.log('[handleClientCalc] 窗帘计算结果', result);

        // Return full object structure
        return {
          quantity: result.usage,
          calcResult: {
            ...result.details,
            quantity: result.usage,
          },
        };
      } else if (isWallCategory) {
        // Using imported WallpaperCalculator
        const result = WallpaperCalculator.calculate({
          measuredWidth: Number(newItem.width) || 0,
          measuredHeight: Number(newItem.height) || 0,
          productWidth: Number(attributes.fabricWidth) || (category === 'WALLPAPER' ? 53 : 280),
          rollLength: Number(attributes.rollLength) || 1000,
          patternRepeat: Number(attributes.patternRepeat) || 0,
          formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula,
        });
        console.log('[handleClientCalc] 墙纸/墙布计算结果', result);
        if (result && typeof result.quantity === 'number' && !isNaN(result.quantity)) {
          return result.quantity; // Wallpaper logic still returns simple number for now unless refactored
        }
      }
      return null;
    } else {
      console.log('[handleClientCalc] 品类不匹配，跳过计算', category);
    }
    return null;
  };

  const renderRows = (nodes: QuoteItem[], level = 0): React.ReactNode => {
    // 计算表格列数
    const columnCount =
      2 + // 商品名称 + 操作列
      (showImage ? 0 : 0) + // 图片内嵌在商品名称列
      (showWidth || showHeight ? 1 : 0) +
      (showFold ? 1 : 0) +
      (showProcessFee ? 1 : 0) +
      (showQuantity ? 1 : 0) +
      (showUnit ? 1 : 0) +
      (showUnitPrice ? 1 : 0) +
      (showAmount ? 1 : 0) +
      (showRemark ? 1 : 0);

    return nodes.map((item) => {
      const isItemExpanded = expandedItemIds.has(item.id);
      const toggleItemExpand = () => {
        setExpandedItemIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) {
            next.delete(item.id);
          } else {
            next.add(item.id);
          }
          return next;
        });
      };

      return (
        <QuoteItemRow
          key={item.id}
          item={item}
          level={level}
          readOnly={readOnly}
          showImage={showImage}
          showWidth={showWidth}
          showHeight={showHeight}
          showFold={showFold}
          showProcessFee={showProcessFee}
          showQuantity={showQuantity}
          showUnit={showUnit}
          showUnitPrice={showUnitPrice}
          showAmount={showAmount}
          showRemark={showRemark}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          handleAddAccessory={handleAddAccessory}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAdvancedEdit={handleAdvancedEdit}
          renderChildren={renderRows}
          isExpanded={isItemExpanded}
          onToggleExpand={toggleItemExpand}
          colSpan={columnCount}
        />
      );
    });
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

      {/* 顶部操作栏：添加空间按钮 */}
      {(rooms.length > 0 || itemsByRoom.unassigned.length > 0) && !readOnly && onAddRoom && (
        <div className="flex justify-start">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="start" />
        </div>
      )}

      {rooms.map((room) => {
        const isExpanded = expandedRoomIds.has(room.id);
        const roomItemCount = (itemsByRoom.mapping[room.id] || []).length;
        const roomSubtotal = getRoomSubtotal(room.id);

        return (
          <QuoteRoomAccordion
            key={room.id}
            room={{
              id: room.id,
              name: room.name,
              itemCount: roomItemCount,
              subtotal: roomSubtotal,
            }}
            isExpanded={isExpanded}
            onToggle={handleToggleRoom}
            readOnly={readOnly}
            onRename={handleRoomRename}
            onDelete={handleDeleteRoom}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-table-header">
                    <TableHead className="h-9 w-[25%] px-4">商品</TableHead>
                    {(showWidth || showHeight) && (
                      <TableHead className="h-9 w-[15%]">尺寸 (cm)</TableHead>
                    )}
                    {showFold && <TableHead className="h-9 w-[8%]">倍数</TableHead>}
                    {showProcessFee && <TableHead className="h-9 w-[10%]">加工费</TableHead>}
                    {showQuantity && <TableHead className="h-9 w-[12%]">数量</TableHead>}
                    {showUnit && <TableHead className="h-9 w-[8%]">单位</TableHead>}
                    {showUnitPrice && (
                      <TableHead className="h-9 w-[10%] text-right">单价</TableHead>
                    )}
                    {showAmount && <TableHead className="h-9 w-[10%] text-right">小计</TableHead>}
                    {showRemark && <TableHead className="h-9">备注</TableHead>}
                    <TableHead className="h-9 w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsByRoom.mapping[room.id]?.length > 0 ? (
                    renderRows(itemsByRoom.mapping[room.id])
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-muted-foreground h-16 border-none py-4 text-center italic"
                      >
                        此空间暂无明细，请添加商品
                      </TableCell>
                    </TableRow>
                  )}
                  {/* 行内添加商品行 - 放在商品行下方 */}
                  <QuoteInlineAddRow
                    quoteId={quoteId}
                    roomId={room.id}
                    onSuccess={onItemUpdate}
                    readOnly={readOnly}
                    showFold={showFold}
                    showProcessFee={showProcessFee}
                    showRemark={showRemark}
                    showWidth={showWidth}
                    showHeight={showHeight}
                    showUnit={showUnit}
                    allowedCategories={allowedCategories}
                  />
                </TableBody>
              </Table>
            </div>
          </QuoteRoomAccordion>
        );
      })}

      {itemsByRoom.unassigned.length > 0 && (
        <div className="glass-table overflow-hidden shadow-sm">
          <div className="glass-section-header bg-amber-500/10 px-4 py-2 dark:bg-amber-500/10">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              未分配空间商品
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="glass-table-header">
                  <TableHead className="h-9 w-[25%] px-4">商品</TableHead>
                  {(showWidth || showHeight) && (
                    <TableHead className="h-9 w-[15%]">尺寸 (cm)</TableHead>
                  )}
                  {showFold && <TableHead className="h-9 w-[8%]">倍数</TableHead>}
                  {showProcessFee && <TableHead className="h-9 w-[10%]">加工费</TableHead>}
                  {showQuantity && <TableHead className="h-9 w-[12%]">数量</TableHead>}
                  {showUnitPrice && <TableHead className="h-9 w-[10%] text-right">单价</TableHead>}
                  {showAmount && <TableHead className="h-9 w-[10%] text-right">小计</TableHead>}
                  {showRemark && <TableHead className="h-9">备注</TableHead>}
                  <TableHead className="h-9 w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(itemsByRoom.unassigned)}</TableBody>
            </Table>
          </div>
        </div>
      )}

      <QuoteItemAdvancedDrawer
        open={advancedDrawerOpen}
        onOpenChange={setAdvancedDrawerOpen}
        item={editingItem}
        onSuccess={onItemUpdate}
      />
      {/* Warning Dialog */}
      <Dialog
        open={warningDialog.open}
        onOpenChange={(open) => setWarningDialog((prev) => ({ ...prev, open }))}
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
            您可以通过修改“高级配置”调整工艺（如：改用贴布带），或确认此尺寸进行生产（可能需要拼接）。
          </div>
          <DialogFooter>
            <Button onClick={() => setWarningDialog((prev) => ({ ...prev, open: false }))}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
