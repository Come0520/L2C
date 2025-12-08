'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { coefficientService } from '@/services/coefficient.client';
import { CoefficientApproval } from '@/types/points';

/**
 * 我的审批单页面(销售负责人)
 */
export default function MyApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<CoefficientApproval[]>([]);
  const [loading, setLoading] = useState(true);

  

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coefficientService.getMyApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const handleCancel = async (id: string) => {
    if (!confirm('确定要撤销这个审批申请吗?')) return;

    try {
      await coefficientService.cancelApproval(id);
      alert('撤销成功');
      loadApprovals();
    } catch (err: any) {
      alert(err.message || '撤销失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending_channel: { label: '待渠道审批', color: 'bg-paper-warning-light text-paper-warning' },
      pending_leader: { label: '待领导终审', color: 'bg-paper-info-light text-paper-info' },
      approved: { label: '已批准', color: 'bg-paper-success-light text-paper-success' },
      rejected: { label: '已拒绝', color: 'bg-paper-error-light text-paper-error' },
      cancelled: { label: '已撤销', color: 'bg-paper-border text-paper-ink-secondary' },
    };

    const badge = (badges[status] || badges.pending_channel) as { label: string; color: string };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-paper-ink">我的审批单</h1>
          <PaperButton
            variant="outline"
            onClick={() => router.push('/points-coefficient/my-rules')}
          >
            返回规则列表
          </PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>审批记录</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-12">加载中...</div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-paper-ink-secondary">暂无审批记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-paper-border">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-paper-ink-secondary">审批单号</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">标题</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">规则数</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">当前状态</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">提交时间</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((approval) => (
                      <tr key={approval.id} className="border-b border-paper-border hover:bg-paper-background">
                        <td className="py-4 text-sm font-mono">{approval.approval_no}</td>
                        <td className="py-4">
                          <div className="font-medium">{approval.title}</div>
                          {approval.reason && (
                            <div className="text-xs text-paper-ink-secondary mt-1">
                              {approval.reason}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-sm">{approval.rule_ids.length}</td>
                        <td className="py-4">
                          <div className="space-y-1">
                            {getStatusBadge(approval.status)}
                            {approval.channel_approval_status && (
                              <div className="text-xs text-paper-ink-secondary">
                                渠道: {approval.channel_approval_status === 'approved' ? '✅已批准' : approval.channel_approval_status === 'rejected' ? '❌已拒绝' : '⏳待审批'}
                              </div>
                            )}
                            {approval.leader_approval_status && (
                              <div className="text-xs text-paper-ink-secondary">
                                领导: {approval.leader_approval_status === 'approved' ? '✅已批准' : approval.leader_approval_status === 'rejected' ? '❌已拒绝' : '⏳待审批'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm">
                          {new Date(approval.submitted_at).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <PaperButton
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/points-coefficient/approvals/${approval.id}`)}
                            >
                              查看
                            </PaperButton>
                            {(approval.status === 'pending_channel' || approval.status === 'pending_leader') && (
                              <PaperButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(approval.id)}
                              >
                                撤销
                              </PaperButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}
