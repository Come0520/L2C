'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import History from 'lucide-react/dist/esm/icons/history';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Check from 'lucide-react/dist/esm/icons/check';
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

interface QuoteVersionDropdownProps {
    currentQuoteId: string;
    currentVersion: number;
    versions: QuoteVersion[];
    onCopy?: () => void;
}

export function QuoteVersionDropdown({
    currentQuoteId,
    currentVersion,
    versions,
    onCopy,
}: QuoteVersionDropdownProps) {
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
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-card/50 hover:bg-card shadow-sm border-border"
                >
                    <History className="h-4 w-4 text-primary" />
                    <span>V{currentVersion}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px] p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <span className="flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        版本选择与管理
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 font-normal">
                        共 {versions.length} 个版本
                    </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                <ScrollArea className="h-fit max-h-[300px]">
                    <div className="p-1">
                        {sortedVersions.map((version, index) => {
                            const isCurrent = version.id === currentQuoteId;
                            const { label, variant } = getStatusLabel(version.status);
                            const isLatest = index === 0;

                            return (
                                <DropdownMenuItem
                                    key={version.id}
                                    onClick={() => handleVersionClick(version.id)}
                                    className={cn(
                                        'flex items-start justify-between p-2 mb-1 rounded-md cursor-pointer group',
                                        isCurrent ? 'bg-primary/5 focus:bg-primary/10' : 'hover:bg-muted focus:bg-muted'
                                    )}
                                    disabled={isCurrent} // 禁止点击当前选中的版本
                                >
                                    <div className="flex gap-2">
                                        <div className="mt-0.5 w-4 flex justify-center flex-shrink-0">
                                            {isCurrent ? (
                                                <Check className="w-4 h-4 text-primary" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 group-hover:bg-primary/50" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn('text-sm font-medium', isCurrent && 'text-primary/90')}
                                                >
                                                    版本 {version.version}
                                                </span>
                                                <Badge variant={variant} className="text-[10px] px-1 py-0 h-4 font-normal">
                                                    {label}
                                                </Badge>
                                                {isLatest && !isCurrent && (
                                                    <span className="text-[10px] font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 px-1 rounded-sm">
                                                        最新
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="text-[10px] font-medium text-primary border border-primary/20 bg-primary/5 px-1 rounded-sm">
                                                        当前
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(version.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    {version.finalAmount && (
                                        <div className="text-right">
                                            <div className="text-sm font-semibold font-mono tabular-nums">
                                                ¥{Number(version.finalAmount).toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                </ScrollArea>

                <DropdownMenuSeparator className="m-0" />
                <div className="p-1.5 bg-muted/20">
                    <DropdownMenuItem
                        className="flex items-center gap-2 py-2 text-primary cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            handleCreateVersion();
                        }}
                        disabled={isCreating}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">{isCreating ? '创建中...' : '创建新版本'}</span>
                    </DropdownMenuItem>
                    {onCopy && (
                        <DropdownMenuItem
                            className="flex items-center gap-2 py-2 cursor-pointer text-muted-foreground focus:bg-muted"
                            onClick={() => {
                                setOpen(false);
                                onCopy();
                            }}
                        >
                            <Copy className="w-4 h-4" />
                            <span>复制为新报价单</span>
                        </DropdownMenuItem>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
