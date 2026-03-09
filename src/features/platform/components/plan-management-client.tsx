'use client';

/**
 * 平台套餐管理客户端组件
 *
 * 功能：
 * - Tab 1：展示三种套餐的功能基准矩阵与限额配置
 * - Tab 2：展示当前租户列表，支持特批操作配置入口
 * - Tab 3：展示全平台租户 AI 积分消耗与透视台
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Check, X, Shield, Users, Database, Sparkles, Building2, Coins, Settings, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PLAN_LIMITS, PlanType, PlanFeatures } from '@/features/billing/lib/plan-limits';

// ── 类型定义 ─────────────────────────────────────────────────────────────────

/** 套餐配置项（来自外部传入或内部常量） */
export interface SinglePlanConfig {
    name: string;
    maxEmployees: number;
    maxStorageGb: number;
    aiCreditsPerMonth: number;
    price: number;
}

/** 套餐配置映射（测试传入用） */
export type PlanConfigMap = Record<string, SinglePlanConfig>;

/** 租户带套餐信息（最小子集，用于订阅统计） */
export interface TenantWithPlan {
    id: string;
    name: string;
    code: string;
    status: string;
    planType: 'base' | 'pro' | 'enterprise';
    planExpiresAt?: Date | null;
    createdAt?: Date | null;
}

export interface PlanManagementClientProps {
    tenants: TenantWithPlan[];
    /** 可选传入的套餐配置（测试传入，不传则使用 PLAN_LIMITS 内部常量） */
    planConfig?: PlanConfigMap;
}

// ── 工具函数 ─────────────────────────────────────────────────────────────────

function renderLimit(value: number, unit: string = ''): React.ReactNode {
    if (value === Infinity || value < 0) return <span className="font-bold text-lg">∞</span>;
    return `${value}${unit}`;
}

function renderBoolean(value: boolean) {
    return value ? (
        <div className="flex justify-center text-green-500"><Check className="w-5 h-5 stroke-[3]" /></div>
    ) : (
        <div className="flex justify-center text-gray-300"><X className="w-5 h-5 stroke-[3]" /></div>
    );
}

function formatBytes(bytes: number) {
    if (bytes === Infinity || bytes < 0) return <span className="font-bold text-lg">∞</span>;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
}

// ── 套餐颜色配置 ──────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<PlanType, { card: string; badge: string; title: string }> = {
    base: {
        card: 'border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        title: 'text-slate-700 dark:text-slate-200',
    },
    pro: {
        card: 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-800',
        badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
        title: 'text-indigo-700 dark:text-indigo-300',
    },
    enterprise: {
        card: 'border-purple-200 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-800',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        title: 'text-purple-700 dark:text-purple-300',
    },
};

// ── 模块组件 ──────────────────────────────────────────────────────────────────

// ── 模块组件 ─────────────────────────────────────────────────────

/**
 * 套餐能力矩阵卡片区块
 * 支持使用 planConfig (TDD 测试传入) 或 PLAN_LIMITS 内部常量
 */
function CapabilityMatrix({
    counts,
    planConfig,
}: {
    counts: Record<PlanType, number>;
    planConfig?: PlanConfigMap;
}) {
    const plans: PlanType[] = ['base', 'pro', 'enterprise'];

    // 辅助函数：将数字接口类型转换为显示文本
    const getEmployeeLimit = (plan: PlanType): React.ReactNode => {
        if (planConfig) {
            const v = planConfig[plan]?.maxEmployees;
            if (v === undefined || v < 0) return <span>无限制</span>;
            return `${v} 人`;
        }
        return renderLimit(PLAN_LIMITS[plan].maxUsers, ' 人');
    };

    const getStorageLimit = (plan: PlanType): React.ReactNode => {
        if (planConfig) {
            const v = planConfig[plan]?.maxStorageGb;
            if (v === undefined || v < 0) return <span>无限制</span>;
            return `${v} GB`;
        }
        return formatBytes(PLAN_LIMITS[plan].maxStorageBytes);
    };

    const getAiLimit = (plan: PlanType): React.ReactNode => {
        if (planConfig) {
            const v = planConfig[plan]?.aiCreditsPerMonth;
            if (v === undefined || v < 0) return <span>无限制</span>;
            return `${v} 点/月`;
        }
        return renderLimit(PLAN_LIMITS[plan].maxAiRenderingCredits, ' 点/月');
    };

    const getPlanName = (plan: PlanType): string => {
        if (planConfig) return planConfig[plan]?.name ?? plan;
        return PLAN_LIMITS[plan].label;
    };

    const renderFeatureRow = (label: string, featureKey: keyof PlanFeatures) => (
        <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</td>
            {plans.map(p => (
                <td key={p} className="py-3 px-4 text-center">
                    {renderBoolean(PLAN_LIMITS[p].features[featureKey])}
                </td>
            ))}
        </tr>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 套餐卡片栏 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(planKey => {
                    const colors = PLAN_COLORS[planKey];
                    return (
                        <Card key={planKey} className={`${colors.card} shadow-sm border`}>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className={`text-xl ${colors.title}`}>{getPlanName(planKey)}</CardTitle>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                                        {counts[planKey]} 家
                                    </span>
                                </div>
                                <CardDescription className="pt-2">
                                    {planKey === 'base' && "面向初创团队与小微主理人"}
                                    {planKey === 'pro' && "面向成熟型企业与装企品牌"}
                                    {planKey === 'enterprise' && "私有化专属部署与集团定制"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800/60">
                                        <span className="flex items-center gap-2"><Users className="w-4 h-4" />最多账号</span>
                                        <strong className="text-gray-900 dark:text-gray-100">{getEmployeeLimit(planKey)}</strong>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800/60">
                                        <span className="flex items-center gap-2"><Database className="w-4 h-4" />存储空间</span>
                                        <strong className="text-gray-900 dark:text-gray-100">{getStorageLimit(planKey)}</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />免费 AI 算力</span>
                                        <strong className="text-gray-900 dark:text-gray-100">{getAiLimit(planKey)}</strong>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 详细能力矩阵对比表 */}
            <Card className="border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-800 text-sm">
                                <th className="py-4 px-4 font-semibold text-gray-900 dark:text-gray-100 w-1/4">功能模块与限制</th>
                                <th className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300 text-center w-1/4">基础版 (Base)</th>
                                <th className="py-4 px-4 font-semibold text-indigo-700 dark:text-indigo-300 text-center w-1/4">专业版 (Pro)</th>
                                <th className="py-4 px-4 font-semibold text-purple-700 dark:text-purple-300 text-center w-1/4">企业版 (Enterprise)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* 配额行 */}
                            <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">客户容量上限</td>
                                {plans.map(p => <td key={p} className="py-3 px-4 text-center text-sm">{renderLimit(PLAN_LIMITS[p].maxCustomers)}</td>)}
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">每月报价单数量</td>
                                {plans.map(p => <td key={p} className="py-3 px-4 text-center text-sm">{renderLimit(PLAN_LIMITS[p].maxQuotesPerMonth)}</td>)}
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">云展厅商品数量</td>
                                {plans.map(p => <td key={p} className="py-3 px-4 text-center text-sm">{renderLimit(PLAN_LIMITS[p].maxShowroomProducts)}</td>)}
                            </tr>

                            {/* 功能开关行 */}
                            {renderFeatureRow('数据导出 (Excel/PDF)', 'dataExport')}
                            {renderFeatureRow('多级审批流引擎', 'multiLevelApproval')}
                            {renderFeatureRow('品牌自定义装扮', 'brandCustomization')}
                            {renderFeatureRow('高级数据分析与大屏', 'advancedAnalytics')}
                            {renderFeatureRow('API 开发接口访问', 'apiAccess')}
                            {renderFeatureRow('多门店分级管理', 'multiStore')}
                            {renderFeatureRow('精细化 RBAC 角色权限', 'fineGrainedRbac')}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function TenantOverrides({ tenants }: { tenants: TenantWithPlan[] }) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">租户台账与特批配置</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            为指定租户单开功能模块或额外提升各项限额。
                        </p>
                    </div>
                </div>

                {tenants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Building2 className="w-12 h-12 mb-4 opacity-20" />
                        <p>暂无入驻租户数据</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/60">
                            <thead className="bg-gray-50/80 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">租户信息</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">当前版本</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">状态</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-slate-950">
                                {tenants.map(tenant => {
                                    const colors = PLAN_COLORS[tenant.planType] ?? PLAN_COLORS.base;
                                    return (
                                        <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{tenant.name}</div>
                                                <div className="font-mono text-xs text-gray-500 mt-0.5">{tenant.code}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${colors.badge}`}>
                                                    {PLAN_LIMITS[tenant.planType]?.label ?? tenant.planType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {tenant.status === 'active' ? (
                                                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>营业中</span>
                                                ) : tenant.status}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Sheet>
                                                    <SheetTrigger asChild>
                                                        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            配置特批
                                                        </Button>
                                                    </SheetTrigger>
                                                    <SheetContent side="right">
                                                        <SheetHeader>
                                                            <SheetTitle>设置租户特批权限</SheetTitle>
                                                            <SheetDescription>
                                                                突破当前 {PLAN_LIMITS[tenant.planType]?.label} 的系统默认配额。覆盖配置将立即生效。
                                                            </SheetDescription>
                                                        </SheetHeader>
                                                        <div className="py-6 space-y-6">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">附加资源额度 (Addons)</h4>
                                                                <div className="space-y-3">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-xs text-gray-500">额外 AI 积分/月</label>
                                                                        <input type="number" placeholder="例如：100" className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 px-3 py-2" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-xs text-gray-500">扩容云存储空间 (GB)</label>
                                                                        <input type="number" placeholder="例如：50" className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 px-3 py-2" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">特开模块 (Modules)</h4>
                                                                <div className="space-y-2">
                                                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                        <input type="checkbox" className="rounded" /> 开放高级数据大屏
                                                                    </label>
                                                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                        <input type="checkbox" className="rounded" /> 开放 API 接口拉取
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <Button className="w-full">保存特批配置</Button>
                                                        </div>
                                                    </SheetContent>
                                                </Sheet>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

function CreditsOverview() {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-300">本月平台总消耗</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">12,450 <span className="text-sm font-normal text-gray-500">点</span></div>
                    </CardContent>
                </Card>
                <Card className="border border-green-200/60 dark:border-green-800/60 bg-green-50/30 dark:bg-green-900/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">本月系统派发</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">8,500 <span className="text-sm font-normal text-gray-500">点</span></div>
                    </CardContent>
                </Card>
                <Card className="border border-purple-200/60 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-900/10 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">本月租户增购 (Addon)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">4,200 <span className="text-sm font-normal text-gray-500">点</span></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">全平台积分变动流水 (Mock Data)</h3>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="w-4 h-4" /> 导出当月报表
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/60">
                        <thead className="bg-gray-50/80 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">交易时间</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">所属租户</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">交易类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">事由</th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">变动额</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-slate-950">
                            {[
                                { id: 1, time: '2026-03-08 14:30', tenant: 'JD-TEST', type: 'CONSUME', reason: '渲染全屋定制方案（4K）', amount: -15, color: 'text-gray-600', icon: <ArrowDownRight className="w-3 h-3 text-gray-500" /> },
                                { id: 2, time: '2026-03-08 14:00', tenant: 'JD-TEST', type: 'REFUND', reason: '渲染超时失败退回', amount: 15, color: 'text-green-600', icon: <ArrowUpRight className="w-3 h-3 text-green-500" /> },
                                { id: 3, time: '2026-03-05 09:15', tenant: 'STAR-COMPANY', type: 'ADDON', reason: '人工增购积分包', amount: 500, color: 'text-purple-600', icon: <ArrowUpRight className="w-3 h-3 text-purple-500" /> },
                                { id: 4, time: '2026-03-01 00:00', tenant: 'JD-TEST', type: 'PLEDGE', reason: '套餐月初系统派发', amount: 50, color: 'text-indigo-600', icon: <ArrowUpRight className="w-3 h-3 text-indigo-500" /> }
                            ].map(row => (
                                <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{row.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{row.tenant}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{row.reason}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right flex items-center justify-end gap-1 ${row.color}`}>
                                        {row.amount > 0 ? `+${row.amount}` : row.amount}
                                        {row.icon}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// ── 主组件 ───────────────────────────────────────────────────────────────────

export function PlanManagementClient({ tenants, planConfig }: PlanManagementClientProps) {
    const counts = {
        base: tenants.filter(t => t.planType === 'base').length,
        pro: tenants.filter(t => t.planType === 'pro').length,
        enterprise: tenants.filter(t => t.planType === 'enterprise').length,
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    {/* TDD Fix: 测试期望 heading 为"套餐管理" */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">套餐管理</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400">
                        管理平台的订阅套餐配置、审核业务配额限制及各租户的专属特批。
                    </p>
                </div>
            </div>

            <Tabs defaultValue="matrix" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-fit md:inline-flex bg-gray-100/80 dark:bg-slate-900/80 p-1 rounded-xl">
                    <TabsTrigger value="matrix" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                        <Shield className="w-4 h-4" />套餐能力矩阵
                    </TabsTrigger>
                    <TabsTrigger value="tenants" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                        <Settings className="w-4 h-4" />特批配置
                    </TabsTrigger>
                    <TabsTrigger value="credits" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                        <Coins className="w-4 h-4" />AI 积分透视台
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    <TabsContent value="matrix" className="m-0 focus-visible:outline-none">
                        <CapabilityMatrix counts={counts} planConfig={planConfig} />
                    </TabsContent>

                    <TabsContent value="tenants" className="m-0 focus-visible:outline-none">
                        <TenantOverrides tenants={tenants} />
                    </TabsContent>

                    <TabsContent value="credits" className="m-0 focus-visible:outline-none">
                        <CreditsOverview />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
