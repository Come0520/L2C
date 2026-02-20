'use client';

import React, { useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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
import {
    MoreHorizontal,
    Phone,
    MessageSquare,
    FileText,
    Calendar,
    UserPlus,
    XCircle,
    RotateCcw,
    Eye
} from 'lucide-react';
import { z } from 'zod';
import { followUpTypeEnum } from '../schemas';
import { AssignLeadDialog } from './dialogs/assign-lead-dialog';
import { FollowUpDialog } from './dialogs/followup-dialog';
import { VoidLeadDialog } from './void-lead-dialog';
import { claimFromPool } from '../actions/mutations';
import { restoreLeadAction } from '../actions/restore';
import { useTransition, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { EmptyUI } from '@/shared/ui/empty-ui';
import { cn } from '@/shared/lib/utils';

// 从查询推断类型
type LeadData = Awaited<ReturnType<typeof getLeads>>['data'][number];

/**
 * 线索表格组件属性
 */
interface LeadTableProps {
    /** 线索数据列表 */
    data: LeadData[];
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 总条数 */
    total: number;
    /** 用户角色 */
    userRole?: string;
    /** 当前用户 ID */
    userId: string;
    /** 重载数据回调 */
    onReload?: () => void;
}

// 状态映射
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    'PENDING_ASSIGNMENT': { label: '待分配', variant: 'secondary' },
    'PENDING_FOLLOWUP': { label: '待跟进', variant: 'default' },
    'FOLLOWING_UP': { label: '跟进中', variant: 'default' },
    'WON': { label: '已成交', variant: 'outline' },
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

/**
 * 根据状态和权限获取可用操作
 */
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
    style?: React.CSSProperties;
    className?: string;
}

/**
 * 单行渲染组件
 */
const LeadTableRow = React.memo(function LeadTableRow({ lead, isManager, handleAction, style, className }: LeadTableRowProps) {
    const statusConfig = STATUS_MAP[lead.status || ''] || { label: lead.status || '未知', variant: 'secondary' as const };
    const intentionConfig = lead.intentionLevel ? INTENTION_MAP[lead.intentionLevel] : null;
    const actions = getActionsForStatus(lead.status || '', isManager);
    const tags = lead.tags || [];

    return (
        <TableRow style={style} className={cn("hover:bg-muted/30 transition-colors", className)}>
            <TableCell className="font-medium">
                <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
                    {lead.leadNo}
                </Link>
            </TableCell>

            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium">{lead.customerName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.customerPhone}
                    </span>
                </div>
            </TableCell>

            <TableCell>
                {intentionConfig ? (
                    <Badge variant="outline" className={cn("font-medium", intentionConfig.className)}>
                        {intentionConfig.label}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            <TableCell>
                <Badge variant={statusConfig.variant} className="font-normal">
                    {statusConfig.label}
                </Badge>
            </TableCell>

            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {tags.length > 0 ? (
                        tags.slice(0, 3).map((tag) => {
                            const systemTag = SYSTEM_TAGS[tag];
                            return (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className={cn("text-[10px] h-5 px-1.5 font-normal", systemTag?.className)}
                                >
                                    {systemTag?.label || tag}
                                </Badge>
                            );
                        })
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                    {tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                            +{tags.length - 3}
                        </Badge>
                    )}
                </div>
            </TableCell>

            <TableCell className="truncate max-w-[100px]">
                {lead.sourceChannel?.name || '-'}
            </TableCell>

            <TableCell>
                {lead.assignedSales?.name || (
                    <span className="text-muted-foreground italic text-xs">未分配</span>
                )}
            </TableCell>

            <TableCell>
                {lead.lastActivityAt ? (
                    <span className="text-xs text-muted-foreground" title={new Date(lead.lastActivityAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(lead.lastActivityAt), {
                            addSuffix: true,
                            locale: zhCN
                        })}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>

            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">操作菜单</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        {actions.map((action) => (
                            <DropdownMenuItem
                                key={action.key}
                                onClick={() => handleAction(action.key, lead.id)}
                                className={cn(
                                    "cursor-pointer",
                                    action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                )}
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

/**
 * 线索管理表格组件
 * 实现了虚拟滚动和交互动作
 */
export const LeadTable = React.memo(function LeadTable({
    data,
    page,
    pageSize,
    total,
    userRole = 'SALES',
    userId,
    onReload
}: LeadTableProps) {
    const router = useRouter();
    const isManager = useMemo(() => ['ADMIN', 'MANAGER', 'BOSS'].includes(userRole), [userRole]);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [followupType, setFollowupType] = useState<z.infer<typeof followUpTypeEnum> | undefined>(undefined);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [currentAssignedId, setCurrentAssignedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    /**
     * 处理线索相关的业务动作
     */
    const handleAction = useCallback((action: string, leadId: string) => {
        const lead = data.find(l => l.id === leadId);
        if (!lead) return;

        setSelectedLeadId(leadId);

        switch (action) {
            case 'view':
                router.push(`/leads/${leadId}`);
                break;
            case 'quote':
                router.push(`/quotes/new?leadId=${leadId}`);
                break;
            case 'followup':
                setFollowupType(undefined);
                setFollowupDialogOpen(true);
                break;
            case 'invite':
                setFollowupType('STORE_VISIT');
                setFollowupDialogOpen(true);
                break;
            case 'claim':
                if (confirm('确定要认领该线索吗？')) {
                    startTransition(async () => {
                        try {
                            const res = await claimFromPool(leadId);
                            if (res.success) {
                                toast.success('认领成功');
                                onReload?.();
                            } else {
                                toast.error(res.error || '认领失败');
                            }
                        } catch (error) {
                            console.error('Claim error:', error);
                            toast.error('认领失败');
                        }
                    });
                }
                break;
            case 'assign':
                setCurrentAssignedId(lead.assignedSales?.id || null);
                setAssignDialogOpen(true);
                break;
            case 'void':
                setVoidDialogOpen(true);
                break;
            case 'restore':
                if (confirm('确定要恢复该线索吗？')) {
                    startTransition(async () => {
                        try {
                            const res = await restoreLeadAction({ id: leadId, reason: 'Manual restore' });
                            if (res.success) {
                                toast.success('已恢复');
                                onReload?.();
                            } else {
                                toast.error(res.error || '恢复失败');
                            }
                        } catch (error) {
                            console.error('Restore error:', error);
                            toast.error('恢复失败');
                        }
                    });
                }
                break;
        }
    }, [router, data, onReload]);

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 5,
    });

    return (
        <div className="space-y-4 relative">
            {/* 全局加载遮罩 */}
            {isPending && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[2px] transition-all duration-200">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">加载中...</span>
                    </div>
                </div>
            )}

            <div
                ref={parentRef}
                className="rounded-md border overflow-auto"
                style={{ height: '600px', position: 'relative' }}
            >
                <Table style={{ display: 'grid' }}>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm" style={{ display: 'grid' }}>
                        <TableRow style={{ display: 'grid', gridTemplateColumns: '130px 150px 60px 80px 160px 100px 80px 100px 1fr' }}>
                            <TableHead>线索编号</TableHead>
                            <TableHead>客户信息</TableHead>
                            <TableHead>意向</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>标签</TableHead>
                            <TableHead>来源</TableHead>
                            <TableHead>跟进销售</TableHead>
                            <TableHead>最后活动</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            position: 'relative',
                            display: 'grid'
                        }}
                    >
                        {data.length === 0 ? (
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={9} className="h-[500px] flex items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <EmptyUI message="暂无符合条件的线索数据" />
                                        <div className="mt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push('/leads')}
                                            >
                                                重置筛选条件
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const lead = data[virtualRow.index];
                                return (
                                    <LeadTableRow
                                        key={virtualRow.key}
                                        lead={lead}
                                        isManager={isManager}
                                        handleAction={handleAction}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                            display: 'grid',
                                            gridTemplateColumns: '130px 150px 60px 80px 160px 100px 80px 100px 1fr'
                                        }}
                                    />
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 分页控件 */}
            <div className="flex items-center justify-between py-2 px-1">
                <div className="text-sm text-muted-foreground">
                    共 <span className="font-medium text-foreground">{total}</span> 条，第 <span className="font-medium text-foreground">{page}</span> 页
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={page <= 1 || isPending}
                        onClick={() => router.push(`?page=${page - 1}`)}
                    >
                        上一页
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={page * pageSize >= total || isPending}
                        onClick={() => router.push(`?page=${page + 1}`)}
                    >
                        下一页
                    </Button>
                </div>
            </div>

            {selectedLeadId && (
                <>
                    <AssignLeadDialog
                        leadId={selectedLeadId}
                        currentAssignedId={currentAssignedId}
                        open={assignDialogOpen}
                        onOpenChange={setAssignDialogOpen}
                        onSuccess={onReload}
                    />
                    <FollowUpDialog
                        leadId={selectedLeadId}
                        open={followupDialogOpen}
                        onOpenChange={setFollowupDialogOpen}
                        onSuccess={onReload}
                        initialType={followupType}
                    />
                    <VoidLeadDialog
                        leadId={selectedLeadId}
                        userId={userId}
                        open={voidDialogOpen}
                        onOpenChange={setVoidDialogOpen}
                        onSuccess={onReload}
                    />
                </>
            )}
        </div>
    );
});
