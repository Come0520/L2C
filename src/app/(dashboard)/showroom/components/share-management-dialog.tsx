'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Link,
    Link2,
    Copy,
    ExternalLink,
    ShieldOff,
    Loader2,
    Eye,
    Calendar,
    Check
} from 'lucide-react';
import { getMyShareLinks, deactivateShareLink } from '@/features/showroom/actions/shares';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ShareLink {
    id: string;
    createdAt: Date | null;
    expiresAt: Date | null;
    views: number | null;
    isActive: number | null;
}

export function ShareManagementDialog() {
    const [open, setOpen] = useState(false);
    const [shares, setShares] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadShares = async () => {
        setLoading(true);
        try {
            const data = await getMyShareLinks();
            setShares(data as ShareLink[]);
        } catch (error) {
            toast.error('加载分享列表失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadShares();
        }
    }, [open]);

    const handleDeactivate = async (id: string) => {
        startTransition(async () => {
            try {
                const result = await deactivateShareLink({ shareId: id });
                if (result.success) {
                    toast.success('链接已停用');
                    loadShares();
                } else {
                    toast.error('停用失败');
                }
            } catch (error) {
                toast.error('停用失败');
                console.error(error);
            }
        });
    };

    const handleCopy = (id: string) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/showroom/share/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success('已复制到剪贴板');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const navigateToShare = (id: string) => {
        const baseUrl = window.location.origin;
        window.open(`${baseUrl}/showroom/share/${id}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 glass-liquid border-white/20 hover:bg-white/10 text-white">
                    <Link className="h-4 w-4" />
                    分享管理
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl glass-liquid-ultra border-white/10 text-white max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-sky-400" />
                        分享链接管理
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-white/50">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>加载中...</p>
                        </div>
                    ) : shares.length === 0 ? (
                        <div className="text-center py-12 text-white/40">
                            <p>暂无分享记录</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {shares.map((share) => {
                                const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
                                const isDraft = share.isActive === 0;

                                return (
                                    <div
                                        key={share.id}
                                        className="group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={isDraft ? "secondary" : isExpired ? "destructive" : "default"}
                                                    className={!isDraft && !isExpired ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
                                                >
                                                    {isDraft ? "已停用" : isExpired ? "已过期" : "活跃中"}
                                                </Badge>
                                                <span className="text-xs text-white/40 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {share.createdAt ? format(new Date(share.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="bg-white/10 px-2 py-1 rounded font-mono text-xs truncate max-w-[200px]">
                                                    {share.id}
                                                </div>
                                                <div className="flex items-center gap-3 ml-2 text-white/60">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        {share.views || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9 hover:bg-white/20"
                                                onClick={() => handleCopy(share.id)}
                                                title="复制链接"
                                            >
                                                {copiedId === share.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9 hover:bg-white/20"
                                                onClick={() => navigateToShare(share.id)}
                                                title="预览链接"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>

                                            {share.isActive === 1 && !isExpired && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 hover:bg-red-500/20 text-red-400"
                                                    disabled={isPending}
                                                    onClick={() => handleDeactivate(share.id)}
                                                    title="停用链接"
                                                >
                                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
