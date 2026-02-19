'use client';

import React, { useCallback } from 'react';
import { PackageOpen } from 'lucide-react';
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

// 从查询推断类型
type LeadData = Awaited<ReturnType<typeof getLeads>>['data'][number];

interface LeadTableProps {
    data: LeadData[];
    page: number;
    pageSize: number;
    total: number;
    userRole?: string;
    userId: string;
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

const LeadTableRow = React.memo(function LeadTableRow(props: LeadTableRowProps) {
    const { lead, isManager, handleAction, style, className } = props;
    const statusConfig = STATUS_MAP[lead.status || ''] || { label: lead.status || '未知', variant: 'secondary' as const };
    const intentionConfig = lead.intentionLevel ? INTENTION_MAP[lead.intentionLevel] : null;
    const actions = getActionsForStatus(lead.status || '', isManager);
    const tags = lead.tags || [];

    return (
        <TableRow style={style} className={className}>
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
    userRole = 'SALES',
    userId,
    onReload
}: LeadTableProps) {
    const router = useRouter();
    const isManager = ['ADMIN', 'MANAGER', 'BOSS'].includes(userRole);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [followupType, setFollowupType] = useState<z.infer<typeof followUpTypeEnum> | undefined>(undefined);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [currentAssignedId, setCurrentAssignedId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    // 处理操作点击
    // 处理操作点击
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
        estimateSize: () => 64, // 估算每行高度
        overscan: 5,
    });

    return (
        <div className="space-y-4">
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
                            <TableRow>
                                <TableCell colSpan={9} className="h-[400px] text-center">
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="bg-muted/30 p-6 rounded-full mb-4">
                                            <PackageOpen className="w-12 h-12 text-muted-foreground opacity-20" />
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight">未找到线索</h3>
                                        <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                                            当前的筛选列表中没有数据。这可能是因为尚未录入线索，或者当前的搜索/筛选条件过于严格。
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
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
