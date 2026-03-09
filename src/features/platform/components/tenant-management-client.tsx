'use client';

/**
 * 租户管理客户端组件
 *
 * 功能：
 * - 展示平台概览统计（总量、活跃数、待审批、暂停）
 * - 展示租户列表（名称、助记码、状态徽章、地区）
 * - 暂停/恢复租户操作（调用 Server Action）
 */

import React, { useState, useTransition } from 'react';
import { suspendTenant, activateTenant } from '@/features/platform/actions/admin-actions';
import type { PendingTenant } from '@/features/platform/actions/admin-actions';

// ── 类型定义 ─────────────────────────────────────────────────────────────────

/** 概览统计数据 */
export interface TenantOverview {
    totalTenants: number;
    activeTenants: number;
    pendingTenants: number;
    suspendedTenants: number;
}

/** Props */
export interface TenantManagementClientProps {
    initialTenants: PendingTenant[];
    initialTotal: number;
    overview: TenantOverview;
}

// ── 状态颜色映射 ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    active: {
        label: '已激活',
        className: 'bg-green-100 text-green-700 border border-green-200',
    },
    suspended: {
        label: '已暂停',
        className: 'bg-red-100 text-red-700 border border-red-200',
    },
    pending_approval: {
        label: '待审批',
        className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    },
    rejected: {
        label: '已拒绝',
        className: 'bg-gray-100 text-gray-600 border border-gray-200',
    },
};

// ── 统计卡片 ─────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    colorClass,
}: {
    label: string;
    value: number;
    colorClass?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${colorClass ?? 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

// ── 主组件 ───────────────────────────────────────────────────────────────────

export function TenantManagementClient({
    initialTenants,
    initialTotal,
    overview,
}: TenantManagementClientProps) {
    const [tenants, setTenants] = useState<PendingTenant[]>(initialTenants);
    const [isPending, startTransition] = useTransition();
    const [actionError, setActionError] = useState<string | null>(null);

    /** 暂停租户 */
    async function handleSuspend(tenantId: string) {
        setActionError(null);
        startTransition(async () => {
            const result = await suspendTenant(tenantId, '平台管理员操作');
            if (!result.success) {
                setActionError(result.error ?? '操作失败');
                return;
            }
            setTenants((prev) =>
                prev.map((t) => (t.id === tenantId ? { ...t, status: 'suspended' } : t))
            );
        });
    }

    /** 恢复租户 */
    async function handleActivate(tenantId: string) {
        setActionError(null);
        startTransition(async () => {
            const result = await activateTenant(tenantId);
            if (!result.success) {
                setActionError(result.error ?? '操作失败');
                return;
            }
            setTenants((prev) =>
                prev.map((t) => (t.id === tenantId ? { ...t, status: 'active' } : t))
            );
        });
    }

    const isEmpty = tenants.length === 0;

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">租户管理</h1>
                <p className="mt-1 text-sm text-gray-500">
                    管理平台所有租户的状态、套餐和基本信息。
                </p>
            </div>

            {/* 统计卡片区 */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="租户总数" value={overview.totalTenants} />
                <StatCard label="活跃租户" value={overview.activeTenants} colorClass="text-green-600" />
                <StatCard label="待审批" value={overview.pendingTenants} colorClass="text-yellow-600" />
                <StatCard label="已暂停" value={overview.suspendedTenants} colorClass="text-red-600" />
            </div>

            {/* 错误提示 */}
            {actionError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {/* 租户列表 */}
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-gray-400" data-testid="empty-state">
                    <p className="text-lg font-medium">暂无租户</p>
                    <p className="mt-1 text-sm">当前筛选条件下没有找到任何租户</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    租户
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    助记码
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    申请人
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    地区
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    状态
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {tenants.map((tenant) => {
                                const statusConfig = STATUS_MAP[tenant.status] ?? {
                                    label: tenant.status,
                                    className: 'bg-gray-100 text-gray-600',
                                };
                                return (
                                    <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{tenant.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{tenant.applicantEmail}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-gray-600">{tenant.code}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {tenant.applicantName ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{tenant.region ?? '-'}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                                                data-status={tenant.status}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {tenant.status === 'active' && (
                                                <button
                                                    onClick={() => handleSuspend(tenant.id)}
                                                    disabled={isPending}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                                                >
                                                    暂停
                                                </button>
                                            )}
                                            {tenant.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleActivate(tenant.id)}
                                                    disabled={isPending}
                                                    className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                                                >
                                                    恢复
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50 text-sm text-gray-400">
                        共 {initialTotal} 条记录
                    </div>
                </div>
            )}
        </div>
    );
}
