'use client';

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
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import { Badge } from '@/shared/ui/badge';

/** 渠道列表项类型 */
export interface ChannelItem {
    id: string;
    name: string;
    isActive?: boolean;
    status?: string | null;
    channelCategory?: { name: string } | null;
    categoryName?: string | null;
}

/** 渠道分类项类型 */
export interface ChannelCategoryItem {
    id: string;
    name: string;
}

interface ChannelListProps<T extends ChannelItem> {
    data: T[];
    categories?: ChannelCategoryItem[];
}

/**
 * 渠道列表组件
 * 展示渠道配置数据表格
 */
export function ChannelList<T extends ChannelItem>({ data, categories: _categories }: ChannelListProps<T>) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>渠道名称</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                暂无渠道数据
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.channelCategory?.name || item.categoryName || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={(item.isActive ?? item.status === 'ACTIVE') ? "default" : "secondary"}>
                                        {(item.isActive ?? item.status === 'ACTIVE') ? '启用' : '停用'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
