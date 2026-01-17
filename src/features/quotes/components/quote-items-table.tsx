'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { createQuoteItem, updateQuoteItem, deleteQuoteItem } from '@/features/quotes/actions/mutations';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import Info from 'lucide-react/dist/esm/icons/info';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface QuoteItemsTableProps {
    quoteId: string;
    rooms: any[];
    items: any[];
    onItemUpdate?: () => void;
    mode?: 'simple' | 'advanced';
    visibleFields?: string[];
}

// Helper to build tree
const buildTree = (items: any[]) => {
    const itemMap = new Map();
    items.forEach(item => itemMap.set(item.id, { ...item, children: [] }));

    const rootItems: any[] = [];
    itemMap.forEach(item => {
        if (item.parentId && itemMap.has(item.parentId)) {
            itemMap.get(item.parentId).children.push(item);
        } else {
            rootItems.push(item);
        }
    });

    return rootItems;
};

export function QuoteItemsTable({ quoteId, rooms, items, onItemUpdate, mode = 'simple', visibleFields }: QuoteItemsTableProps) {
    const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

    // Field Visibility Helpers
    const isFieldVisible = (field: string) => {
        if (visibleFields && visibleFields.length > 0) {
            return visibleFields.includes(field);
        }
        // Fallback to mode
        if (mode === 'simple') return false;
        // Advanced defaults
        return true;
    };

    const showFold = isFieldVisible('foldRatio');
    const showProcessFee = isFieldVisible('processFee');
    const showRemark = isFieldVisible('remark');

    const handleDelete = async (id: string) => {
        if (confirm('确定删除此项吗？')) {
            await deleteQuoteItem({ id });
            toast.success('已删除');
            if (onItemUpdate) onItemUpdate();
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            await updateQuoteItem({ id, ...data });
            toast.success('已更新');
            if (onItemUpdate) onItemUpdate();
        } catch (error) {
            toast.error('更新失败');
        }
    };

    const handleAddAccessory = async (parentId: string, roomId: string | null) => {
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

    // Group Items by Room
    const itemsByRoom: Record<string, any[]> = {};
    const unassignedItems: any[] = [];

    const tree = buildTree(items);

    tree.forEach(root => {
        if (root.roomId) {
            if (!itemsByRoom[root.roomId]) itemsByRoom[root.roomId] = [];
            itemsByRoom[root.roomId].push(root);
        } else {
            unassignedItems.push(root);
        }
    });

    const renderRows = (nodes: any[], level = 0): React.ReactNode => {
        return nodes.map(item => {
            const warning = item.attributes?.calcResult?.warning || item.attributes?._warnings;
            const calcDetails = item.attributes?.calcResult;

            return (
                <>
                    <TableRow key={item.id} className={cn(level > 0 && "bg-muted/30")}>
                        <TableCell className="font-medium pl-4">
                            <div className="flex items-center">
                                {level > 0 && <CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" />}
                                {item.productName}
                                {warning && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Badge variant="error" className="ml-2 text-xs cursor-pointer hover:opacity-80 shrink-0">!</Badge>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3 bg-destructive/10 border-destructive/20 backdrop-blur-md text-destructive text-sm" side="top">
                                            <div className="font-semibold mb-1">⚠️ 警报</div>
                                            {warning}
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center space-x-1">
                                <Input
                                    type="number"
                                    className="w-16 h-8 text-right bg-transparent/50"
                                    defaultValue={Number(item.width) || ''}
                                    placeholder="宽"
                                    onBlur={(e) => handleUpdate(item.id, { width: parseFloat(e.target.value) })}
                                />
                                <span className="text-muted-foreground">x</span>
                                <Input
                                    type="number"
                                    className="w-16 h-8 text-right bg-transparent/50"
                                    defaultValue={Number(item.height) || ''}
                                    placeholder="高"
                                    onBlur={(e) => handleUpdate(item.id, { height: parseFloat(e.target.value) })}
                                />
                            </div>
                        </TableCell>

                        {/* Configurable Columns */}
                        {showFold && (
                            <TableCell>
                                <Input
                                    type="number"
                                    className="w-14 h-8 text-right bg-transparent/50"
                                    defaultValue={Number(item.foldRatio) || ''}
                                    placeholder="倍数"
                                    onBlur={(e) => handleUpdate(item.id, { foldRatio: parseFloat(e.target.value) })}
                                />
                            </TableCell>
                        )}
                        {showProcessFee && (
                            <TableCell>
                                <Input
                                    type="number"
                                    className="w-16 h-8 text-right bg-transparent/50"
                                    defaultValue={Number(item.processFee) || ''}
                                    placeholder="工费"
                                    onBlur={(e) => handleUpdate(item.id, { processFee: parseFloat(e.target.value) })}
                                />
                            </TableCell>
                        )}


                        <TableCell>
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    className="w-16 h-8 text-right bg-transparent/50"
                                    defaultValue={Number(item.quantity)}
                                    onBlur={(e) => handleUpdate(item.id, { quantity: parseFloat(e.target.value) })}
                                />
                                {calcDetails && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                                                <Info className="w-3.5 h-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-slate-200/50 shadow-xl overflow-hidden" side="right">
                                            <div className="p-3 border-b border-slate-100/10 bg-slate-50/50 dark:bg-slate-800/50">
                                                <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">计算明细</h4>
                                            </div>
                                            <div className="p-3 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">成品尺寸:</span>
                                                    <span className="font-mono">{calcDetails.finishedWidth} x {calcDetails.finishedHeight} cm</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">下料尺寸:</span>
                                                    <span className="font-mono text-primary">{calcDetails.cutWidth} x {calcDetails.cutHeight} cm</span>
                                                </div>
                                                {calcDetails.stripCount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">幅数/卷数:</span>
                                                        <span className="font-mono">{calcDetails.stripCount}</span>
                                                    </div>
                                                )}
                                                {calcDetails.fabricWidthCm && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">面料幅宽:</span>
                                                        <span className="font-mono">{calcDetails.fabricWidthCm} cm</span>
                                                    </div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <Input
                                type="number"
                                className="w-20 h-8 text-right bg-transparent/50"
                                defaultValue={Number(item.unitPrice)}
                                onBlur={(e) => handleUpdate(item.id, { unitPrice: parseFloat(e.target.value) })}
                            />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            <span className="font-mono text-slate-700 dark:text-slate-200">
                                ¥{Number(item.subtotal).toFixed(2)}
                            </span>
                        </TableCell>

                        {/* Advanced Mode Remark */}
                        {showRemark && (
                            <TableCell>
                                <Input
                                    className="w-24 h-8 bg-transparent/50"
                                    defaultValue={item.remark || ''}
                                    placeholder="备注"
                                    onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
                                />
                            </TableCell>
                        )}

                        <TableCell>
                            <div className="flex items-center space-x-2">
                                {level === 0 && (
                                    <Button size="sm" variant="ghost" onClick={() => handleAddAccessory(item.id, item.roomId)} className="hover:bg-primary/10 hover:text-primary">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    {item.children && item.children.length > 0 && renderRows(item.children, level + 1)}
                </>
            );
        });
    };

    return (
        <div className="space-y-8">
            {rooms.length === 0 && unassignedItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    暂无报价明细，请先添加空间或商品
                </div>
            )}

            {rooms.map(room => (
                <div key={room.id} className="border rounded-md">
                    <div className="bg-muted/50 p-3 flex justify-between items-center font-medium">
                        <span>{room.name}</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%]">商品</TableHead>
                                <TableHead className="w-[15%]">尺寸 (cm)</TableHead>
                                {showFold && <TableHead className="w-[8%]">倍数</TableHead>}
                                {showProcessFee && <TableHead className="w-[10%]">加工费</TableHead>}
                                <TableHead className="w-[10%]">数量</TableHead>
                                <TableHead className="text-right w-[10%]">单价</TableHead>
                                <TableHead className="text-right w-[10%]">小计</TableHead>
                                {showRemark && <TableHead>备注</TableHead>}
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itemsByRoom[room.id]?.length > 0 ? (
                                renderRows(itemsByRoom[room.id])
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6 + (showFold ? 1 : 0) + (showProcessFee ? 1 : 0) + (showRemark ? 1 : 0)} className="text-center text-muted-foreground h-24">
                                        此空间暂无商品，点击右上角&quot;添加商品&quot;
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ))}

            {unassignedItems.length > 0 && (
                <div className="border rounded-md">
                    <div className="bg-muted/50 p-3 font-medium">未分配空间</div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[20%]">商品</TableHead>
                                <TableHead className="w-[15%]">尺寸</TableHead>
                                {showFold && <TableHead className="w-[8%]">倍数</TableHead>}
                                {showProcessFee && <TableHead className="w-[10%]">加工费</TableHead>}
                                <TableHead className="w-[10%]">数量</TableHead>
                                <TableHead className="text-right w-[10%]">单价</TableHead>
                                <TableHead className="text-right w-[10%]">小计</TableHead>
                                {showRemark && <TableHead>备注</TableHead>}
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderRows(unassignedItems)}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
