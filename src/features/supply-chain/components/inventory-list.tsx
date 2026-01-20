'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface InventoryItem {
    id: string;
    warehouseName: string | null;
    productName: string | null;
    quantity: number;
    updatedAt: Date | null;
}

interface InventoryListProps {
    initialItems: InventoryItem[];
}

export function InventoryList({ initialItems }: InventoryListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>产品</TableHead>
                        <TableHead>仓库</TableHead>
                        <TableHead>当前库存</TableHead>
                        <TableHead>最后更新</TableHead>
                        <TableHead className="text-right">状态</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialItems.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                暂无库存数据
                            </TableCell>
                        </TableRow>
                    ) : (
                        initialItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    {item.productName || '未知产品'}
                                </TableCell>
                                <TableCell>{item.warehouseName || '未知仓库'}</TableCell>
                                <TableCell>
                                    <span className={item.quantity < 0 ? 'text-red-500 font-bold' : ''}>
                                        {item.quantity}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {item.updatedAt ? format(item.updatedAt, 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity <= 0 ? (
                                        <Badge variant="destructive">缺货</Badge>
                                    ) : item.quantity < 10 ? ( // 假设10是低库存阈值
                                        <Badge variant="secondary">库存紧张</Badge>
                                    ) : (
                                        <Badge variant="outline">充足</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
