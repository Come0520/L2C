'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperModal } from '@/components/ui/paper-modal';
import { coefficientService } from '@/services/coefficient.client';
import { CoefficientApproval } from '@/types/points';

/**
 * 待审批页面(渠道负责人)
 */
export default function PendingApprovalsPage() {
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
      const data = await coefficientService.getPendingChannelApprovals();
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
      await coefficientService.channelApprove({
        approval_id: selectedApproval.id,
        approved,
        comment
      });

      alert(approved ? '审批通过' : '已拒绝');
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-paper-ink">待我审批</h1>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>待处理审批({approvals.length})</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-12">加载中...</div>
            ) : approvals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-paper-ink-secondary">暂无待审批申请</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="border border-paper-border rounded-lg p-4 hover:bg-paper-background"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-paper-ink">{approval.title}</h3>
                          <span className="text-xs font-mono text-paper-ink-secondary">
                            {approval.approval_no}
                          </span>
                        </div>
                        <p className="text-sm text-paper-ink-secondary mb-3">
                          {approval.reason}
                        </p>
                        <div className="flex gap-6 text-sm text-paper-ink-secondary">
                          <div>规则数: {approval.rule_ids.length}</div>
                          <div>提交时间: {new Date(approval.submitted_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <PaperButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowModal(true);
                          }}
                        >
                          审批
                        </PaperButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PaperCardContent>
        </PaperCard>

        {/* 审批Modal */}
        {selectedApproval && (
          <PaperModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="审批申请"
          >
            <div className="space-y-4">
              <div className="bg-paper-background p-4 rounded-lg">
                <h3 className="font-bold mb-2">{selectedApproval.title}</h3>
                <p className="text-sm text-paper-ink-secondary mb-3">
                  {selectedApproval.reason}
                </p>
                <div className="text-xs text-paper-ink-secondary">
                  审批单号: {selectedApproval.approval_no}
                </div>
                <div className="text-xs text-paper-ink-secondary">
                  包含规则: {selectedApproval.rule_ids.length}条
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
                  {approving ? '提交中...' : '批准'}
                </PaperButton>
              </div>
            </div>
          </PaperModal>
        )}
      </div>
  );
}
