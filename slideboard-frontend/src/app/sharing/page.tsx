'use client';

import { Copy, Trash2, ExternalLink, Shield, Clock, Eye, AlertCircle, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import {
  PaperTable,
  PaperTableBody,
  PaperTableCell,
  PaperTableHeader,
  PaperTableRow,
} from '@/components/ui/paper-table';
import { toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareAccessLogViewer, AccessLog } from '@/features/sharing/components/access-log-viewer';
import { shareService, ShareToken } from '@/services/share.client';

export default function SharingPage() {
  const [links, setLinks] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLinkLogs, setSelectedLinkLogs] = useState<{ token: string; logs: AccessLog[] } | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await shareService.getMySharedLinks();
      setLinks(data);
    } catch (error) {
      console.error('Failed to fetch shared links:', error);
      toast.error('获取分享链接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopyLink = async (token: string, id: string) => {
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

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此分享链接吗？撤销后链接将立即失效。')) return;

    try {
      // Optimistic update
      const previousLinks = [...links];
      setLinks(links.filter(link => link.id !== id));

      await shareService.revokeToken(id);
      toast.success('链接已撤销');
    } catch (error) {
      console.error('Failed to revoke token:', error);
      toast.error('撤销失败');
      // Revert on error
      fetchLinks();
    }
  };

  const handleViewLogs = async (token: ShareToken) => {
    // In a real app, we would fetch logs from API here
    // const logs = await shareService.getLogs(token.id);
    // For now, we'll show mock data or empty
    const mockLogs: AccessLog[] = Array.from({ length: token.clicks }).map((_, i) => ({
      id: `log-${i}`,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referer: 'Direct',
      accessedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    setSelectedLinkLogs({
      token: token.token,
      logs: mockLogs,
    });
  };

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-paper-ink mb-2">分享管理</h1>
          <p className="text-paper-ink-secondary">查看和管理所有已生成的分享链接</p>
        </motion.div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-ink-600" />
              <span>所有分享链接</span>
            </PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="space-y-4 p-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                 ))}
              </div>
            ) : (
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>资源</PaperTableCell>
                  <PaperTableCell>Token</PaperTableCell>
                  <PaperTableCell>权限 & 状态</PaperTableCell>
                  <PaperTableCell>有效期</PaperTableCell>
                  <PaperTableCell>访问数据</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                    <AnimatePresence>
                  {links.map((link) => (
                    <motion.tr
                        key={link.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-paper-100 last:border-0 hover:bg-paper-50/50 transition-colors"
                    >
                      <PaperTableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-ink-800 capitalize">
                            {link.resourceType === 'quote' ? '报价单' : link.resourceType === 'order' ? '订单' : link.resourceType}
                          </span>
                          <span className="text-xs text-ink-400 font-mono" title={link.resourceId}>
                             {link.resourceId.slice(0, 8)}...
                          </span>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center space-x-2">
                          <span className="bg-paper-100 px-2 py-1 rounded font-mono text-sm text-ink-600">
                            ...{link.token.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopyLink(link.token, link.id)}
                            className="text-theme-600 hover:text-theme-700 transition-colors p-1 rounded hover:bg-theme-50"
                            title="复制链接"
                          >
                            {copiedId === link.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-ink-600">
                            <Shield className="h-3 w-3 mr-1" />
                            {link.scope === 'view'
                              ? '仅查看'
                              : link.scope === 'comment'
                              ? '可评论'
                              : '可编辑'}
                          </div>
                          <PaperBadge variant={link.isActive ? 'success' : 'error'}>
                            {link.isActive ? '有效' : '已失效'}
                          </PaperBadge>
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center text-sm text-ink-600">
                          <Clock className="h-4 w-4 mr-1 text-ink-400" />
                          {link.expiresAt ? (
                            <span
                              className={
                                new Date(link.expiresAt) < new Date() ? 'text-paper-error' : ''
                              }
                            >
                              {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            '永久有效'
                          )}
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex items-center text-sm text-ink-600">
                          <Eye className="h-4 w-4 mr-1 text-ink-400" />
                          {link.clicks} 次
                        </div>
                      </PaperTableCell>
                      <PaperTableCell>
                        <div className="flex space-x-2">
                          <PaperButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewLogs(link)}
                          >
                            日志
                          </PaperButton>
                          {link.isActive && (
                            <PaperButton
                              variant="error"
                              size="sm"
                              onClick={() => handleRevoke(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </PaperButton>
                          )}
                        </div>
                      </PaperTableCell>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                  {links.length === 0 && (
                    <PaperTableRow>
                      <PaperTableCell colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-12 text-ink-400">
                          <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                          <p>暂无分享链接</p>
                        </div>
                      </PaperTableCell>
                    </PaperTableRow>
                  )}
                </PaperTableBody>
              </PaperTable>
            )}
          </PaperCardContent>
        </PaperCard>

        {selectedLinkLogs && (
          <ShareAccessLogViewer
            isOpen={!!selectedLinkLogs}
            onClose={() => setSelectedLinkLogs(null)}
            logs={selectedLinkLogs.logs}
            linkToken={selectedLinkLogs.token}
          />
        )}
      </div>
  );
}
