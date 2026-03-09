'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getQuotes } from '@/features/quotes/actions/queries';
import { createQuoteActionInternal as createQuote } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Layout from 'lucide-react/dist/esm/icons/layout';
import { format } from 'date-fns';
import { SelectCustomerDialog } from './select-customer-dialog';
import Link from 'next/link';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { DataTableToolbar } from '@/shared/ui/data-table-toolbar';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { logger } from '@/shared/lib/logger';
import { useServerActionQuery } from '@/shared/hooks/use-server-action-query';
import { useDebounce } from '@/shared/hooks/use-debounce';

// Tab 配置：定义每个 Tab 对应的状态列表
const QUOTE_TABS = [
  { value: 'ALL', title: '全部', statuses: [] },
  { value: 'DRAFT', title: '草稿', statuses: ['DRAFT'] },
  { value: 'PENDING_APPROVAL', title: '待审批', statuses: ['PENDING_APPROVAL'] },
  { value: 'PENDING_CUSTOMER', title: '待客户确认', statuses: ['PENDING_CUSTOMER'] },
  { value: 'ACCEPTED', title: '已成交', statuses: ['ACCEPTED'] },
  { value: 'CLOSED', title: '已关闭', statuses: ['REJECTED', 'EXPIRED'] },
];

// 状态显示名称映射
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  PENDING_CUSTOMER: '待客户确认',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  EXPIRED: '已过期',
};

interface QuoteListItem {
  id: string;
  quoteNo: string;
  customer?: { name?: string | null } | null;
  status: string;
  finalAmount: number | string;
  creator?: { name?: string | null } | null;
  createdAt?: string | Date | null;
  [key: string]: unknown;
}

const QuoteTableRow = React.memo(function QuoteTableRow({
  quote,
  onClick,
}: {
  quote: QuoteListItem;
  onClick: (id: string) => void;
}) {
  return (
    <TableRow key={quote.id} className="cursor-pointer" onClick={() => onClick(quote.id)}>
      <TableCell className="font-medium">{quote.quoteNo}</TableCell>
      <TableCell>{quote.customer?.name || '-'}</TableCell>
      <TableCell>{STATUS_LABELS[quote.status] || quote.status}</TableCell>
      <TableCell className="text-right">¥{quote.finalAmount}</TableCell>
      <TableCell>{quote.creator?.name || '-'}</TableCell>
      <TableCell>
        {quote.createdAt ? format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick(quote.id);
          }}
        >
          编辑
        </Button>
      </TableCell>
    </TableRow>
  );
});

export function QuoteList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const activeTab = searchParams.get('status') || 'ALL';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // URL 搜索状态管理（Next.js 原生方案）
  // 三层架构：localSearch(即时UI) → debouncedSearch(防抖) → URL ?q=(触发服务端数据刷新)
  const pathname = usePathname();
  const urlSearch = searchParams.get('q') || '';
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(localSearch, 500);

  // 防抖稳定后更新 URL（replace 不产生历史记录堆积）
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set('q', debouncedSearch);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // 根据 tab 计算对应的状态过滤条件
  const getStatusesForTab = useCallback((tabValue: string): string[] => {
    const tab = QUOTE_TABS.find((t) => t.value === tabValue);
    return tab?.statuses ? [...tab.statuses] : [];
  }, []);

  // 使用 useServerActionQuery 替代手动的 useState+useEffect+loadQuotes
  // activeTab 或 debouncedSearch 变化时 queryKey 变化，react-query 自动重新获取
  const statuses = getStatusesForTab(activeTab);
  const {
    data: quotesData,
    isLoading: loading,
    refetch,
  } = useServerActionQuery(
    // Bug 修复：将 debouncedSearch 纳入 queryKey，确保搜索变化触发重新请求
    ['quotes-list', activeTab, debouncedSearch],
    () =>
      getQuotes({
        statuses: statuses.length > 0 ? statuses : undefined,
        // Bug 修复：将防抖后的 search 传给后端（原来完全不传 search）
        search: debouncedSearch || undefined,
      }),
    {
      staleTime: 30_000, // 30 秒内数据视为新鲜，避免无意义重新请求
    }
  );

  const quotes: QuoteListItem[] = (quotesData?.data as QuoteListItem[]) ?? [];

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
      logger.error(error);
      toast.error('创建报价单失败');
    } finally {
      setCreating(false);
    }
  };

  const userId = session?.user?.id || '';
  const tenantId = session?.user?.tenantId || '';

  // 手动刷新回调，交给 react-query 的 refetch 执行
  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('已刷新');
  }, [refetch]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header Section - Tabs 和新建按钮同一行 */}
      <div className="flex items-center justify-between">
        <UrlSyncedTabs tabs={QUOTE_TABS} paramName="status" defaultValue="ALL" />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="h-9">
            <Link href="/quotes/templates">
              <Layout className="mr-2 h-4 w-4" /> 报价模板
            </Link>
          </Button>
          <Button onClick={handleCreate} disabled={creating} className="h-9">
            <Plus className="mr-2 h-4 w-4" /> 新建报价
          </Button>
        </div>
      </div>

      {/* 主内容区域 - 玻璃态容器 */}
      <div className="glass-liquid-ultra flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-white/20 p-4">
        <DataTableToolbar
          searchProps={{
            // 绑定本地即时搜索词，onChange 更新本地状态并触发防抖
            value: localSearch,
            onChange: setLocalSearch,
            placeholder: '搜索报价单号/客户名称/电话...',
          }}
          onRefresh={handleRefresh}
          loading={loading}
        >
          <div className="w-[240px]">
            <DatePickerWithRange />
          </div>
        </DataTableToolbar>

        <div className="flex-1 overflow-auto rounded-md border">
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
            <TableBody className="content-visibility-auto">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4">
                      <div className="bg-muted/50 rounded-full p-6">
                        <Layout className="h-10 w-10 opacity-50" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-foreground text-lg font-semibold">暂无报价单</h3>
                        <p className="text-sm">
                          {activeTab === 'ALL'
                            ? '当前还没有任何报价单，创建一个新的开始吧。'
                            : `在"${STATUS_LABELS[activeTab] || activeTab}"状态下暂无报价单。`}
                        </p>
                      </div>
                      <Button onClick={handleCreate} disabled={creating}>
                        <Plus className="mr-2 h-4 w-4" />
                        新建报价
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <QuoteTableRow
                    key={quote.id}
                    quote={quote}
                    onClick={(id) => router.push(`/quotes/${id}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
