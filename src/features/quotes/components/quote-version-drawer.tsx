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
import X from 'lucide-react/dist/esm/icons/x';
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
    onCopy
}: QuoteVersionDrawerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // 按版本号降序排列
    const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

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
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }> = {
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
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-card/50 hover:bg-card shadow-sm border-border"
                >
                    <History className="h-4 w-4 text-primary" />
                    <span>V{currentVersion}</span>
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                        {versions.length}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent
                className="fixed right-0 top-0 bottom-0 h-full w-[400px] max-w-[400px] translate-x-0 rounded-l-xl rounded-r-none border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300 p-0 gap-0"
            >
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        版本历史
                    </DialogTitle>
                    <DialogDescription>
                        共 {versions.length} 个版本，当前查看 V{currentVersion}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
                    <div className="p-4 space-y-1">
                        {sortedVersions.map((version, index) => {
                            const isCurrent = version.id === currentQuoteId;
                            const { label, variant } = getStatusLabel(version.status);
                            const isLatest = index === 0;

                            return (
                                <div
                                    key={version.id}
                                    className={cn(
                                        "relative pl-6 pb-4 cursor-pointer group",
                                        index < sortedVersions.length - 1 && "border-l-2 border-muted ml-2"
                                    )}
                                    onClick={() => handleVersionClick(version.id)}
                                >
                                    {/* 时间轴节点 */}
                                    <div className={cn(
                                        "absolute -left-[9px] w-5 h-5 rounded-full flex items-center justify-center",
                                        isCurrent
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                                    )}>
                                        {isCurrent ? (
                                            <Check className="w-3 h-3" />
                                        ) : (
                                            <FileText className="w-3 h-3" />
                                        )}
                                    </div>

                                    {/* 版本卡片 */}
                                    <div className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        isCurrent
                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                            : "bg-card hover:bg-muted/50 border-border"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold text-sm",
                                                    isCurrent && "text-primary"
                                                )}>
                                                    版本 {version.version}
                                                </span>
                                                {isLatest && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        最新
                                                    </Badge>
                                                )}
                                                {isCurrent && (
                                                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                                        当前
                                                    </Badge>
                                                )}
                                            </div>
                                            <Badge variant={variant} className="text-[10px]">
                                                {label}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(version.createdAt)}
                                            </div>
                                            {version.finalAmount && (
                                                <span className="font-mono">
                                                    ¥{Number(version.finalAmount).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {!isCurrent && (
                                            <div className="mt-2 pt-2 border-t border-dashed flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs text-primary flex items-center gap-1">
                                                    查看此版本 <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t space-y-2 bg-background">
                    <Button
                        onClick={handleCreateVersion}
                        disabled={isCreating}
                        className="w-full gap-2"
                    >
                        <Plus className="w-4 h-4" />
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
                            <Copy className="w-4 h-4" />
                            复制为新报价单
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
