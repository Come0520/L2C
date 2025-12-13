import {
    Link as LinkIcon,
    Clock,
    Eye,
    Trash2,
    Copy,
    Shield,
    Check,
    Loader2
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import {
    PaperCard,
    PaperCardHeader,
    PaperCardTitle,
    PaperCardContent
} from '@/components/ui/paper-card';
import { toast } from 'sonner';

import { ShareToken } from '@/services/share.client';

interface ShareLinkManagerProps {
    resourceType: string;
    resourceId: string;
    links: ShareToken[];
    onCreateLink: (scope: string, expiresIn?: number) => void;
    onRevokeLink: (id: string) => void;
    onViewLogs: (id: string) => void;
}

export const ShareLinkManager: React.FC<ShareLinkManagerProps> = ({
    links,
    onCreateLink,
    onRevokeLink,
    onViewLogs
}) => {
    const [selectedLinkValues, setSelectedLinkValues] = useState<{ scope: string, expiration: string }>({
        scope: 'view',
        expiration: '7' // 7 days
    });
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCreate = () => {
        startTransition(() => {
            onCreateLink(selectedLinkValues.scope, parseInt(selectedLinkValues.expiration));
        });
    };

    const copyLink = async (token: string, id: string) => {
        const url = `${window.location.origin}/s/${token}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            toast.success('链接已复制到剪贴板');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast.error('复制失败，请手动复制');
        }
    };

    return (
        <div className="space-y-6">
            <PaperCard>
                <PaperCardHeader>
                    <PaperCardTitle className="flex items-center space-x-2">
                        <LinkIcon className="h-5 w-5 text-ink-600" />
                        <span>共享链接管理</span>
                    </PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent>
                    {/* Create New Link Section */}
                    <div className="bg-paper-200 p-4 rounded-lg mb-6 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-medium text-ink-700">权限范围</label>
                            <select
                                className="w-full rounded-md border-paper-400 bg-white text-ink-800 shadow-sm focus:border-theme-500 focus:ring-theme-500 sm:text-sm transition-colors"
                                value={selectedLinkValues.scope}
                                onChange={(e) => setSelectedLinkValues({ ...selectedLinkValues, scope: e.target.value })}
                            >
                                <option value="view">仅查看</option>
                                <option value="comment">允许评论</option>
                                <option value="edit">允许编辑 (协作)</option>
                            </select>
                        </div>

                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-medium text-ink-700">有效期</label>
                            <select
                                className="w-full rounded-md border-paper-400 bg-white text-ink-800 shadow-sm focus:border-theme-500 focus:ring-theme-500 sm:text-sm transition-colors"
                                value={selectedLinkValues.expiration}
                                onChange={(e) => setSelectedLinkValues({ ...selectedLinkValues, expiration: e.target.value })}
                            >
                                <option value="1">1 天</option>
                                <option value="7">7 天</option>
                                <option value="30">30 天</option>
                                <option value="0">永久有效</option>
                            </select>
                        </div>

                        <PaperButton 
                            onClick={handleCreate} 
                            disabled={isPending}
                            className="w-full sm:w-auto min-w-[100px]"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                '生成链接'
                            )}
                        </PaperButton>
                    </div>

                    {/* Links List */}
                    <div className="space-y-4">
                        <AnimatePresence initial={false} mode='popLayout'>
                            {links.map(link => (
                                <motion.div
                                    key={link.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-between p-4 bg-white border border-paper-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <PaperBadge variant={link.isActive ? 'success' : 'default'}>
                                                {link.isActive ? '有效' : '已失效'}
                                            </PaperBadge>
                                            <span className="font-mono text-sm text-ink-600 bg-paper-100 px-2 py-1 rounded">
                                                ...{link.token.slice(-8)}
                                            </span>
                                            <button 
                                                onClick={() => copyLink(link.token, link.id)} 
                                                className="text-theme-600 hover:text-theme-700 transition-colors p-1 rounded-md hover:bg-theme-50"
                                                title="复制链接"
                                            >
                                                {copiedId === link.id ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-ink-500">
                                            <span className="flex items-center">
                                                <Shield className="h-3 w-3 mr-1" />
                                                {link.scope === 'view' ? '仅查看' : link.scope === 'comment' ? '评论' : '编辑'}
                                            </span>
                                            <span className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {link.expiresAt ? `过期: ${new Date(link.expiresAt).toLocaleDateString()}` : '永久有效'}
                                            </span>
                                            <span className="flex items-center">
                                                <Eye className="h-3 w-3 mr-1" />
                                                {link.clicks} 次访问
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        <PaperButton variant="outline" size="sm" onClick={() => onViewLogs(link.id)}>
                                            日志
                                        </PaperButton>
                                        <PaperButton variant="error" size="sm" onClick={() => onRevokeLink(link.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </PaperButton>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {links.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 text-ink-400"
                            >
                                暂无共享链接
                            </motion.div>
                        )}
                    </div>
                </PaperCardContent>
            </PaperCard>
        </div>
    );
};
