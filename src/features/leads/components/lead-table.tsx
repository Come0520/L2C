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
import { Button } from '@/shared/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
// import { Lead } from '@/shared/api/schema'; // We might need a type, usually from logic or inferred
import { type leads } from '@/shared/api/schema'; // drizzle type or inferred?
// Using inferred type from queries is better, but for now I'll use any or define a minimal interface
// actually 'leads' is the table definition. 'InferSelectModel' from drizzle-orm.

import { useRouter } from 'next/navigation';

// Simplified type for now. 
// Ideally we import the ReturnType of getLeads['data'][0]
interface LeadTableProps {
    data: any[]; // TODO: Strict typing
    page: number;
    pageSize: number;
    total: number;
    onPageChange?: (page: number) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    'PENDING_ASSIGNMENT': { label: '待分配', variant: 'secondary' },
    'PENDING_FOLLOWUP': { label: '待跟进', variant: 'default' },
    'FOLLOWING_UP': { label: '跟进中', variant: 'default' }, // Enum is FOLLOWING_UP
    'WON': { label: '已转化', variant: 'outline' }, // highlight?
    'VOID': { label: '已作废', variant: 'destructive' },
    'INVALID': { label: '无效', variant: 'destructive' },
};

export function LeadTable({ data, page, pageSize, total }: LeadTableProps) {
    const router = useRouter();

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>线索编号</TableHead>
                            <TableHead>客户信息</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>来源</TableHead>
                            <TableHead>跟进销售</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    暂无数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((lead) => {
                                const statusConfig = STATUS_MAP[lead.status] || { label: lead.status, variant: 'secondary' };

                                return (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
                                                {lead.leadNo}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{lead.customerName}</span>
                                                <span className="text-xs text-muted-foreground">{lead.customerPhone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusConfig.variant as any}>
                                                {statusConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {lead.sourceChannel?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {lead.assignedSales?.name || <span className="text-muted-foreground italic">未分配</span>}
                                        </TableCell>
                                        <TableCell>
                                            {lead.createdAt ? format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/leads/${lead.id}`}>查看</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls could go here */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    共 {total} 条
                </div>
                {/* Simplified pagination for now */}
            </div>
        </div>
    );
}
