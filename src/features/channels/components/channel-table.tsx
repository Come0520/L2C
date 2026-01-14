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
import { Badge } from '@/shared/ui/badge';
import { Edit2, Eye, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface ChannelTableProps {
    data: any[]; // To be narrowed with types
    onEdit?: (id: string) => void;
}

const TYPE_MAP: Record<string, string> = {
    DECORATION_CO: '装饰公司',
    DESIGNER: '独立设计师',
    CROSS_INDUSTRY: '异业合作',
};

const LEVEL_MAP: Record<string, string> = {
    S: 'S级 (核心)',
    A: 'A级 (优质)',
    B: 'B级 (普通)',
    C: 'C级 (潜在)',
};

export function ChannelTable({ data }: ChannelTableProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>渠道名称</TableHead>
                        <TableHead>编号</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>等级</TableHead>
                        <TableHead>主要联系人</TableHead>
                        <TableHead>累计线索</TableHead>
                        <TableHead>累计成交额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.code}</TableCell>
                            <TableCell>{TYPE_MAP[item.channelType] || item.channelType}</TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {LEVEL_MAP[item.level] || item.level}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div>{item.contactName}</div>
                                <div className="text-xs text-gray-500">{item.phone}</div>
                            </TableCell>
                            <TableCell>{item.totalLeads}</TableCell>
                            <TableCell>¥{item.totalDealAmount}</TableCell>
                            <TableCell>
                                <Badge variant={item.status === 'ACTIVE' ? 'primary' : 'secondary'}>
                                    {item.status === 'ACTIVE' ? '启用' : '离线'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" asChild title="查看详情">
                                        <Link href={`/channels/${item.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" asChild title="编辑">
                                        <Link href={`/channels/edit/${item.id}`}>
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                                暂无渠道数据
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
