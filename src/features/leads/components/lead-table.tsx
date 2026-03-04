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
import { claimFromPool } from '../actions/mutations';
import { restoreLeadAction } from '../actions/restore';
import { useTransition, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { EmptyUI } from '@/shared/ui/empty-ui';
import { cn } from '@/shared/lib/utils';

import { LeadData } from './lead-table-constants';
import { LeadTableRow } from './lead-table-row';

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

  // 响应式布局列定义
  // Tailwind breakpoint: sm(640), md(768), lg(1024), xl(1280)
  const gridColsBasis =
    'grid-cols-[100px_1fr_80px_50px] sm:grid-cols-[100px_1fr_80px_80px_50px] md:grid-cols-[130px_150px_60px_80px_80px_100px_50px] lg:grid-cols-[130px_150px_60px_80px_160px_80px_100px_50px] xl:grid-cols-[130px_150px_60px_80px_160px_100px_80px_100px_50px]';

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
        className="bg-card overflow-x-hidden overflow-y-auto rounded-md border"
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
                return (
                  <LeadTableRow
                    key={virtualRow.key}
                    lead={lead}
                    isManager={isManager}
                    handleAction={handleAction}
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
    </div>
  );
});
