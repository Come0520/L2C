'use client';

import React, { useCallback } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLeads } from '@/features/leads/actions/queries';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { toast } from 'sonner';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

// 从查询推断类型
type LeadData = Awaited<ReturnType<typeof getLeads>>['data'][number];

interface LeadTableProps {
    data: LeadData[];
    page: number;
    pageSize: number;
    total: number;
    userRole?: string;
    onPageChange?: (page: number) => void;
}

// 状态映射
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    'PENDING_ASSIGNMENT': { label: '待分配', variant: 'secondary' },
    'PENDING_FOLLOWUP': { label: '待跟进', variant: 'default' },
    'FOLLOWING_UP': { label: '跟进中', variant: 'default' },
    'WON': { label: '已成交', variant: 'outline' },
    'VOID': { label: '已作废', variant: 'destructive' },
    'INVALID': { label: '无效', variant: 'destructive' },
};

// 意向等级映射
const INTENTION_MAP: Record<string, { label: string; className: string }> = {
    'HIGH': { label: '高', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    'MEDIUM': { label: '中', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    'LOW': { label: '低', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

// 系统标签映射
const SYSTEM_TAGS: Record<string, { label: string; className: string }> = {
    'INVITED': { label: '已邀约', className: 'bg-blue-100 text-blue-700' },
    'QUOTED': { label: '已报价', className: 'bg-green-100 text-green-700' },
    'VISITED': { label: '已到店', className: 'bg-purple-100 text-purple-700' },
    'MEASURED': { label: '已测量', className: 'bg-orange-100 text-orange-700' },
};

// 根据状态获取可用操作
function getActionsForStatus(status: string, isManager: boolean) {
    const actions: Array<{ key: string; label: string; icon: React.ReactNode; variant?: 'destructive' }> = [];

    switch (status) {
        case 'PENDING_ASSIGNMENT':
            actions.push({ key: 'claim', label: '认领', icon: <UserPlus className="mr-2 h-4 w-4" /> });
            if (isManager) {
                actions.push({ key: 'assign', label: '分配', icon: <UserPlus className="mr-2 h-4 w-4" /> });
            }
            actions.push({ key: 'void', label: '无效', icon: <XCircle className="mr-2 h-4 w-4" />, variant: 'destructive' });
            break;
        case 'PENDING_FOLLOWUP':
            actions.push({ key: 'followup', label: '跟进', icon: <MessageSquare className="mr-2 h-4 w-4" /> });
            actions.push({ key: 'void', label: '无效', icon: <XCircle className="mr-2 h-4 w-4" />, variant: 'destructive' });
            break;
        case 'FOLLOWING_UP':
            actions.push({ key: 'quote', label: '报价', icon: <FileText className="mr-2 h-4 w-4" /> });
            actions.push({ key: 'followup', label: '跟进', icon: <MessageSquare className="mr-2 h-4 w-4" /> });
            actions.push({ key: 'invite', label: '邀约', icon: <Calendar className="mr-2 h-4 w-4" /> });
            actions.push({ key: 'void', label: '无效', icon: <XCircle className="mr-2 h-4 w-4" />, variant: 'destructive' });
            break;
        case 'WON':
            actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
            break;
        case 'VOID':
        case 'INVALID':
            if (isManager) {
                actions.push({ key: 'restore', label: '恢复', icon: <RotateCcw className="mr-2 h-4 w-4" /> });
            }
            actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
            break;
        default:
            actions.push({ key: 'view', label: '查看', icon: <Eye className="mr-2 h-4 w-4" /> });
    }

    return actions;
}

interface LeadTableRowProps {
    lead: LeadData;
    isManager: boolean;
    handleAction: (action: string, leadId: string) => void;
}

const LeadTableRow = React.memo(function LeadTableRow({ lead, isManager, handleAction }: LeadTableRowProps) {
    const statusConfig = STATUS_MAP[lead.status || ''] || { label: lead.status || '未知', variant: 'secondary' as const };
    const intentionConfig = lead.intentionLevel ? INTENTION_MAP[lead.intentionLevel] : null;
    const actions = getActionsForStatus(lead.status || '', isManager);
    const tags = lead.tags || [];

    return (
        <TableRow>
            {/* 线索编号 */}
            <TableCell className="font-medium">
                <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
                    {lead.leadNo}
                </Link>
            </TableCell>

            {/* 客户信息 */}
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{lead.customerName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.customerPhone}
                    </span>
                </div>
            </TableCell>

            {/* 意向等级 */}
            <TableCell>
                {intentionConfig ? (
                    <Badge variant="outline" className={intentionConfig.className}>
                        {intentionConfig.label}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            {/* 状态 */}
            <TableCell>
                <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                </Badge>
            </TableCell>

            {/* 标签 */}
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {tags.length > 0 ? (
                        tags.slice(0, 3).map((tag) => {
                            const systemTag = SYSTEM_TAGS[tag];
                            return (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className={`text-xs ${systemTag?.className || ''}`}
                                >
                                    {systemTag?.label || tag}
                                </Badge>
                            );
                        })
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                    {tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{tags.length - 3}
                        </Badge>
                    )}
                </div>
            </TableCell>

            {/* 来源 */}
            <TableCell>
                {lead.sourceChannel?.name || '-'}
            </TableCell>

            {/* 跟进销售 */}
            <TableCell>
                {lead.assignedSales?.name || (
                    <span className="text-muted-foreground italic">未分配</span>
                )}
            </TableCell>

            {/* 最后活动 */}
            <TableCell>
                {lead.lastActivityAt ? (
                    <span className="text-sm" title={new Date(lead.lastActivityAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(lead.lastActivityAt), {
                            addSuffix: true,
                            locale: zhCN
                        })}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            {/* 操作 */}
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">操作菜单</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {actions.map((action) => (
                            <DropdownMenuItem
                                key={action.key}
                                onClick={() => handleAction(action.key, lead.id)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                            >
                                {action.icon}
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

export const LeadTable = React.memo(function LeadTable({
    data,
    page,
    pageSize,
    total,
    userRole = 'SALES'
}: LeadTableProps) {
    const router = useRouter();
    const isManager = ['ADMIN', 'MANAGER', 'BOSS'].includes(userRole);

    // 处理操作点击
    const handleAction = useCallback((action: string, leadId: string) => {
        switch (action) {
            case 'view':
                router.push(`/leads/${leadId}`);
                break;
            case 'quote':
                router.push(`/quotes/new?leadId=${leadId}`);
                break;
            case 'followup':
                // TODO: 打开跟进弹窗
                toast.info('跟进功能开发中');
                break;
            case 'invite':
                // TODO: 打开邀约弹窗
                toast.info('邀约功能开发中');
                break;
            case 'claim':
                // TODO: 认领线索
                toast.info('认领功能开发中');
                break;
            case 'assign':
                // TODO: 分配线索
                toast.info('分配功能开发中');
                break;
            case 'void':
                // TODO: 作废线索
                toast.info('作废功能开发中');
                break;
            case 'restore':
                // TODO: 恢复线索
                toast.info('恢复功能开发中');
                break;
        }
    }, [router]);

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead style={{ width: 130 }}>线索编号</TableHead>
                            <TableHead style={{ width: 150 }}>客户信息</TableHead>
                            <TableHead style={{ width: 60 }}>意向</TableHead>
                            <TableHead style={{ width: 80 }}>状态</TableHead>
                            <TableHead style={{ width: 160 }}>标签</TableHead>
                            <TableHead style={{ width: 100 }}>来源</TableHead>
                            <TableHead style={{ width: 80 }}>跟进销售</TableHead>
                            <TableHead style={{ width: 100 }}>最后活动</TableHead>
                            <TableHead style={{ width: 150 }} className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <EmptyTableRow colSpan={9} message="暂无数据" />
                        ) : (
                            data.map((lead) => (
                                <LeadTableRow
                                    key={lead.id}
                                    lead={lead}
                                    isManager={isManager}
                                    handleAction={handleAction}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 分页控件 */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    共 {total} 条，第 {page} 页
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => router.push(`?page=${page - 1}`)}
                    >
                        上一页
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page * pageSize >= total}
                        onClick={() => router.push(`?page=${page + 1}`)}
                    >
                        下一页
                    </Button>
                </div>
            </div>
        </div>
    );
});
