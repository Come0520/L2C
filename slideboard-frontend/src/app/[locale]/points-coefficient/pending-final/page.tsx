'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperModal } from '@/components/ui/paper-modal';
import { coefficientService } from '@/services/coefficient.client';
import { CoefficientApproval } from '@/types/points';

/**
 * 待终审页面(领导)
 */
export default function PendingFinalPage() {
  useRouter();
  const [approvals, setApprovals] = useState<CoefficientApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<CoefficientApproval | null>(null);
  const [comment, setComment] = useState('');
  const [approving, setApproving] = useState(false);

  

  const loadApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coefficientService.getPendingLeaderApprovals();
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

  const handleApprove = async (approved: boolean) => {
    if (!selectedApproval) return;

    try {
      setApproving(true);
      await coefficientService.leaderApprove({
        approval_id: selectedApproval.id,
        approved,
        comment
      });

      alert(approved ? '终审通过,规则已生效' : '已拒绝');
      setShowModal(false);
      setSelectedApproval(null);
      setComment('');
      loadApprovals();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setApproving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-paper-ink">待终审</h1>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>待我终审({approvals.length})</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-12">加载中...</div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-paper-ink-secondary">暂无待终审申请</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border border-paper-border rounded-lg p-4 hover:bg-paper-background"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-paper-ink">{approval.title}</h3>
                          <span className="text-xs font-mono text-paper-ink-secondary">
                            {approval.approval_no}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-paper-success-light text-paper-success">
                            渠道已批准
                          </span>
                        </div>
                        <p className="text-sm text-paper-ink-secondary mb-3">
                          {approval.reason}
                        </p>
                      </div>
                      <PaperButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowModal(true);
                        }}
                      >
                        终审
                      </PaperButton>
                    </div>

                    {/* 审批流程 */}
                    <div className="bg-paper-background rounded-lg p-3">
                      <div className="text-xs font-medium text-paper-ink mb-2">审批流程</div>
                      <div className="space-y-2">
                        {/* 渠道审批 */}
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-paper-success text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">渠道负责人审批</div>
                            <div className="text-xs text-paper-ink-secondary">
                              {approval.channel_approved_at && 
                                new Date(approval.channel_approved_at).toLocaleString()}
                            </div>
                            {approval.channel_approval_comment && (
                              <div className="text-xs text-paper-ink-secondary mt-1">
                                意见: {approval.channel_approval_comment}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 领导审批 */}
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-paper-warning text-white flex items-center justify-center text-xs">
                            ⏳
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">领导终审</div>
                            <div className="text-xs text-paper-ink-secondary">
                              等待您的审批
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 text-xs text-paper-ink-secondary mt-3 pt-3 border-t border-paper-border">
                      <div>规则数: {approval.rule_ids.length}</div>
                      <div>提交时间: {new Date(approval.submitted_at).toLocaleString()}</div>
                      <div>渠道通过: {approval.channel_approved_at && new Date(approval.channel_approved_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PaperCardContent>
        </PaperCard>

        {/* 终审Modal */}
        {selectedApproval && (
          <PaperModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="领导终审"
          >
            <div className="space-y-4">
              <div className="bg-paper-background p-4 rounded-lg">
                <h3 className="font-bold mb-2">{selectedApproval.title}</h3>
                <p className="text-sm text-paper-ink-secondary mb-3">
                  {selectedApproval.reason}
                </p>
                <div className="space-y-1 text-xs text-paper-ink-secondary">
                  <div>审批单号: {selectedApproval.approval_no}</div>
                  <div>包含规则: {selectedApproval.rule_ids.length}条</div>
                  <div>渠道审批: 
                    <span className="text-paper-success"> ✓ 已批准</span>
                    {selectedApproval.channel_approved_at && 
                      ` (${new Date(selectedApproval.channel_approved_at).toLocaleDateString()})`}
                  </div>
                  {selectedApproval.channel_approval_comment && (
                    <div className="mt-2 p-2 bg-white rounded">
                      渠道意见: {selectedApproval.channel_approval_comment}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-paper-warning-light p-3 rounded">
                <div className="text-sm font-medium text-paper-ink mb-1">⚠️ 终审提示</div>
                <div className="text-xs text-paper-ink-secondary">
                  终审批准后,规则将在设定的生效时间自动激活,请仔细审核
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  审批意见
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  rows={3}
                  placeholder="请输入审批意见(可选)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <PaperButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleApprove(false)}
                  disabled={approving}
                >
                  拒绝
                </PaperButton>
                <PaperButton
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleApprove(true)}
                  disabled={approving}
                >
                  {approving ? '提交中...' : '批准并生效'}
                </PaperButton>
              </div>
            </div>
          </PaperModal>
        )}
      </div>
    </DashboardLayout>
  );
}
