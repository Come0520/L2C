'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { getQuotes } from '@/features/quotes/actions/queries';
import { createQuote } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Layout from 'lucide-react/dist/esm/icons/layout';
import { format } from 'date-fns';
import { SelectCustomerDialog } from './select-customer-dialog';
import Link from 'next/link';

// Tab 配置：定义每个 Tab 对应的状态列表
const QUOTE_TABS = [
    { value: 'ALL', label: '全部', statuses: [] },
    { value: 'DRAFT', label: '草稿', statuses: ['DRAFT'] },
    { value: 'PENDING_APPROVAL', label: '待审批', statuses: ['PENDING_APPROVAL'] },
    { value: 'PENDING_CUSTOMER', label: '待客户确认', statuses: ['PENDING_CUSTOMER'] },
    { value: 'ACCEPTED', label: '已成交', statuses: ['ACCEPTED'] },
    { value: 'CLOSED', label: '已关闭', statuses: ['REJECTED', 'EXPIRED'] },
] as const;

// 状态显示名称映射
const STATUS_LABELS: Record<string, string> = {
    'DRAFT': '草稿',
    'PENDING_APPROVAL': '待审批',
    'PENDING_CUSTOMER': '待客户确认',
    'ACCEPTED': '已接受',
    'REJECTED': '已拒绝',
    'EXPIRED': '已过期',
};

export function QuoteList() {
    const router = useRouter();
    const { data: session } = useSession();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // 当前选中的 Tab
    const [activeTab, setActiveTab] = useState<string>('ALL');
    // 控制客户选择弹窗
    const [dialogOpen, setDialogOpen] = useState(false);
    // 创建报价单的加载状态
    const [creating, setCreating] = useState(false);

    // 根据 Tab 获取对应的状态列表
    const getStatusesForTab = useCallback((tabValue: string): string[] => {
        const tab = QUOTE_TABS.find(t => t.value === tabValue);
        return tab?.statuses ? [...tab.statuses] : [];
    }, []);

    // 加载报价单列表
    const loadQuotes = useCallback(async (statuses: string[]) => {
        setLoading(true);
        try {
            const { data } = await getQuotes({
                statuses: statuses.length > 0 ? statuses : undefined
            });
            setQuotes(data || []);
        } catch (error) {
            console.error(error);
            toast.error('加载失败');
        } finally {
            setLoading(false);
        }
    }, []);

    // 当 Tab 切换时重新加载数据
    useEffect(() => {
        const statuses = getStatusesForTab(activeTab);
        loadQuotes(statuses);
    }, [activeTab, loadQuotes, getStatusesForTab]);

    // Tab 切换处理
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    /**
     * 点击新建报价按钮，打开客户选择弹窗
     */
    const handleCreate = () => {
        setDialogOpen(true);
    };

    /**
     * 客户选择确认后，创建报价单
     */
    const handleCustomerSelected = async (customerId: string) => {
        setCreating(true);
        try {
            const result = await createQuote({ customerId });
            if (result.data) {
                toast.success('报价单创建成功');
                setDialogOpen(false);
                // 跳转到报价单详情页
                router.push(`/quotes/${result.data.id}`);
            } else if (result.error) {
                toast.error(`创建失败: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('创建报价单失败');
        } finally {
            setCreating(false);
        }
    };

    // 获取用户和租户 ID
    const userId = session?.user?.id || '';
    const tenantId = session?.user?.tenantId || '';

    return (
        <div className="space-y-4 p-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">报价单</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/quotes/templates">
                            <Layout className="mr-2 h-4 w-4" /> 报价模板
                        </Link>
                    </Button>
                    <Button onClick={handleCreate} disabled={creating}>
                        <Plus className="mr-2 h-4 w-4" /> 新建报价
                    </Button>
                </div>
            </div>

            {/* 状态 Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    {QUOTE_TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
                <Input placeholder="搜索报价单..." className="max-w-[300px]" />
                <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>报价单号</TableHead>
                            <TableHead>客户</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">总金额</TableHead>
                            <TableHead>创建人</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">加载中...</TableCell>
                            </TableRow>
                        ) : quotes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">暂无报价单</TableCell>
                            </TableRow>
                        ) : (
                            quotes.map((quote) => (
                                <TableRow key={quote.id} className="cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                                    <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                                    <TableCell>{quote.customer?.name || '-'}</TableCell>
                                    <TableCell>{STATUS_LABELS[quote.status] || quote.status}</TableCell>
                                    <TableCell className="text-right">¥{quote.finalAmount}</TableCell>
                                    <TableCell>{quote.creator?.name || '-'}</TableCell>
                                    <TableCell>{quote.createdAt ? format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/quotes/${quote.id}`); }}>编辑</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 客户选择弹窗 */}
            <SelectCustomerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={handleCustomerSelected}
                userId={userId}
                tenantId={tenantId}
            />
        </div>
    );
}

