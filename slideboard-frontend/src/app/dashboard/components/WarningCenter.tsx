'use client';

import { AlertCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import {
    fetchWarnings,
    fetchWarningStats,
    resolveWarning,
    resolveWarnings,
    triggerWarningDetection,
} from '@/services/warnings.client';
import type { Warning } from '@/types/warnings';

/**
 * 预警中心组件
 * 
 * 展示所有未解决的预警，支持按严重程度筛选和批量处理
 */
export function WarningCenter() {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
            case 'critical': return 'bg-red-50 border-red-200 hover:bg-red-100';
            case 'high': return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
            case 'medium': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
            case 'low': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
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
        <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PaperCard
                    className={`cursor-pointer transition-all border-2 ${!severityFilter ? 'border-primary-500 shadow-md transform scale-[1.02]' : 'border-transparent hover:border-gray-200'}`}
                    onClick={() => setSeverityFilter(null)}
                >
                    <PaperCardHeader className="pb-2">
                        <PaperCardTitle className="text-sm text-gray-500 font-medium">全部预警</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="text-3xl font-bold">{warnings.length}</div>
                    </PaperCardContent>
                </PaperCard>

                {['critical', 'high', 'medium'].map(severity => {
                    const count = stats.filter(s => s.severity === severity)
                        .reduce((sum, s) => sum + s.count, 0);
                    const isActive = severityFilter === severity;
                    return (
                        <PaperCard
                            key={severity}
                            className={`cursor-pointer transition-all border-2 ${isActive
                                ? 'border-primary-500 shadow-md transform scale-[1.02]'
                                : 'border-transparent hover:border-gray-200'
                                }`}
                            onClick={() => setSeverityFilter(severity)}
                        >
                            <PaperCardHeader className="pb-2">
                                <PaperCardTitle className="text-sm text-gray-500 font-medium">
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
            <PaperCard className="border-t-4 border-t-primary-500">
                <PaperCardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center space-x-3">
                        <PaperCardTitle className="text-xl">预警与风险监控</PaperCardTitle>
                        {severityFilter && (
                            <span
                                onClick={() => setSeverityFilter(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <PaperBadge className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">
                                    {getSeverityText(severityFilter)} <span className="ml-1 text-gray-400">✕</span>
                                </PaperBadge>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        {selectedIds.length > 0 && (
                            <PaperButton
                                size="sm"
                                variant="primary"
                                onClick={() => batchResolveMutation.mutate(selectedIds)}
                                disabled={batchResolveMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                标记已解决 ({selectedIds.length})
                            </PaperButton>
                        )}
                        <PaperButton
                            size="sm"
                            variant="outline"
                            onClick={() => triggerMutation.mutate()}
                            disabled={triggerMutation.isPending}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
                            刷新检测
                        </PaperButton>
                    </div>
                </PaperCardHeader>

                <PaperCardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <RefreshCw className="h-8 w-8 mb-4 animate-spin opacity-50" />
                            <p>正在拉取最新预警数据...</p>
                        </div>
                    ) : warnings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <CheckCircle className="h-16 w-16 mb-4 text-green-500/50" />
                            <h3 className="text-lg font-medium text-gray-900">暂无风险预警</h3>
                            <p className="text-gray-500 mt-1">系统状况良好，未检测到异常情况</p>
                        </div>
                    ) : (
                        <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                            {warnings.map((warning) => (
                                <div
                                    key={warning.id}
                                    className={`group p-4 transition-colors ${getSeverityColor(warning.severity)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
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
                                                className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                                    <PaperBadge className={`
                                                        ${warning.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                            warning.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-blue-100 text-blue-700'} border-none uppercase text-xs font-bold tracking-wider px-2
                                                    `}>
                                                        {getSeverityText(warning.severity)}
                                                    </PaperBadge>
                                                    <h4 className="font-semibold text-gray-900">{warning.message}</h4>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-3 flex items-center">
                                                    <span className="inline-flex items-center text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-xs mr-2">
                                                        ⚡ 建议行动
                                                    </span>
                                                    {warning.action_required}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>📅 {new Date(warning.created_at).toLocaleString('zh-CN')}</span>

                                                    {/* 关联跳转 */}
                                                    {(warning.lead_id || warning.order_id) && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-300">|</span>
                                                            {warning.lead_id && (
                                                                <Link href={`/leads/${warning.lead_id}`} className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
                                                                    查看线索 #{warning.lead_id}
                                                                </Link>
                                                            )}
                                                            {warning.order_id && (
                                                                <Link href={`/orders/${warning.order_id}`} className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
                                                                    查看订单 #{warning.order_id}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <PaperButton
                                                size="sm"
                                                variant="outline"
                                                onClick={() => resolveMutation.mutate(warning.id)}
                                                disabled={resolveMutation.isPending}
                                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                            >
                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                已解决
                                            </PaperButton>
                                        </div>
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
