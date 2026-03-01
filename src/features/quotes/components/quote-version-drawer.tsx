'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import History from 'lucide-react/dist/esm/icons/history';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Check from 'lucide-react/dist/esm/icons/check';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { createNextVersion } from '../actions/mutations';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';

interface QuoteVersion {
  id: string;
  version: number;
  status: string;
  createdAt: Date | string;
  totalAmount?: number | string;
  finalAmount?: number | string;
}

interface QuoteVersionDrawerProps {
  currentQuoteId: string;
  currentVersion: number;
  versions: QuoteVersion[];
  onCopy?: () => void;
}

/**
 * 版本历史侧边抽屉组件
 * 使用 Dialog 实现右侧滑出效果
 */
export function QuoteVersionDrawer({
  currentQuoteId,
  currentVersion,
  versions,
  onCopy,
}: QuoteVersionDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 按版本号降序排列
  const sortedVersions = versions.toSorted((a, b) => b.version - a.version);

  const handleCreateVersion = async () => {
    setIsCreating(true);
    try {
      toast.loading('正在创建新版本...', { id: 'create-version' });
      const res = await createNextVersion({ quoteId: currentQuoteId });
      if (res?.data?.id) {
        toast.success('新版本创建成功', { id: 'create-version' });
        setOpen(false);
        router.push(`/quotes/${res.data.id}`);
      } else {
        toast.error('创建失败，请稍后重试', { id: 'create-version' });
      }
    } catch (e) {
      logger.error('[CreateVersionError]', e);
      toast.error('系统异常', { id: 'create-version' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleVersionClick = (versionId: string) => {
    if (versionId !== currentQuoteId) {
      setOpen(false);
      router.push(`/quotes/${versionId}`);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }
    > = {
      DRAFT: { label: '草稿', variant: 'secondary' },
      SUBMITTED: { label: '已提交', variant: 'default' },
      PENDING_APPROVAL: { label: '待审批', variant: 'warning' },
      PENDING_CUSTOMER: { label: '待确认', variant: 'warning' },
      ACCEPTED: { label: '已接受', variant: 'success' },
      ORDERED: { label: '已下单', variant: 'success' },
      REJECTED: { label: '已拒绝', variant: 'destructive' },
      EXPIRED: { label: '已过期', variant: 'secondary' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' as const };
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card/50 hover:bg-card border-border gap-2 shadow-sm"
        >
          <History className="text-primary h-4 w-4" />
          <span>V{currentVersion}</span>
          <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
            {versions.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right fixed top-0 right-0 bottom-0 h-full w-[400px] max-w-[400px] translate-x-0 gap-0 rounded-l-xl rounded-r-none border-l p-0 duration-300">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <History className="text-primary h-5 w-5" />
            版本历史
          </DialogTitle>
          <DialogDescription>
            共 {versions.length} 个版本，当前查看 V{currentVersion}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(100vh-220px)] flex-1">
          <div className="space-y-1 p-4">
            {sortedVersions.map((version, index) => {
              const isCurrent = version.id === currentQuoteId;
              const { label, variant } = getStatusLabel(version.status);
              const isLatest = index === 0;

              return (
                <div
                  key={version.id}
                  className={cn(
                    'group relative cursor-pointer pb-4 pl-6',
                    index < sortedVersions.length - 1 && 'border-muted ml-2 border-l-2'
                  )}
                  onClick={() => handleVersionClick(version.id)}
                >
                  {/* 时间轴节点 */}
                  <div
                    className={cn(
                      'absolute -left-[9px] flex h-5 w-5 items-center justify-center rounded-full',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                    )}
                  >
                    {isCurrent ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  </div>

                  {/* 版本卡片 */}
                  <div
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isCurrent
                        ? 'bg-primary/5 border-primary/30 shadow-sm'
                        : 'bg-card hover:bg-muted/50 border-border'
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', isCurrent && 'text-primary')}>
                          版本 {version.version}
                        </span>
                        {isLatest && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            最新
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                            当前
                          </Badge>
                        )}
                      </div>
                      <Badge variant={variant} className="text-[10px]">
                        {label}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.createdAt)}
                      </div>
                      {version.finalAmount && (
                        <span className="font-mono">
                          ¥{Number(version.finalAmount).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <div className="mt-2 flex items-center justify-end border-t border-dashed pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-primary flex items-center gap-1 text-xs">
                          查看此版本 <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="bg-background space-y-2 border-t p-4">
          <Button onClick={handleCreateVersion} disabled={isCreating} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            {isCreating ? '创建中...' : '创建新版本'}
          </Button>
          {onCopy && (
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCopy();
              }}
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              复制为新报价单
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
