'use client';

import { AlertCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import {
    fetchWarnings,
    fetchWarningStats,
    resolveWarning,
    resolveWarnings,
    triggerWarningDetection,
    type Warning
} from '@/services/warnings.client';

/**
 * 预警中心组件
 * 
 * 展示所有未解决的预警，支持按严重程度筛选和批量处理
 */
export function WarningCenter() {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [severityFilter, setSeverityFilter] = useState<string | null>(null);

    // 获取预警列表
    const { data: warnings = [], isLoading } = useQuery({
        queryKey: ['warnings', { resolved: false, severity: severityFilter }],
        queryFn: () => fetchWarnings({
            resolved: false,
            severity: severityFilter || undefined
        }),
        refetchInterval: 60000, // 每分钟刷新
    });

    // 获取预警统计
    const { data: stats = [] } = useQuery({
        queryKey: ['warning-stats'],
        queryFn: fetchWarningStats,
        refetchInterval: 60000,
    });

    // 标记已解决
    const resolveMutation = useMutation({
        mutationFn: resolveWarning,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['warning-stats'] });
        },
    });

    // 批量标记已解决
    const batchResolveMutation = useMutation({
        mutationFn: resolveWarnings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['warning-stats'] });
            setSelectedIds([]);
        },
    });

    // 手动刷新
    const triggerMutation = useMutation({
        mutationFn: triggerWarningDetection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warnings'] });
            queryClient.invalidateQueries({ queryKey: ['warning-stats'] });
        },
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getSeverityText = (severity: string) => {
        const map: Record<string, string> = {
            critical: '紧急',
            high: '重要',
            medium: '一般',
            low: '较低',
        };
        return map[severity] || severity;
    };

    return (
        <div className="space-y-4">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <PaperCard
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSeverityFilter(null)}
                >
                    <PaperCardHeader>
                        <PaperCardTitle className="text-lg">全部预警</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="text-3xl font-bold">{warnings.length}</div>
                    </PaperCardContent>
                </PaperCard>

                {['critical', 'high', 'medium'].map(severity => {
                    const count = stats.filter(s => s.severity === severity)
                        .reduce((sum, s) => sum + s.count, 0);
                    return (
                        <PaperCard
                            key={severity}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSeverityFilter(severity)}
                        >
                            <PaperCardHeader>
                                <PaperCardTitle className="text-lg">
                                    {getSeverityText(severity)}
                                </PaperCardTitle>
                            </PaperCardHeader>
                            <PaperCardContent>
                                <div className={`text-3xl font-bold ${severity === 'critical' ? 'text-red-600' :
                                        severity === 'high' ? 'text-orange-600' :
                                            'text-yellow-600'
                                    }`}>
                                    {count}
                                </div>
                            </PaperCardContent>
                        </PaperCard>
                    );
                })}
            </div>

            {/* 预警列表 */}
            <PaperCard>
                <PaperCardHeader className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <PaperCardTitle>预警列表</PaperCardTitle>
                        {severityFilter && (
                            <PaperBadge onClick={() => setSeverityFilter(null)} className="cursor-pointer">
                                {getSeverityText(severityFilter)} ✕
                            </PaperBadge>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectedIds.length > 0 && (
                            <PaperButton
                                size="sm"
                                onClick={() => batchResolveMutation.mutate(selectedIds)}
                                disabled={batchResolveMutation.isPending}
                            >
                                批量标记已解决 ({selectedIds.length})
                            </PaperButton>
                        )}
                        <PaperButton
                            size="sm"
                            variant="outline"
                            onClick={() => triggerMutation.mutate()}
                            disabled={triggerMutation.isPending}
                        >
                            <RefreshCw className={`h-4 w-4 mr-1 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
                            手动刷新
                        </PaperButton>
                    </div>
                </PaperCardHeader>

                <PaperCardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : warnings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            暂无预警
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {warnings.map((warning) => (
                                <div
                                    key={warning.id}
                                    className={`p-4 rounded-lg border-l-4 ${getSeverityColor(warning.severity)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(warning.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds([...selectedIds, warning.id]);
                                                    } else {
                                                        setSelectedIds(selectedIds.filter(id => id !== warning.id));
                                                    }
                                                }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="font-semibold">{warning.message}</span>
                                                    <PaperBadge variant="outline" className="text-xs">
                                                        {getSeverityText(warning.severity)}
                                                    </PaperBadge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    ⚡ {warning.action_required}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(warning.created_at).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        </div>
                                        <PaperButton
                                            size="sm"
                                            variant="outline"
                                            onClick={() => resolveMutation.mutate(warning.id)}
                                            disabled={resolveMutation.isPending}
                                        >
                                            标记已解决
                                        </PaperButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PaperCardContent>
            </PaperCard>
        </div>
    );
}
