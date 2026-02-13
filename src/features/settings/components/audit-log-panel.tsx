'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Loader2, Search, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuditLogsAction } from '@/features/settings/actions/audit-logs';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 审计日志面板
 * [Settings-03] 操作日志查看
 */

type AuditLog = {
    id: string;
    tableName: string;
    recordId: string;
    action: string;
    userId: string | null;
    userName: string | null;
    changedFields: unknown;
    oldValues: unknown;
    newValues: unknown;
    createdAt: Date;
};

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    CREATE: { label: '创建', variant: 'default' },
    UPDATE: { label: '更新', variant: 'outline' },
    DELETE: { label: '删除', variant: 'destructive' },
};

const TABLE_LABELS: Record<string, string> = {
    leads: '线索',
    quotes: '报价单',
    orders: '订单',
    customers: '客户',
    products: '产品',
    users: '用户',
    approvals: '审批',
    measurements: '测量',
    installations: '安装',
};

export function AuditLogPanel() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [isPending, startTransition] = useTransition();

    const loadLogs = useCallback(() => {
        startTransition(async () => {
            const result = await getAuditLogsAction({
                page,
                pageSize: 20,
                action: actionFilter !== 'all' ? actionFilter as 'CREATE' | 'UPDATE' | 'DELETE' : undefined,
                search: search || undefined,
            });

            if (result && 'logs' in result) {
                setLogs(result.logs as AuditLog[]);
                // 使用类型断言访问 pagination 属性
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setHasMore((result as any).pagination?.hasMore ?? false);
            }
        });
    }, [page, actionFilter, search]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const handleSearch = () => {
        setPage(1);
        loadLogs();
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>操作日志</CardTitle>
                        <CardDescription>查看系统操作记录和数据变更历史</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadLogs} disabled={isPending}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                        刷新
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 筛选区域 */}
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索表名或记录ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-32">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="操作类型" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="CREATE">创建</SelectItem>
                            <SelectItem value="UPDATE">更新</SelectItem>
                            <SelectItem value="DELETE">删除</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch} disabled={isPending}>
                        搜索
                    </Button>
                </div>

                {/* 日志表格 */}
                <ScrollArea className="h-[500px] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">时间</TableHead>
                                <TableHead className="w-24">操作</TableHead>
                                <TableHead className="w-28">数据表</TableHead>
                                <TableHead>记录ID</TableHead>
                                <TableHead className="w-28">操作人</TableHead>
                                <TableHead>变更内容</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPending && logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        暂无操作日志
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map(log => {
                                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'secondary' as const };
                                    const tableLabel = TABLE_LABELS[log.tableName] || log.tableName;
                                    const changedFields = log.changedFields as Record<string, unknown> | null;

                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: zhCN })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{tableLabel}</TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-[150px]" title={log.recordId}>
                                                {log.recordId.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell>{log.userName || '-'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {changedFields ? (
                                                    <span className="truncate max-w-[200px] inline-block">
                                                        {Object.keys(changedFields).slice(0, 3).join(', ')}
                                                        {Object.keys(changedFields).length > 3 && '...'}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                {/* 分页 */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        第 {page} 页
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isPending}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || isPending}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
