/**
 * 线索详情页
 */

import { notFound, redirect } from 'next/navigation';
import { getLeadById, getChannels } from '@/features/leads/actions';

import { Button } from '@/shared/ui/button';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatDate } from '@/shared/lib/utils';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Ban from 'lucide-react/dist/esm/icons/ban';
import Link from 'next/link';

import { EditLeadDialog } from '@/features/leads/components/edit-lead-dialog';
import { AddFollowupDialog } from '@/features/leads/components/add-followup-dialog';
import { LeadStatusBar } from '@/features/leads/components/lead-status-bar';
import { VoidLeadDialog } from '@/features/leads/components/void-lead-dialog';
import { LeadActivityLog } from '@/features/leads/components/lead-activity-log';
import { LeadRelatedCards } from '@/features/leads/components/lead-related-cards';
import { NoiseButton } from '@/shared/ui/noise-button';
import { auth } from '@/shared/lib/auth';

export const revalidate = 60;

export default async function LeadDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [session, resolvedParams] = await Promise.all([
        auth(),
        params
    ]);

    const userId = session?.user?.id;
    const tenantId = session?.user?.tenantId;

    if (!userId || !tenantId) {
        redirect('/auth/login');
    }

    let lead, channels;
    try {
        const [leadData, channelsData] = await Promise.all([
            getLeadById({ id: resolvedParams.id }),
            getChannels(),
        ]);

        if (!leadData) {
            notFound();
        }
        lead = leadData;
        channels = channelsData;
    } catch (error: unknown) {
        console.error(`[${new Date().toISOString()}] Error fetching lead detail:`, error);
        throw error;
    }

    return (
        <div className="space-y-6">
            {/* 顶部导航 */}
            <div className="flex flex-col gap-2">
                <nav className="text-sm text-gray-500">
                    <Link href="/leads" className="hover:text-gray-700 transition-colors">线索管理</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700">线索详情</span>
                </nav>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{lead.customerName}</h1>
                            {/* Removed StatusBadge in favor of StatusBar, or keep it as summary */}
                            <StatusBadge status={lead.status || 'PENDING_ASSIGNMENT'} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">线索编号: {lead.leadNo}</p>
                    </div>
                    {/* ... buttons ... */}
                    <div className="flex gap-2">
                        <EditLeadDialog
                            lead={lead}
                            channels={channels}
                            tenantId={tenantId}
                            trigger={
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑资料
                                </Button>
                            }
                        />
                        <AddFollowupDialog
                            leadId={lead.id}
                            trigger={
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    添加跟进
                                </Button>
                            }
                        />
                        <NoiseButton asChild className="" size="sm" data-testid="quick-quote-btn">
                            <Link href={`/leads/${lead.id}/quick-quote`}>
                                <Zap className="h-4 w-4 mr-2" />
                                快速报价
                            </Link>
                        </NoiseButton>
                        {lead.status !== 'WON' && lead.status !== 'INVALID' && (
                            <VoidLeadDialog
                                leadId={lead.id}
                                userId={userId}
                                trigger={
                                    <Button variant="outline" size="sm" className="text-error-600 border-error-200 hover:bg-error-50">
                                        <Ban className="h-4 w-4 mr-2" />
                                        标记作废
                                    </Button>
                                }
                            />
                        )}
                        <Button disabled variant="ghost" size="sm" title="只有在成交后才能转为客户">
                            转为客户
                        </Button>
                    </div>
                </div>

                {/* Status Bar */}
                <LeadStatusBar
                    status={lead.status || 'PENDING_ASSIGNMENT'}
                    leadId={lead.id}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：客户画像与基本信息 */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader title="基本信息" className="border-b pb-4 mb-4" />
                        <CardContent>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">联系电话</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lead.customerPhone}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">意向等级</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {lead.intentionLevel === 'HIGH' ? '高意向' :
                                            lead.intentionLevel === 'MEDIUM' ? '中意向' : '低意向'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">来源渠道</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {lead.sourceChannel?.name || '-'}
                                        {lead.sourceDetail ? ` (${lead.sourceDetail})` : ''}
                                    </dd>
                                </div>
                                {lead.referrerCustomer && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">推荐人 / 合作伙伴</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <Link href={`/customers?search=${lead.referrerCustomer.name}`} className="text-blue-600 hover:underline">
                                                {lead.referrerCustomer.name}
                                            </Link>
                                            <span className="text-gray-400 ml-1">
                                                ({lead.referrerCustomer.phone || '-'})
                                            </span>
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">所属小区</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lead.community || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">备注需求</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                        {lead.notes || '暂无备注'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* 跟进记录 */}
                    <LeadActivityLog leadId={lead.id} />
                </div>

                {/* 右侧：系统信息与服务 */}
                <div className="space-y-6">
                    {/* 关联业务数据 */}
                    <LeadRelatedCards leadId={lead.id} tenantId={session.user.tenantId} />

                    {/* 系统信息摘要 */}
                    <Card>
                        <CardHeader title="系统信息" className="text-sm text-gray-500 uppercase tracking-wider" />
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">创建时间</span>
                                <span className="text-gray-900">{lead.createdAt ? formatDate(lead.createdAt) : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">创建人</span>
                                <span className="text-gray-900">{lead.createdBy ? '已记录' : '系统'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">负责人</span>
                                <span className="text-gray-900">{lead.assignedSales?.name || '未分配'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
