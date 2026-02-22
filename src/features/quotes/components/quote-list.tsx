'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getQuotes } from '@/features/quotes/actions/queries';
import { createQuote } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Layout from 'lucide-react/dist/esm/icons/layout';
import { format } from 'date-fns';
import { SelectCustomerDialog } from './select-customer-dialog';
import Link from 'next/link';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { logger } from '@/shared/lib/logger';

// Tab 配置：定义每个 Tab 对应的状态列表
const QUOTE_TABS = [
  { value: 'ALL', label: '全部', statuses: [] },
  { value: 'DRAFT', label: '草稿', statuses: ['DRAFT'] },
  { value: 'PENDING_APPROVAL', label: '待审批', statuses: ['PENDING_APPROVAL'] },
  { value: 'PENDING_CUSTOMER', label: '待客户确认', statuses: ['PENDING_CUSTOMER'] },
  { value: 'ACCEPTED', label: '已成交', statuses: ['ACCEPTED'] },
  { value: 'CLOSED', label: '已关闭', statuses: ['REJECTED', 'EXPIRED'] },
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

export function QuoteList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get('status') || 'ALL';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const lastLoadedTabRef = useRef<string | null>(null);

  const getStatusesForTab = useCallback((tabValue: string): string[] => {
    const tab = QUOTE_TABS.find((t) => t.value === tabValue);
    return tab?.statuses ? [...tab.statuses] : [];
  }, []);

  const loadQuotes = useCallback(async (statuses: string[], tabValue: string) => {
    if (lastLoadedTabRef.current === tabValue) {
      return;
    }
    lastLoadedTabRef.current = tabValue;

    setLoading(true);
    try {
      const { data } = await getQuotes({
        statuses: statuses.length > 0 ? statuses : undefined,
      });
      setQuotes((data as QuoteListItem[]) || []);
    } catch (error) {
      logger.error(error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const statuses = getStatusesForTab(activeTab);
    loadQuotes(statuses, activeTab);
  }, [activeTab, loadQuotes, getStatusesForTab]);

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

  const handleRefresh = useCallback(() => {
    lastLoadedTabRef.current = null;
    const statuses = getStatusesForTab(activeTab);
    loadQuotes(statuses, activeTab);
    toast.success('已刷新');
  }, [activeTab, loadQuotes, getStatusesForTab]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header Section - Tabs 和新建按钮同一行 */}
      <div className="flex items-center justify-between">
        <UrlSyncedTabs
          tabs={QUOTE_TABS}
          paramName="status"
          defaultValue="ALL"
          layoutId="quotes-status-tabs"
        />
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
            value: '',
            onChange: () => { },
            placeholder: '搜索报价单...',
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
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                      <div className="rounded-full bg-muted/50 p-6">
                        <Layout className="h-10 w-10 opacity-50" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">暂无报价单</h3>
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
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                    <TableCell>{quote.customer?.name || '-'}</TableCell>
                    <TableCell>{STATUS_LABELS[quote.status] || quote.status}</TableCell>
                    <TableCell className="text-right">¥{quote.finalAmount}</TableCell>
                    <TableCell>{quote.creator?.name || '-'}</TableCell>
                    <TableCell>
                      {quote.createdAt
                        ? format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/quotes/${quote.id}`);
                        }}
                      >
                        编辑
                      </Button>
                    </TableCell>
                  </TableRow>
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
