import { useMemo, memo, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { createQuoteItem, updateQuoteItem, deleteQuoteItem, updateRoom, deleteRoom } from '@/features/quotes/actions/mutations';
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
import { CurtainCalculator, WallpaperCalculator, CurtainFormula, WallpaperFormula } from '@/features/quotes/logic/calculator';
import { QuoteItemAdvancedDrawer } from './quote-item-advanced-drawer';
import { QuoteItemExpandRow } from './quote-item-expand-row';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

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
    showUnitPrice: boolean;
    showAmount: boolean;
    showRemark: boolean;
    handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
    handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
    handleClientCalc: (item: QuoteItem, field: string, value: number) => number | null;
    handleAdvancedEdit: (item: QuoteItem) => void;
    renderChildren: (nodes: QuoteItem[], level: number) => React.ReactNode;
    /** 行展开状态 */
    isExpanded: boolean;
    /** 切换展开状态 */
    onToggleExpand: () => void;
    /** 表格列数（用于 colSpan） */
    colSpan: number;
}

const QuoteItemRow = memo(({
    item,
    level,
    readOnly,
    showImage,
    showWidth,
    showHeight,
    showFold,
    showProcessFee,
    showQuantity,
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

    return (
        <>
            <TableRow key={item.id} className={cn(
                "transition-all duration-200 glass-row-hover",
                level > 0 ? "bg-white/5 hover:bg-white/10" : "hover:bg-white/5"
            )}>
                <TableCell className="font-medium p-2">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                        {level > 0 && (
                            <div className="relative flex items-center h-full mr-2">
                                <div className="w-4 border-b border-l border-muted-foreground/30 h-4 rounded-bl-md absolute -top-3 left-0"></div>
                                <CornerDownRight className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                        )}
                        {readOnly ? (
                            <span className="truncate max-w-[200px] block">{item.productName}</span>
                        ) : (
                            <div className="w-48">
                                <ProductAutocomplete
                                    value={item.productName}
                                    onSelect={(p) => handleProductSelect(item.id, p)}
                                    category={item.category}
                                />
                            </div>
                        )}
                        {!readOnly && showImage && (item.attributes?.productImage ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="ml-2 w-8 h-8 rounded border bg-muted shrink-0 cursor-zoom-in overflow-hidden relative group">
                                        <Image
                                            src={String(item.attributes.productImage)}
                                            alt="Product"
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden border-none shadow-xl" side="right">
                                    <Image
                                        src={String(item.attributes.productImage)}
                                        alt="Preview"
                                        width={256}
                                        height={256}
                                        className="w-full h-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="ml-2 w-8 h-8 rounded border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center opacity-50" title="No Image">
                                <span className="text-[10px] text-muted-foreground">图</span>
                            </div>
                        ))}
                        {warning && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Badge variant="error" className="ml-2 text-xs cursor-pointer hover:opacity-80 shrink-0">!</Badge>
                                </PopoverTrigger>
                                <PopoverContent className="glass-popover w-64 p-3 text-destructive text-sm" side="top">
                                    <div className="font-semibold mb-1">⚠️ 警报</div>
                                    <div className="text-xs opacity-90">{warning}</div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </TableCell>
                {(showWidth || showHeight) && (
                    <TableCell className="p-2">
                        <div className="flex items-center space-x-1">
                            {showWidth && (
                                <Input
                                    disabled={readOnly}
                                    type="number"
                                    className="w-16 h-8 text-right px-1 bg-transparent/50"
                                    defaultValue={Number(item.width) || ''}
                                    placeholder="宽"
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (isNaN(val)) return;
                                        const qty = handleClientCalc(item, 'width', val);
                                        handleUpdate(item.id, { width: val, quantity: qty ?? undefined });
                                    }}
                                />
                            )}
                            {showWidth && showHeight && <span className="text-muted-foreground text-xs">x</span>}
                            {showHeight && (
                                <Input
                                    disabled={readOnly}
                                    type="number"
                                    className="w-16 h-8 text-right px-1 bg-transparent/50"
                                    defaultValue={Number(item.height) || ''}
                                    placeholder="高"
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (isNaN(val)) return;
                                        const qty = handleClientCalc(item, 'height', val);
                                        handleUpdate(item.id, { height: val, quantity: qty ?? undefined });
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
                            className="w-14 h-8 text-right px-1 bg-transparent/50"
                            defaultValue={Number(item.foldRatio) || ''}
                            placeholder="倍数"
                            onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (isNaN(val)) return;
                                const qty = handleClientCalc(item, 'foldRatio', val);
                                handleUpdate(item.id, { foldRatio: val, quantity: qty ?? undefined });
                            }}
                        />
                    </TableCell>
                )}
                {showProcessFee && (
                    <TableCell className="p-2">
                        <Input
                            disabled={readOnly}
                            type="number"
                            className="w-16 h-8 text-right px-1 bg-transparent/50"
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

                {showQuantity && (
                    <TableCell className="p-2">
                        <div className="flex items-center gap-1">
                            <Input
                                disabled={readOnly}
                                type="number"
                                className="w-16 h-8 text-right px-1 bg-transparent/50 font-medium text-primary"
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
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0">
                                            <Info className="w-3.5 h-3.5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="glass-popover w-64 p-0 overflow-hidden" side="right">
                                        <div className="glass-section-header p-3">
                                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider text-center">计算详情</h4>
                                        </div>
                                        <div className="p-3 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">成品展示:</span>
                                                <span className="font-mono">{calcDetails.finishedWidth} x {calcDetails.finishedHeight} cm</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">预留净尺寸:</span>
                                                <span className="font-mono text-primary">{calcDetails.cutWidth} x {calcDetails.cutHeight} cm</span>
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
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </TableCell>
                )}
                {showUnitPrice && (
                    <TableCell className="text-right p-2">
                        <Input
                            disabled={readOnly}
                            type="number"
                            className="w-20 h-8 text-right px-1 bg-transparent/50"
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
                    <TableCell className="text-right font-medium p-2">
                        <span className="font-mono text-slate-700 dark:text-slate-100">
                            ¥{Number(item.subtotal).toFixed(2)}
                        </span>
                    </TableCell>
                )}

                {showRemark && (
                    <TableCell className="p-2">
                        <Input
                            disabled={readOnly}
                            className="w-24 h-8 bg-transparent/50 text-xs px-2"
                            defaultValue={item.remark || ''}
                            placeholder="备注"
                            onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
                        />
                    </TableCell>
                )}

                <TableCell className="p-2">
                    {!readOnly && (
                        <div className="flex items-center space-x-1">
                            {level === 0 && (
                                <Button size="icon" variant="ghost" onClick={() => handleAddAccessory(item.id, item.roomId)} className="h-7 w-7 hover:bg-primary/10 hover:text-primary">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            )}
                            {/* 展开/折叠按钮（仅主商品且为窗帘类显示） */}
                            {level === 0 && isCurtain && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("h-7 w-7", isExpanded ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
                                    onClick={onToggleExpand}
                                    title={isExpanded ? "收起高级配置" : "展开高级配置"}
                                >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleAdvancedEdit(item)} title="高级配置">
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-4 h-4" />
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
                    onSave={() => {/* 刷新数据 */ }}
                    colSpan={colSpan}
                />
            )}
            {item.children && item.children.length > 0 && renderChildren(item.children, level + 1)}
        </>
    );
});
QuoteItemRow.displayName = 'QuoteItemRow';

// Helper to build tree
const buildTree = (items: QuoteItem[]): QuoteItem[] => {
    const itemMap = new Map<string, QuoteItem>();
    items.forEach(item => itemMap.set(item.id, { ...item, children: [] }));

    const rootItems: QuoteItem[] = [];
    itemMap.forEach(item => {
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
    dimensionLimits?: { heightWarning: number; heightMax: number; widthWarning: number; widthMax: number; enabled: boolean };
    /** 允许添加的商品品类列表（过滤商品选择器） */
    allowedCategories?: string[];
}

export function QuoteItemsTable({ quoteId, rooms, items, onItemUpdate, onAddRoom, mode = 'simple', visibleFields, readOnly = false, allowedCategories }: QuoteItemsTableProps) {

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

    const showQuantity = isFieldVisible('quantity');
    const showUnitPrice = isFieldVisible('unitPrice');
    const showAmount = isFieldVisible('amount') || isFieldVisible('subtotal'); // Handle both keys
    const showRemark = isFieldVisible('remarks') || isFieldVisible('remark');

    // 高级编辑抽屉状态
    const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);

    // 空间展开状态（聚焦模式：默认只展开第一个）
    const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(() => {
        return rooms.length > 0 ? new Set([rooms[0].id]) : new Set();
    });

    // 行展开状态（快速/高级报价切换）
    const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

    // 跟踪之前的空间 ID 集合，用于检测新增空间
    const prevRoomIdsRef = useRef<Set<string>>(new Set(rooms.map(r => r.id)));

    // 自动展开新创建的空间
    useEffect(() => {
        const currentRoomIds = new Set(rooms.map(r => r.id));
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
    const getRoomSubtotal = useCallback((roomId: string) => {
        const roomItems = items.filter(item => item.roomId === roomId);
        return roomItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    }, [items]);

    // 切换空间展开状态（聚焦模式）
    const handleToggleRoom = useCallback((roomId: string) => {
        setExpandedRoomIds(prev => {
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
        tree.forEach(root => {
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
            console.error("Failed to update item");
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
        const name = prompt('请输入附件名称');
        if (!name) return;

        try {
            await createQuoteItem({
                quoteId,
                roomId: roomId || undefined,
                parentId,
                category: 'ACCESSORY',
                productName: name,
                unitPrice: 0,
                quantity: 1,
                width: 0,
                height: 0
            });
            toast.success('附件添加成功');
            if (onItemUpdate) onItemUpdate();
        } catch (_error) {
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
                productImage: product.images?.[0]
            }
        });
    };

    const handleClientCalc = (item: QuoteItem, field: string, value: number) => {
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

        // 窗帘类品类：支持 CURTAIN, CURTAIN_FABRIC, CURTAIN_SHEER
        const isCurtainCategory = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category);
        // 墙纸/墙布类品类
        const isWallCategory = ['WALLPAPER', 'WALLCLOTH'].includes(category);

        if (isCurtainCategory || isWallCategory) {
            const attributes = (newItem.attributes || {}) as Record<string, unknown>;
            let result: { quantity: number; warning?: string } | null = null;

            if (isCurtainCategory) {
                result = CurtainCalculator.calculate({
                    measuredWidth: Number(newItem.width) || 0,
                    measuredHeight: Number(newItem.height) || 0,
                    foldRatio: Number(newItem.foldRatio) || 2,
                    fabricWidth: Number(attributes.fabricWidth) || 280,
                    formula: (attributes.formula as CurtainFormula) || 'FIXED_HEIGHT',
                    sideLoss: Number(attributes.sideLoss),
                    bottomLoss: Number(attributes.bottomLoss),
                    headerLoss: Number(attributes.headerLoss)
                });
                console.log('[handleClientCalc] 窗帘计算结果', result);
            } else if (isWallCategory) {
                result = WallpaperCalculator.calculate({
                    measuredWidth: Number(newItem.width) || 0,
                    measuredHeight: Number(newItem.height) || 0,
                    productWidth: Number(attributes.fabricWidth) || (category === 'WALLPAPER' ? 53 : 280),
                    rollLength: Number(attributes.rollLength) || 1000,
                    patternRepeat: Number(attributes.patternRepeat) || 0,
                    formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula
                });
                console.log('[handleClientCalc] 墙纸/墙布计算结果', result);
            }

            // 确保返回有效数值，NaN 返回 null
            if (result && typeof result.quantity === 'number' && !isNaN(result.quantity)) {
                return result.quantity;
            }
            console.log('[handleClientCalc] 计算结果无效，返回 null', result?.quantity);
            return null;
        } else {
            console.log('[handleClientCalc] 品类不匹配，跳过计算', category);
        }
        return null;
    };

    const renderRows = (nodes: QuoteItem[], level = 0): React.ReactNode => {
        // 计算表格列数
        const columnCount = 2 + // 商品名称 + 操作列
            (showImage ? 0 : 0) + // 图片内嵌在商品名称列
            ((showWidth || showHeight) ? 1 : 0) +
            (showFold ? 1 : 0) +
            (showProcessFee ? 1 : 0) +
            (showQuantity ? 1 : 0) +
            (showUnitPrice ? 1 : 0) +
            (showAmount ? 1 : 0) +
            (showRemark ? 1 : 0);

        return nodes.map(item => {
            const isItemExpanded = expandedItemIds.has(item.id);
            const toggleItemExpand = () => {
                setExpandedItemIds(prev => {
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
                <div className="glass-empty-state py-12 text-muted-foreground text-center">
                    <p className="text-sm">暂无报价文件明细</p>
                    <p className="text-xs opacity-60 mt-1">请先添加空间或从产品库导入主材</p>
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

            {rooms.map(room => {
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
                                        <TableHead className="w-[25%] px-4 h-9">商品</TableHead>
                                        {(showWidth || showHeight) && <TableHead className="w-[15%] h-9">尺寸 (cm)</TableHead>}
                                        {showFold && <TableHead className="w-[8%] h-9">倍数</TableHead>}
                                        {showProcessFee && <TableHead className="w-[10%] h-9">加工费</TableHead>}
                                        {showQuantity && <TableHead className="w-[12%] h-9">数量</TableHead>}
                                        {showUnitPrice && <TableHead className="text-right w-[10%] h-9">单价</TableHead>}
                                        {showAmount && <TableHead className="text-right w-[10%] h-9">小计</TableHead>}
                                        {showRemark && <TableHead className="h-9">备注</TableHead>}
                                        <TableHead className="w-[80px] h-9"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {itemsByRoom.mapping[room.id]?.length > 0 ? (
                                        renderRows(itemsByRoom.mapping[room.id])
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted-foreground h-16 italic py-4 border-none">
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
                    <div className="glass-section-header px-4 py-2 bg-amber-500/10 dark:bg-amber-500/10">
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">未分配空间商品</span>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="glass-table-header">
                                    <TableHead className="w-[25%] px-4 h-9">商品</TableHead>
                                    {(showWidth || showHeight) && <TableHead className="w-[15%] h-9">尺寸 (cm)</TableHead>}
                                    {showFold && <TableHead className="w-[8%] h-9">倍数</TableHead>}
                                    {showProcessFee && <TableHead className="w-[10%] h-9">加工费</TableHead>}
                                    {showQuantity && <TableHead className="w-[12%] h-9">数量</TableHead>}
                                    {showUnitPrice && <TableHead className="text-right w-[10%] h-9">单价</TableHead>}
                                    {showAmount && <TableHead className="text-right w-[10%] h-9">小计</TableHead>}
                                    {showRemark && <TableHead className="h-9">备注</TableHead>}
                                    <TableHead className="w-[80px] h-9"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renderRows(itemsByRoom.unassigned)}
                            </TableBody>
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
        </div>
    );

}
