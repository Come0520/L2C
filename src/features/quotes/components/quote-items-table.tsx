import { useMemo, memo } from 'react';
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
import { QuoteItemDialog } from './quote-item-dialog';
import { useState } from 'react';
import { CurtainCalculator, WallpaperCalculator, CurtainFormula, WallpaperFormula } from '@/features/quotes/logic/calculator';

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
    attributes?: Record<string, any>;
    children?: QuoteItem[];
    [key: string]: any; // Allow for UI-only flags like _matched
}

interface QuoteItemRowProps {
    item: QuoteItem;
    level: number;
    readOnly: boolean;
    showFold: boolean;
    showProcessFee: boolean;
    showRemark: boolean;
    handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
    handleProductSelect: (id: string, product: Record<string, any>) => Promise<void>;
    handleClientCalc: (item: QuoteItem, field: string, value: number) => number | null;
    renderChildren: (nodes: QuoteItem[], level: number) => React.ReactNode;
}

const QuoteItemRow = memo(({
    item,
    level,
    readOnly,
    showFold,
    showProcessFee,
    showRemark,
    handleUpdate,
    handleDelete,
    handleAddAccessory,
    handleProductSelect,
    handleClientCalc,
    renderChildren
}: QuoteItemRowProps) => {
    const warning = item.attributes?.calcResult?.warning || item.attributes?._warnings;
    const calcDetails = item.attributes?.calcResult;

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
                        {!readOnly && (item.attributes?.productImage ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="ml-2 w-8 h-8 rounded border bg-muted shrink-0 cursor-zoom-in overflow-hidden relative group">
                                        <img
                                            src={item.attributes.productImage}
                                            alt="Product"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden border-none shadow-xl" side="right">
                                    <img
                                        src={item.attributes.productImage}
                                        alt="Preview"
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
                <TableCell className="p-2">
                    <div className="flex items-center space-x-1">
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
                        <span className="text-muted-foreground text-xs">x</span>
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
                    </div>
                </TableCell>

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
                <TableCell className="text-right font-medium p-2">
                    <span className="font-mono text-slate-700 dark:text-slate-100">
                        ¥{Number(item.subtotal).toFixed(2)}
                    </span>
                </TableCell>

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
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </TableCell>
            </TableRow>
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

interface QuoteItemsTableProps {
    quoteId: string;
    rooms: any[];
    items: any[];
    onItemUpdate?: () => void;
    mode?: 'simple' | 'advanced';
    visibleFields?: string[];
    readOnly?: boolean;
    dimensionLimits?: any; // Should import DimensionLimits, but 'any' avoids circular or extra imports for now if not easy. 
    // Wait, DimensionLimits is exported from quote-config.service.ts, I should import it or use 'any' if I want to be lazy (not recommended).
    // Let's use 'any' if import is far, or just skip type if not strict. 
    // Actually, I can import it.
}

export function QuoteItemsTable({ quoteId, rooms, items, onItemUpdate, mode = 'simple', visibleFields, readOnly = false, dimensionLimits }: QuoteItemsTableProps) {

    const isFieldVisible = (field: string) => {
        if (visibleFields && visibleFields.length > 0) {
            return visibleFields.includes(field);
        }
        return mode !== 'simple';
    };

    const showFold = isFieldVisible('foldRatio');
    const showProcessFee = isFieldVisible('processFee');
    const showRemark = isFieldVisible('remark');

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenAddDialog = (roomId: string | null) => {
        setActiveRoomId(roomId);
        setIsDialogOpen(true);
    };

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

    const handleUpdate = async (id: string, data: any) => {
        if (readOnly) return;
        try {
            await updateQuoteItem({ id, ...data });
            toast.success('已更新');
            if (onItemUpdate) onItemUpdate();
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            toast.error('添加失败');
        }
    };

    const handleProductSelect = async (id: string, product: any) => {
        if (readOnly) return;
        await handleUpdate(id, {
            productId: product.id,
            productName: product.name,
            unitPrice: product.unitPrice ? parseFloat(product.unitPrice) : undefined,
            attributes: {
                ...product.specs,
                productImage: product.images?.[0]
            }
        });
    };

    const handleClientCalc = (item: any, field: string, value: number) => {
        const newItem = { ...item, [field]: value };
        const category = newItem.category;

        if (category === 'CURTAIN' || category === 'WALLPAPER' || category === 'WALLCLOTH') {
            const attributes = newItem.attributes || {};
            let result: any = null;

            if (category === 'CURTAIN') {
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
            } else if (category === 'WALLPAPER' || category === 'WALLCLOTH') {
                result = WallpaperCalculator.calculate({
                    measuredWidth: Number(newItem.width) || 0,
                    measuredHeight: Number(newItem.height) || 0,
                    productWidth: Number(attributes.fabricWidth) || (category === 'WALLPAPER' ? 53 : 280),
                    rollLength: Number(attributes.rollLength) || 1000,
                    patternRepeat: Number(attributes.patternRepeat) || 0,
                    formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula
                });
            }

            if (result) return result.quantity;
        }
        return null;
    };

    const renderRows = (nodes: any[], level = 0): React.ReactNode => {
        return nodes.map(item => (
            <QuoteItemRow
                key={item.id}
                item={item}
                level={level}
                readOnly={readOnly}
                showFold={showFold}
                showProcessFee={showProcessFee}
                showRemark={showRemark}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                handleAddAccessory={handleAddAccessory}
                handleProductSelect={handleProductSelect}
                handleClientCalc={handleClientCalc}
                renderChildren={renderRows}
            />
        ));
    };

    return (
        <div className="space-y-8">
            {rooms.length === 0 && itemsByRoom.unassigned.length === 0 && (
                <div className="glass-empty-state py-12 text-muted-foreground">
                    <p className="text-sm">暂无报价文件明细</p>
                    <p className="text-xs opacity-60 mt-1">请先添加空间或从产品库导入主材</p>
                </div>
            )}

            {rooms.map(room => (
                <div key={room.id} className="glass-table overflow-hidden shadow-sm">
                    <div className="glass-section-header px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {readOnly ? (
                                <span className="text-sm font-semibold">{room.name}</span>
                            ) : (
                                <Input
                                    className="h-8 w-48 bg-white/50 border-transparent hover:border-slate-300 focus:bg-white text-sm font-medium transition-all"
                                    defaultValue={room.name}
                                    onBlur={(e) => handleRoomRename(room.id, e.target.value)}
                                />
                            )}
                        </div>
                        {!readOnly && (
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenAddDialog(room.id)}>
                                    <Plus className="w-4 h-4 mr-1" /> 添加商品
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(room.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="glass-table-header">
                                    <TableHead className="w-[25%] px-4 h-9">商品</TableHead>
                                    <TableHead className="w-[15%] h-9">尺寸 (cm)</TableHead>
                                    {showFold && <TableHead className="w-[8%] h-9">倍数</TableHead>}
                                    {showProcessFee && <TableHead className="w-[10%] h-9">加工费</TableHead>}
                                    <TableHead className="w-[12%] h-9">数量</TableHead>
                                    <TableHead className="text-right w-[10%] h-9">单价</TableHead>
                                    <TableHead className="text-right w-[10%] h-9">小计</TableHead>
                                    {showRemark && <TableHead className="h-9">备注</TableHead>}
                                    <TableHead className="w-[80px] h-9"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsByRoom.mapping[room.id]?.length > 0 ? (
                                    renderRows(itemsByRoom.mapping[room.id])
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground h-24 italic py-8 border-none">
                                            此空间暂无明细数据
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}

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
                                    <TableHead className="w-[15%] h-9">尺寸</TableHead>
                                    {showFold && <TableHead className="w-[8%] h-9">倍数</TableHead>}
                                    {showProcessFee && <TableHead className="w-[10%] h-9">加工费</TableHead>}
                                    <TableHead className="w-[12%] h-9">数量</TableHead>
                                    <TableHead className="text-right w-[10%] h-9">单价</TableHead>
                                    <TableHead className="text-right w-[10%] h-9">小计</TableHead>
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

            <QuoteItemDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                quoteId={quoteId}
                roomId={activeRoomId}
                onSuccess={onItemUpdate}
                dimensionLimits={dimensionLimits}
                visibleFields={visibleFields}
            />
        </div>
    );
}
