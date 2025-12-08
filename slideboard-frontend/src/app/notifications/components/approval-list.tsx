'use client';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { VirtualList } from '@/components/ui/virtual-list';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: 'order' | 'expense' | 'discount' | 'contract' | 'leave' | 'procurement';
  requester: string;
  requesterDepartment: string;
  amount?: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  currentStep: number;
  totalSteps: number;
  approvers: {
    step: number;
    name: string;
    department: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    actionAt?: string;
  }[];
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
}

interface ApprovalListProps {
  approvals: ApprovalRequest[];
  onApprovalClick: (approval: ApprovalRequest) => void;
  onApprove?: (approvalId: string) => void;
  onReject?: (approvalId: string) => void;
}

/**
 * 审批列表组件
 * 显示审批申请列表及其详细信息
 */
export default function ApprovalList({
  approvals,
  onApprovalClick,
  onApprove,
  onReject,
}: ApprovalListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-paper-error bg-paper-error-light';
      case 'high': return 'border-l-4 border-paper-warning bg-paper-warning-light';
      case 'medium': return 'border-l-4 border-paper-info bg-paper-info-light';
      case 'low': return 'border-l-4 border-paper-success bg-paper-success-light';
      default: return 'border-l-4 border-paper-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-paper-warning-light text-paper-warning';
      case 'approved': return 'bg-paper-success-light text-paper-success';
      case 'rejected': return 'bg-paper-error-light text-paper-error';
      case 'withdrawn': return 'bg-paper-ink-light text-paper-ink-secondary';
      default: return 'bg-paper-border text-paper-ink';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return '订单';
      case 'expense': return '费用';
      case 'discount': return '折扣';
      case 'contract': return '合同';
      case 'leave': return '请假';
      case 'procurement': return '采购';
      default: return type;
    }
  };

  return (
    <VirtualList
      items={approvals}
      containerHeight={600}
      itemHeight={280} // Estimated height for approval card
      renderItem={(approval) => (
        <PaperCard key={approval.id} className={getPriorityColor(approval.priority)}>
          <PaperCardContent>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-paper-ink">
                    {approval.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                      {approval.status === 'pending' ? '待审批' :
                        approval.status === 'approved' ? '已批准' :
                          approval.status === 'rejected' ? '已拒绝' : '已撤回'}
                    </span>
                    <span className="text-xs text-paper-ink-secondary">
                      {approval.submittedAt}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-paper-ink-secondary mb-3">
                  {approval.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="text-paper-ink-secondary">申请人:</span>
                    <span className="font-medium">{approval.requester}</span>
                    <span className="text-paper-ink-secondary ml-2">({approval.requesterDepartment})</span>
                  </div>
                  {approval.amount && (
                    <div className="text-sm">
                      <span className="text-paper-ink-secondary">金额:</span>
                      <span className="font-medium text-paper-primary">¥{approval.amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-paper-ink-secondary">类型:</span>
                    <span className="font-medium">{getTypeLabel(approval.type)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-paper-ink-secondary">进度:</span>
                    <span className="font-medium">{approval.currentStep}/{approval.totalSteps}</span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-paper-ink">审批流程</span>
                    <span className="text-xs text-paper-ink-secondary">
                      当前步骤:第{approval.currentStep}步
                    </span>
                  </div>
                  <div className="space-y-2">
                    {approval.approvers.map((approver, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-paper-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${approver.status === 'approved' ? 'bg-paper-success text-white' :
                            approver.status === 'rejected' ? 'bg-paper-error text-white' :
                              approver.status === 'pending' ? 'bg-paper-warning text-white' :
                                'bg-paper-border text-paper-ink-secondary'
                            }`}>
                            {approver.step}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{approver.name}</div>
                            <div className="text-xs text-paper-ink-secondary">{approver.department}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-medium ${approver.status === 'approved' ? 'text-paper-success' :
                            approver.status === 'rejected' ? 'text-paper-error' :
                              approver.status === 'pending' ? 'text-paper-warning' :
                                'text-paper-ink-secondary'
                            }`}>
                            {approver.status === 'approved' ? '已批准' :
                              approver.status === 'rejected' ? '已拒绝' :
                                approver.status === 'pending' ? '待处理' : '未开始'}
                          </div>
                          {approver.actionAt && (
                            <div className="text-xs text-paper-ink-secondary">
                              {approver.actionAt}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-paper-border">
              <div className="flex gap-2">
                {approval.attachments && approval.attachments.map((attachment, index) => (
                  <PaperButton key={index} variant="ghost" size="sm">
                    📎 {attachment.name}
                  </PaperButton>
                ))}
              </div>
              <div className="flex gap-2">
                <PaperButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprovalClick(approval)}
                >
                  查看详情
                </PaperButton>
                {approval.status === 'pending' && (
                  <>
                    {onApprove && (
                      <PaperButton
                        variant="success"
                        size="sm"
                        onClick={() => onApprove(approval.id)}
                      >
                        批准
                      </PaperButton>
                    )}
                    {onReject && (
                      <PaperButton
                        variant="error"
                        size="sm"
                        onClick={() => onReject(approval.id)}
                      >
                        拒绝
                      </PaperButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}
    />
  );
}
