'use client';

import { logger } from '@/shared/lib/logger';
import React, { useCallback, useMemo } from 'react';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { followUpTypeEnum } from '../schemas';
import { AssignLeadDialog } from './dialogs/assign-lead-dialog';
import { FollowUpDialog } from './dialogs/followup-dialog';
import { VoidLeadDialog } from './void-lead-dialog';
import { claimFromPool, assignLead, voidLead, releaseToPool } from '../actions/mutations';
import { getSalesUsers } from '../actions/queries';
import { restoreLeadAction } from '../actions/restore';
import { useTransition, useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { EmptyUI } from '@/shared/ui/empty-ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

import { LeadData } from './lead-table-constants';
import { LeadTableRow } from './lead-table-row';
import { LeadMobileCard } from './lead-mobile-card';

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
  onReload,
}: LeadTableProps) {
  const router = useRouter();
  const isManager = useMemo(() => ['ADMIN', 'MANAGER', 'ADMIN'].includes(userRole), [userRole]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [followupType, setFollowupType] = useState<z.infer<typeof followUpTypeEnum> | undefined>(
    undefined
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [currentAssignedId, setCurrentAssignedId] = useState<string | null>(null);
  const [selectedLeadCreatorId, setSelectedLeadCreatorId] = useState<string | null>(null);
  const [selectedLeadCreatorName, setSelectedLeadCreatorName] = useState<string | null>(null);
  const [selectedLeadNotes, setSelectedLeadNotes] = useState<string | null>(null);
  const [selectedLeadCustomerName, setSelectedLeadCustomerName] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Bulk Actions State
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkReturnOpen, setBulkReturnOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkSalesId, setBulkSalesId] = useState('');
  const [bulkReturnReason, setBulkReturnReason] = useState('');
  const [bulkSalesList, setBulkSalesList] = useState<{ id: string; name: string }[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    if (bulkAssignOpen && bulkSalesList.length === 0) {
      setLoadingSales(true);
      getSalesUsers().then((users) => {
        setBulkSalesList(users);
        setLoadingSales(false);
      });
    }
  }, [bulkAssignOpen, bulkSalesList.length]);

  const handleBulkAssign = () => {
    if (!bulkSalesId) return toast.warning('请选择销售');
    startTransition(async () => {
      let success = 0;
      for (const id of selectedLeadIds) {
        const res = await assignLead({ id, salesId: bulkSalesId });
        if (res.success) success++;
      }
      toast.success(`成功分配 ${success} 条线索`);
      setBulkAssignOpen(false);
      setSelectedLeadIds([]);
      onReload?.();
    });
  };

  const handleBulkReturn = () => {
    startTransition(async () => {
      let success = 0;
      for (const id of selectedLeadIds) {
        const lead = data.find((l) => l.id === id);
        const res = await releaseToPool({ id, version: lead?.version });
        if (res.success) success++;
      }
      toast.success(`成功退回 ${success} 条线索`);
      setBulkReturnOpen(false);
      setSelectedLeadIds([]);
      onReload?.();
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      let success = 0;
      for (const id of selectedLeadIds) {
        const lead = data.find((l) => l.id === id);
        const res = await voidLead({ id, reason: '批量删除', version: lead?.version });
        if (res.success) success++;
      }
      toast.success(`成功删除 ${success} 条线索`);
      setBulkDeleteOpen(false);
      setSelectedLeadIds([]);
      onReload?.();
    });
  };

  // 响应式布局列定义
  // Tailwind breakpoint: sm(640), md(768), lg(1024), xl(1280)
  const gridColsBasis =
    'grid-cols-[40px_100px_1fr_80px_50px] sm:grid-cols-[40px_100px_1fr_80px_80px_50px] md:grid-cols-[40px_130px_150px_60px_80px_80px_100px_50px] lg:grid-cols-[40px_130px_150px_60px_80px_160px_80px_100px_50px] xl:grid-cols-[40px_130px_150px_60px_80px_160px_100px_80px_100px_50px]';

  /**
   * 处理单行/全选复选框
   */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedLeadIds(data.map((lead) => lead.id));
      } else {
        setSelectedLeadIds([]);
      }
    },
    [data]
  );

  const handleToggleSelect = useCallback((leadId: string, checked: boolean) => {
    setSelectedLeadIds((prev) =>
      checked ? [...prev, leadId] : prev.filter((id) => id !== leadId)
    );
  }, []);

  /**
   * 处理线索相关的业务动作
   */
  const handleAction = useCallback(
    (action: string, leadId: string) => {
      const lead = data.find((l) => l.id === leadId);
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
                const res = await claimFromPool({ id: leadId, version: lead.version });
                if (res.success) {
                  toast.success('认领成功');
                  onReload?.();
                } else {
                  toast.error(res.error || '认领失败');
                }
              } catch (error) {
                logger.error('Claim error:', error);
                toast.error('认领失败');
              }
            });
          }
          break;
        case 'assign':
          setCurrentAssignedId(lead.assignedSales?.id || null);
          setSelectedLeadCreatorId(lead.createdBy || null);
          setSelectedLeadCreatorName((lead as any).creator?.name || null);
          setSelectedLeadNotes(lead.notes || null);
          setSelectedLeadCustomerName(lead.customerName);
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
                logger.error('Restore error:', error);
                toast.error('恢复失败');
              }
            });
          }
          break;
      }
    },
    [router, data, onReload]
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div className="relative space-y-4">
      {/* 全局加载遮罩 */}
      {isPending && (
        <div className="bg-background/60 animate-in fade-in absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs transition-all duration-300">
          <div className="bg-card animate-in zoom-in-95 flex flex-col items-center gap-3 rounded-xl border p-6 shadow-xl">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              正在同步数据...
            </span>
          </div>
        </div>
      )}

      <div
        ref={parentRef}
        className="bg-card hidden overflow-x-hidden overflow-y-auto rounded-md border md:block"
        style={{ height: '600px', position: 'relative' }}
      >
        <Table className="grid min-w-full">
          <TableHeader
            className="bg-background/95 sticky top-0 z-10 border-b shadow-sm backdrop-blur-sm"
            style={{ display: 'grid' }}
          >
            <TableRow
              className={cn('grid auto-cols-min items-center hover:bg-transparent', gridColsBasis)}
            >
              <TableHead className="flex items-center justify-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={data.length > 0 && selectedLeadIds.length === data.length}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate =
                        selectedLeadIds.length > 0 && selectedLeadIds.length < data.length;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="flex items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs">
                线索编号
              </TableHead>
              <TableHead className="flex items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs">
                客户信息
              </TableHead>
              <TableHead className="hidden items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs md:flex">
                意向
              </TableHead>
              <TableHead className="flex items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs">
                状态
              </TableHead>
              <TableHead className="hidden items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs lg:flex">
                标签
              </TableHead>
              <TableHead className="hidden items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs xl:flex">
                来源
              </TableHead>
              <TableHead className="hidden items-center text-[11px] font-bold tracking-wider uppercase sm:flex sm:text-xs">
                销售
              </TableHead>
              <TableHead className="hidden items-center text-[11px] font-bold tracking-wider uppercase sm:text-xs md:flex">
                活动
              </TableHead>
              <TableHead className="flex items-center justify-end text-[11px] font-bold tracking-wider uppercase sm:text-xs">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className="content-visibility-auto grid"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {data.length === 0 ? (
              <TableRow className="absolute inset-0 border-none hover:bg-transparent">
                <TableCell className="flex h-[500px] w-full items-center justify-center">
                  <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center duration-500">
                    <EmptyUI message="暂无符合条件的线索数据" />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/leads')}
                        className="rounded-full shadow-sm transition-all hover:shadow-md"
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
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <LeadTableRow
                    key={virtualRow.key}
                    lead={lead}
                    isManager={isManager}
                    handleAction={handleAction}
                    isSelected={isSelected}
                    onToggleSelect={handleToggleSelect}
                    className={gridColsBasis}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                    }}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片流视图 (Mobile View) */}
      <div
        className="block space-y-3 overflow-y-auto pb-2 md:hidden"
        style={{ maxHeight: '600px' }}
      >
        {data.length === 0 ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center duration-500">
              <EmptyUI message="暂无符合条件的线索数据" />
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/leads')}
                  className="rounded-full shadow-sm transition-all hover:shadow-md"
                >
                  重置筛选条件
                </Button>
              </div>
            </div>
          </div>
        ) : (
          data.map((lead) => (
            <LeadMobileCard
              key={lead.id}
              lead={lead}
              isManager={isManager}
              handleAction={handleAction}
            />
          ))
        )}
      </div>

      {/* 分页控件 */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="text-muted-foreground text-sm">
          共 <span className="text-foreground font-medium">{total}</span> 条，第{' '}
          <span className="text-foreground font-medium">{page}</span> 页
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
            createdById={selectedLeadCreatorId}
            createdByName={selectedLeadCreatorName}
            notes={selectedLeadNotes}
            customerName={selectedLeadCustomerName}
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

      {/* 批量操作浮动栏 */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-background/95 animate-in slide-in-from-bottom-5 fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border px-6 py-3 shadow-xl">
          <span className="text-sm font-medium">已选择 {selectedLeadIds.length} 项</span>
          <div className="flex items-center gap-2 border-l pl-4">
            <Button size="sm" variant="outline" onClick={() => setBulkAssignOpen(true)}>
              批量分配
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkReturnOpen(true)}>
              批量退回
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              批量删除
            </Button>
          </div>
        </div>
      )}

      {/* 批量操作对话框 */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>批量分配线索</DialogTitle>
            <DialogDescription>
              将选中的 {selectedLeadIds.length} 条线索分配给指定的销售人员
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={bulkSalesId}
              onValueChange={setBulkSalesId}
              disabled={loadingSales || isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSales ? '加载中...' : '选择销售...'} />
              </SelectTrigger>
              <SelectContent>
                {bulkSalesList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)} disabled={isPending}>
              取消
            </Button>
            <Button onClick={handleBulkAssign} disabled={isPending || loadingSales || !bulkSalesId}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkReturnOpen} onOpenChange={setBulkReturnOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>批量退回线索</DialogTitle>
            <DialogDescription>
              将选中的 {selectedLeadIds.length} 条线索释放到公海池
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="测试退回原因（选填）"
              value={bulkReturnReason}
              onChange={(e) => setBulkReturnReason(e.target.value)}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkReturnOpen(false)} disabled={isPending}>
              取消
            </Button>
            <Button onClick={handleBulkReturn} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>批量删除线索</DialogTitle>
            <DialogDescription>
              确认删除选定的 {selectedLeadIds.length} 条线索吗？此操作不可逆。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={isPending}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
