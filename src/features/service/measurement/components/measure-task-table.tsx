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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { MoreHorizontal, Calendar, User, MapPin } from 'lucide-react';
import { MEASURE_STATUS_LABELS, type MeasureTask, type MeasureTaskStatus } from '../types';
import { format } from 'date-fns';
import Link from 'next/link';
import { DispatchDialog } from './dispatch-dialog';
import { useState } from 'react';

interface MeasureTaskTableProps {
    data: MeasureTask[];
}

export function MeasureTaskTable({ data }: MeasureTaskTableProps) {
    const [selectedTask, setSelectedTask] = useState<MeasureTask | null>(null);
    const [dispatchOpen, setDispatchOpen] = useState(false);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>测量单号</TableHead>
                        <TableHead>客户信息</TableHead>
                        <TableHead>地址</TableHead>
                        <TableHead>测量师</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>预约时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                暂无测量任务
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/service/measurement/${item.id}`} className="hover:underline text-primary">
                                        {item.measureNo}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{item.customer?.name}</span>
                                        <span className="text-xs text-muted-foreground">{item.customer?.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={item.lead?.address || item.lead?.community || '-'}>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span>{item.lead?.community} {item.lead?.address}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.assignedWorker ? (
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            <span>{item.assignedWorker.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">未分配</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={item.status as MeasureTaskStatus} />
                                </TableCell>
                                <TableCell>
                                    {item.scheduledAt ? (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            <span>{format(new Date(item.scheduledAt), 'yyyy-MM-dd HH:mm')}</span>
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/service/measurement/${item.id}`}>查看详情</Link>
                                            </DropdownMenuItem>

                                            {item.status === 'PENDING' && (
                                                <DropdownMenuItem onSelect={() => {
                                                    setSelectedTask(item);
                                                    setDispatchOpen(true);
                                                }}>
                                                    指派师傅
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {selectedTask && (
                <DispatchDialog
                    open={dispatchOpen}
                    onOpenChange={setDispatchOpen}
                    taskId={selectedTask.id}
                    taskNo={selectedTask.measureNo}
                    defaultScheduledAt={selectedTask.scheduledAt ? new Date(selectedTask.scheduledAt) : undefined}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: MeasureTaskStatus }) {
    const label = MEASURE_STATUS_LABELS[status] || status;
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

    switch (status) {
        case 'PENDING': variant = 'secondary'; break;
        case 'DISPATCHING': variant = 'secondary'; break;
        case 'PENDING_VISIT': variant = 'default'; break; // Highlight active task
        case 'PENDING_CONFIRM': variant = 'destructive'; break; // Needs attention
        case 'COMPLETED': variant = 'outline'; break;
        case 'CANCELLED': variant = 'outline'; break;
    }

    return <Badge variant={variant}>{label}</Badge>;
}
