import {
    Link as LinkIcon,
    Clock,
    Eye,
    Trash2,
    Copy,
    Shield
} from 'lucide-react';
import React, { useState } from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import {
    PaperCard,
    PaperCardHeader,
    PaperCardTitle,
    PaperCardContent
} from '@/components/ui/paper-card';

interface SharedLink {
    id: string;
    token: string;
    scope: 'view' | 'comment' | 'edit';
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    clicks: number; // Mock metric from logs
}

interface ShareLinkManagerProps {
    resourceType: string;
    resourceId: string;
    links: SharedLink[];
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

    const handleCreate = () => {
        // Logic to convert expiration string to number/date would go here
        onCreateLink(selectedLinkValues.scope, parseInt(selectedLinkValues.expiration));
    };

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/s/${token}`;
        navigator.clipboard.writeText(url);
        // Suggest toast notification here
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
                                className="w-full rounded-md border-paper-400 bg-white text-ink-800 shadow-sm focus:border-theme-500 focus:ring-theme-500 sm:text-sm"
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
                                className="w-full rounded-md border-paper-400 bg-white text-ink-800 shadow-sm focus:border-theme-500 focus:ring-theme-500 sm:text-sm"
                                value={selectedLinkValues.expiration}
                                onChange={(e) => setSelectedLinkValues({ ...selectedLinkValues, expiration: e.target.value })}
                            >
                                <option value="1">1 天</option>
                                <option value="7">7 天</option>
                                <option value="30">30 天</option>
                                <option value="0">永久有效</option>
                            </select>
                        </div>

                        <PaperButton onClick={handleCreate} className="w-full sm:w-auto">
                            生成链接
                        </PaperButton>
                    </div>

                    {/* Links List */}
                    <div className="space-y-4">
                        {links.map(link => (
                            <div key={link.id} className="flex items-center justify-between p-4 bg-white border border-paper-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <PaperBadge variant={link.isActive ? 'success' : 'default'}>
                                            {link.isActive ? '有效' : '已失效'}
                                        </PaperBadge>
                                        <span className="font-mono text-sm text-ink-600 bg-paper-100 px-2 py-1 rounded">
                                            ...{link.token.slice(-8)}
                                        </span>
                                        <button onClick={() => copyLink(link.token)} className="text-theme-600 hover:text-theme-700">
                                            <Copy className="h-4 w-4" />
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
                            </div>
                        ))}

                        {links.length === 0 && (
                            <div className="text-center py-8 text-ink-400">
                                暂无共享链接
                            </div>
                        )}
                    </div>
                </PaperCardContent>
            </PaperCard>
        </div>
    );
};
