'use client';

import React from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Power from 'lucide-react/dist/esm/icons/power';
import PowerOff from 'lucide-react/dist/esm/icons/power-off';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Badge } from '@/shared/ui/badge';

interface ProductTableProps {
    data: any[];
    onEdit: (product: any) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
}

const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
        'WALLPAPER': '墙纸',
        'WALLCLOTH': '墙布',
        'CURTAIN_FABRIC': '窗帘面料',
        'CURTAIN_ACCESSORY': '窗帘配件',
        'STANDARD': '标准成品',
    };
    return labels[category] || category;
};

interface ProductTableRowProps {
    item: any;
    onEdit: (product: any) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
}

const ProductTableRow = React.memo(function ProductTableRow({ item, onEdit, onToggleStatus, onDelete }: ProductTableRowProps) {
    return (
        <TableRow key={item.id}>
            <TableCell className="font-medium">
                <div>{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
            </TableCell>
            <TableCell>{item.sku}</TableCell>
            <TableCell>
                <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
            </TableCell>
            <TableCell>¥{item.purchasePrice}</TableCell>
            <TableCell>¥{item.retailPrice}</TableCell>
            <TableCell>¥{item.floorPrice}</TableCell>
            <TableCell>
                <Badge variant={item.isActive ? "success" : "secondary"}>
                    {item.isActive ? '上架中' : '已下架'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(item.id, item.isActive)}>
                            {item.isActive ? (
                                <><PowerOff className="mr-2 h-4 w-4" /> 下架</>
                            ) : (
                                <><Power className="mr-2 h-4 w-4" /> 上架</>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(item.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> 删除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

export function ProductTable({ data, onEdit, onToggleStatus, onDelete }: ProductTableProps) {

    return (
        <div className="rounded-md border glass-liquid">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>产品名称</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>品类</TableHead>
                        <TableHead>采购价</TableHead>
                        <TableHead>零售价</TableHead>
                        <TableHead>最低售价</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                暂无数据
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <ProductTableRow
                                key={item.id}
                                item={item}
                                onEdit={onEdit}
                                onToggleStatus={onToggleStatus}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
