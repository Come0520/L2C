'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { createQuoteItem, updateQuoteItem, deleteQuoteItem } from '@/features/quotes/actions/mutations';
import { Trash2, Plus, CornerDownRight } from 'lucide-react';
import { useToast } from '@/shared/ui/use-toast';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

interface QuoteItemsTableProps {
    quoteId: string;
    rooms: any[];
    items: any[];
    onItemUpdate?: () => void;
    mode?: 'simple' | 'advanced';
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

export function QuoteItemsTable({ quoteId, rooms, items, onItemUpdate, mode = 'simple' }: QuoteItemsTableProps) {
    const { toast } = useToast();
    const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

    const handleDelete = async (id: string) => {
        if (confirm('确定删除此项吗？')) {
            await deleteQuoteItem({ id, quoteId });
            toast({ title: '已删除' });
            if (onItemUpdate) onItemUpdate();
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            await updateQuoteItem({ id, ...data });
            toast({ title: '已更新' });
            if (onItemUpdate) onItemUpdate();
        } catch (error) {
            toast({ title: '更新失败', variant: 'destructive' });
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
            toast({ title: '附件添加成功' });
            if (onItemUpdate) onItemUpdate();
        } catch (error) {
            toast({ title: '添加失败', variant: 'destructive' });
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
        return nodes.map(item => (
            <>
                <TableRow key={item.id} className={cn(level > 0 && "bg-muted/30")}>
                    <TableCell className="font-medium pl-4">
                        <div className="flex items-center">
                            {level > 0 && <CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" />}
                            {item.productName}
                            {item.attributes?._warnings && (
                                <Badge variant="destructive" className="ml-2 text-xs">!</Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-1">
                            <Input
                                type="number"
                                className="w-16 h-8 text-right"
                                defaultValue={Number(item.width) || ''}
                                placeholder="宽"
                                onBlur={(e) => handleUpdate(item.id, { width: parseFloat(e.target.value) })}
                            />
                            <span className="text-muted-foreground">x</span>
                            <Input
                                type="number"
                                className="w-16 h-8 text-right"
                                defaultValue={Number(item.height) || ''}
                                placeholder="高"
                                onBlur={(e) => handleUpdate(item.id, { height: parseFloat(e.target.value) })}
                            />
                        </div>
                    </TableCell>

                    {/* Advanced Mode Columns */}
                    {mode === 'advanced' && (
                        <>
                            <TableCell>
                                <Input
                                    type="number"
                                    className="w-14 h-8 text-right"
                                    defaultValue={Number(item.foldRatio) || ''}
                                    placeholder="倍数"
                                    onBlur={(e) => handleUpdate(item.id, { foldRatio: parseFloat(e.target.value) })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    className="w-16 h-8 text-right"
                                    defaultValue={Number(item.processFee) || ''}
                                    placeholder="工费"
                                    onBlur={(e) => handleUpdate(item.id, { processFee: parseFloat(e.target.value) })}
                                />
                            </TableCell>
                        </>
                    )}

                    <TableCell>
                        <Input
                            type="number"
                            className="w-16 h-8 text-right"
                            defaultValue={Number(item.quantity)}
                            onBlur={(e) => handleUpdate(item.id, { quantity: parseFloat(e.target.value) })}
                        />
                    </TableCell>
                    <TableCell className="text-right">
                        <Input
                            type="number"
                            className="w-20 h-8 text-right"
                            defaultValue={Number(item.unitPrice)}
                            onBlur={(e) => handleUpdate(item.id, { unitPrice: parseFloat(e.target.value) })}
                        />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        ¥{Number(item.subtotal).toFixed(2)}
                    </TableCell>

                    {/* Advanced Mode Remark */}
                    {mode === 'advanced' && (
                        <TableCell>
                            <Input
                                className="w-24 h-8"
                                defaultValue={item.remark || ''}
                                placeholder="备注"
                                onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
                            />
                        </TableCell>
                    )}

                    <TableCell>
                        <div className="flex items-center space-x-2">
                            {level === 0 && (
                                <Button size="sm" variant="ghost" onClick={() => handleAddAccessory(item.id, item.roomId)}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                {item.children && item.children.length > 0 && renderRows(item.children, level + 1)}
            </>
        ));
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
                                {mode === 'advanced' && <TableHead className="w-[8%]">倍数</TableHead>}
                                {mode === 'advanced' && <TableHead className="w-[10%]">加工费</TableHead>}
                                <TableHead className="w-[10%]">数量</TableHead>
                                <TableHead className="text-right w-[10%]">单价</TableHead>
                                <TableHead className="text-right w-[10%]">小计</TableHead>
                                {mode === 'advanced' && <TableHead>备注</TableHead>}
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itemsByRoom[room.id]?.length > 0 ? (
                                renderRows(itemsByRoom[room.id])
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={mode === 'advanced' ? 9 : 6} className="text-center text-muted-foreground h-24">
                                        此空间暂无商品，点击右上角"添加商品"
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
                                {mode === 'advanced' && <TableHead className="w-[8%]">倍数</TableHead>}
                                {mode === 'advanced' && <TableHead className="w-[10%]">加工费</TableHead>}
                                <TableHead className="w-[10%]">数量</TableHead>
                                <TableHead className="text-right w-[10%]">单价</TableHead>
                                <TableHead className="text-right w-[10%]">小计</TableHead>
                                {mode === 'advanced' && <TableHead>备注</TableHead>}
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
