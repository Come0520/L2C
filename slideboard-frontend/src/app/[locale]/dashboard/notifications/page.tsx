'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput } from '@/components/ui/paper-input';
import { PaperModal } from '@/components/ui/paper-modal';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender: string;
  recipient: string;
  createdAt: string;
  readAt?: string;
  status: 'unread' | 'read' | 'archived';
  relatedEntity?: {
    type: 'order' | 'invoice' | 'customer' | 'project';
    id: string;
    name: string;
  };
}

interface ApprovalRequest {
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

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals' | 'sent'>('notifications');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const notifications: Notification[] = [
    {
      id: 'NOT001',
      title: '新订单提醒',
      content: '客户"现代家居有限公司"提交了新的装修项目订单，订单编号：ORD20240115001，项目金额：¥85,000',
      type: 'info',
      priority: 'medium',
      sender: '系统',
      recipient: '销售部',
      createdAt: '2024-01-15 14:30:25',
      status: 'unread',
      relatedEntity: {
        type: 'order',
        id: 'ORD20240115001',
        name: '现代家居装修项目'
      }
    },
    {
      id: 'NOT002',
      title: '库存预警',
      content: '商品"欧式瓷砖-米白色"库存已降至安全库存以下，当前库存：15件，建议及时补货',
      type: 'warning',
      priority: 'high',
      sender: '库存管理系统',
      recipient: '采购部',
      createdAt: '2024-01-15 13:45:12',
      status: 'unread',
      relatedEntity: {
        type: 'project',
        id: 'PROD001',
        name: '欧式瓷砖-米白色'
      }
    },
    {
      id: 'NOT003',
      title: '付款确认',
      content: '客户"张总"已完成项目B阶段付款，金额：¥120,000，付款方式：银行转账',
      type: 'success',
      priority: 'medium',
      sender: '财务系统',
      recipient: '项目经理',
      createdAt: '2024-01-15 11:20:45',
      readAt: '2024-01-15 11:25:30',
      status: 'read'
    },
    {
      id: 'NOT004',
      title: '系统维护通知',
      content: '系统将于今晚22:00-24:00进行例行维护，期间可能影响部分功能使用，请提前做好准备',
      type: 'system',
      priority: 'low',
      sender: '系统管理员',
      recipient: '全体用户',
      createdAt: '2024-01-15 09:00:00',
      readAt: '2024-01-15 09:30:15',
      status: 'read'
    },
    {
      id: 'NOT005',
      title: '供应商评价提醒',
      content: '请对供应商"金牌建材"的服务进行评价，您的反馈将帮助我们提升服务质量',
      type: 'info',
      priority: 'low',
      sender: '供应商管理系统',
      recipient: '采购部',
      createdAt: '2024-01-14 16:45:20',
      status: 'archived'
    }
  ];

  const approvalRequests: ApprovalRequest[] = [
    {
      id: 'APP001',
      title: '项目A阶段费用报销',
      description: '项目A阶段施工费用报销申请，包含材料费、人工费等，总计金额：¥45,000',
      type: 'expense',
      requester: '李工程师',
      requesterDepartment: '工程部',
      amount: 45000,
      submittedAt: '2024-01-15 15:20:10',
      status: 'pending',
      priority: 'medium',
      currentStep: 2,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '王项目经理',
          department: '项目部',
          status: 'approved',
          comment: '费用合理，同意报销',
          actionAt: '2024-01-15 16:30:25'
        },
        {
          step: 2,
          name: '财务经理',
          department: '财务部',
          status: 'pending'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ],
      attachments: [
        { name: '费用明细表.pdf', url: '#', size: '2.3MB' },
        { name: '发票扫描件.zip', url: '#', size: '15.6MB' }
      ]
    },
    {
      id: 'APP002',
      title: '大额订单折扣申请',
      description: '客户"创新科技"订单金额超过¥100,000，申请10%折扣优惠',
      type: 'discount',
      requester: '张销售',
      requesterDepartment: '销售部',
      amount: 12000,
      submittedAt: '2024-01-15 14:15:30',
      status: 'pending',
      priority: 'high',
      currentStep: 1,
      totalSteps: 2,
      approvers: [
        {
          step: 1,
          name: '销售总监',
          department: '销售部',
          status: 'pending'
        },
        {
          step: 2,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ]
    },
    {
      id: 'APP003',
      title: '采购合同审批',
      description: '与"金牌建材"签订年度采购合同，合同金额：¥500,000',
      type: 'contract',
      requester: '采购专员',
      requesterDepartment: '采购部',
      amount: 500000,
      submittedAt: '2024-01-14 10:30:45',
      status: 'approved',
      priority: 'urgent',
      currentStep: 3,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '采购经理',
          department: '采购部',
          status: 'approved',
          comment: '合同条款合理',
          actionAt: '2024-01-14 11:45:20'
        },
        {
          step: 2,
          name: '法务专员',
          department: '法务部',
          status: 'approved',
          comment: '法律条款无问题',
          actionAt: '2024-01-14 14:20:15'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'approved',
          comment: '同意签署',
          actionAt: '2024-01-15 09:15:30'
        }
      ],
      attachments: [
        { name: '采购合同.pdf', url: '#', size: '3.2MB' },
        { name: '供应商资质证明.pdf', url: '#', size: '1.8MB' }
      ]
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'system': return '🔧';
      default: return '📢';
    }
  };

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
      case 'unread': return 'bg-paper-primary-light text-paper-primary';
      case 'read': return 'bg-paper-ink-light text-paper-ink-secondary';
      case 'archived': return 'bg-paper-border text-paper-ink-secondary';
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = notificationFilter === 'all' || notification.status === notificationFilter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredApprovals = approvalRequests.filter(approval => {
    const matchesFilter = approvalFilter === 'all' || approval.status === approvalFilter;
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           approval.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (approvalId: string) => {
    void approvalId;
  };

  const handleReject = (approvalId: string) => {
    void approvalId;
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const pendingApprovalCount = approvalRequests.filter(a => a.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-paper-ink">通知与审批</h1>
            <p className="text-paper-ink-secondary mt-1">查看通知消息，处理审批申请</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-paper-primary-light rounded-lg">
              <span className="text-sm text-paper-primary">未读通知</span>
              <span className="px-2 py-1 bg-paper-primary text-white rounded-full text-xs font-bold">{unreadCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-paper-warning-light rounded-lg">
              <span className="text-sm text-paper-warning">待审批</span>
              <span className="px-2 py-1 bg-paper-warning text-white rounded-full text-xs font-bold">{pendingApprovalCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <PaperCard>
          <PaperCardContent className="p-0">
            <div className="border-b border-paper-border">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === 'notifications'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  通知消息
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-paper-error text-white rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === 'approvals'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  审批申请
                  {pendingApprovalCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-paper-warning text-white rounded-full text-xs flex items-center justify-center">
                      {pendingApprovalCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'sent'
                      ? 'border-paper-primary text-paper-primary'
                      : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                  }`}
                >
                  已发送
                </button>
              </nav>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <PaperInput
            placeholder="搜索通知或审批..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          {activeTab === 'notifications' && (
            <div className="flex gap-2">
              <PaperButton
                variant={notificationFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setNotificationFilter('all')}
              >
                全部
              </PaperButton>
              <PaperButton
                variant={notificationFilter === 'unread' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setNotificationFilter('unread')}
              >
                未读
              </PaperButton>
              <PaperButton
                variant={notificationFilter === 'read' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setNotificationFilter('read')}
              >
                已读
              </PaperButton>
            </div>
          )}
          {activeTab === 'approvals' && (
            <div className="flex gap-2">
              <PaperButton
                variant={approvalFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setApprovalFilter('all')}
              >
                全部
              </PaperButton>
              <PaperButton
                variant={approvalFilter === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setApprovalFilter('pending')}
              >
                待审批
              </PaperButton>
              <PaperButton
                variant={approvalFilter === 'approved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setApprovalFilter('approved')}
              >
                已批准
              </PaperButton>
              <PaperButton
                variant={approvalFilter === 'rejected' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setApprovalFilter('rejected')}
              >
                已拒绝
              </PaperButton>
            </div>
          )}
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <PaperCard key={notification.id} className={`${getPriorityColor(notification.priority)} ${notification.status === 'unread' ? 'bg-paper-background' : ''}`}>
                <PaperCardContent>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${notification.status === 'unread' ? 'text-paper-ink' : 'text-paper-ink-secondary'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {notification.status === 'unread' ? '未读' : notification.status === 'read' ? '已读' : '已归档'}
                          </span>
                          <span className="text-xs text-paper-ink-secondary">
                            {notification.createdAt}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-paper-ink-secondary mb-3">
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-paper-ink-secondary">
                          <span className="mr-4">发送者: {notification.sender}</span>
                          <span>接收者: {notification.recipient}</span>
                        </div>
                        <div className="flex gap-2">
                          <PaperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNotification(notification);
                              setShowNotificationModal(true);
                            }}
                          >
                            查看详情
                          </PaperButton>
                          {notification.status === 'unread' && (
                            <PaperButton variant="primary" size="sm">
                              标记已读
                            </PaperButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            ))}
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {filteredApprovals.map((approval) => (
              <PaperCard key={approval.id} className={`${getPriorityColor(approval.priority)}`}>
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
                          <span className="text-paper-ink-secondary">申请人：</span>
                          <span className="font-medium">{approval.requester}</span>
                          <span className="text-paper-ink-secondary ml-2">({approval.requesterDepartment})</span>
                        </div>
                        {approval.amount && (
                          <div className="text-sm">
                            <span className="text-paper-ink-secondary">金额：</span>
                            <span className="font-medium text-paper-primary">¥{approval.amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-paper-ink-secondary">类型：</span>
                          <span className="font-medium">{getTypeLabel(approval.type)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-paper-ink-secondary">进度：</span>
                          <span className="font-medium">{approval.currentStep}/{approval.totalSteps}</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-paper-ink">审批流程</span>
                          <span className="text-xs text-paper-ink-secondary">
                            当前步骤：第{approval.currentStep}步
                          </span>
                        </div>
                        <div className="space-y-2">
                          {approval.approvers.map((approver, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-paper-background rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  approver.status === 'approved' ? 'bg-paper-success text-white' :
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
                                <div className={`text-xs font-medium ${
                                  approver.status === 'approved' ? 'text-paper-success' :
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
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowApprovalModal(true);
                        }}
                      >
                        查看详情
                      </PaperButton>
                      {approval.status === 'pending' && (
                        <>
                          <PaperButton
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                          >
                            批准
                          </PaperButton>
                          <PaperButton
                            variant="error"
                            size="sm"
                            onClick={() => handleReject(approval.id)}
                          >
                            拒绝
                          </PaperButton>
                        </>
                      )}
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            ))}
          </div>
        )}

        {/* Sent Tab */}
        {activeTab === 'sent' && (
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>已发送通知</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="text-center py-8 text-paper-ink-secondary">
                <div className="text-4xl mb-4">📤</div>
                <div className="text-lg mb-2">暂无已发送的通知</div>
                <div className="text-sm">您发送的通知将在这里显示</div>
              </div>
            </PaperCardContent>
          </PaperCard>
        )}
      </div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <PaperModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          title="通知详情"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getNotificationIcon(selectedNotification.type)}</div>
              <div>
                <h3 className="font-bold text-paper-ink">{selectedNotification.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedNotification.status)}`}>
                    {selectedNotification.status === 'unread' ? '未读' : selectedNotification.status === 'read' ? '已读' : '已归档'}
                  </span>
                  <span className="text-xs text-paper-ink-secondary">
                    {selectedNotification.createdAt}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-paper-background p-4 rounded-lg">
              <p className="text-sm text-paper-ink">{selectedNotification.content}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-paper-ink-secondary">发送者：</span>
                <span className="font-medium">{selectedNotification.sender}</span>
              </div>
              <div>
                <span className="text-paper-ink-secondary">接收者：</span>
                <span className="font-medium">{selectedNotification.recipient}</span>
              </div>
              <div>
                <span className="text-paper-ink-secondary">优先级：</span>
                <span className="font-medium">{selectedNotification.priority}</span>
              </div>
              <div>
                <span className="text-paper-ink-secondary">类型：</span>
                <span className="font-medium">{selectedNotification.type}</span>
              </div>
            </div>
            
            {selectedNotification.relatedEntity && (
              <div className="text-sm">
                <span className="text-paper-ink-secondary">关联：</span>
                <span className="font-medium">{selectedNotification.relatedEntity.name}</span>
              </div>
            )}
          </div>
        </PaperModal>
      )}

      {/* Approval Detail Modal */}
      {showApprovalModal && selectedApproval && (
        <PaperModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="审批详情"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-paper-ink mb-2">基本信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">申请编号：</span>{selectedApproval.id}</div>
                  <div><span className="text-paper-ink-secondary">标题：</span>{selectedApproval.title}</div>
                  <div><span className="text-paper-ink-secondary">类型：</span>{getTypeLabel(selectedApproval.type)}</div>
                  <div><span className="text-paper-ink-secondary">申请人：</span>{selectedApproval.requester} ({selectedApproval.requesterDepartment})</div>
                  {selectedApproval.amount && (
                    <div><span className="text-paper-ink-secondary">金额：</span><span className="font-bold text-paper-primary">¥{selectedApproval.amount.toLocaleString()}</span></div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-paper-ink mb-2">审批信息</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-paper-ink-secondary">状态：</span><span className={getStatusColor(selectedApproval.status)}>{selectedApproval.status === 'pending' ? '待审批' : selectedApproval.status === 'approved' ? '已批准' : selectedApproval.status === 'rejected' ? '已拒绝' : '已撤回'}</span></div>
                  <div><span className="text-paper-ink-secondary">优先级：</span>{selectedApproval.priority}</div>
                  <div><span className="text-paper-ink-secondary">提交时间：</span>{selectedApproval.submittedAt}</div>
                  <div><span className="text-paper-ink-secondary">进度：</span>{selectedApproval.currentStep}/{selectedApproval.totalSteps}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-paper-ink mb-2">申请描述</h4>
              <div className="text-sm bg-paper-background p-3 rounded-lg">{selectedApproval.description}</div>
            </div>
            
            <div>
              <h4 className="font-medium text-paper-ink mb-2">审批流程</h4>
              <div className="space-y-3">
                {selectedApproval.approvers.map((approver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-paper-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        approver.status === 'approved' ? 'bg-paper-success text-white' :
                        approver.status === 'rejected' ? 'bg-paper-error text-white' :
                        approver.status === 'pending' ? 'bg-paper-warning text-white' :
                        'bg-paper-border text-paper-ink-secondary'
                      }`}>
                        {approver.step}
                      </div>
                      <div>
                        <div className="font-medium">{approver.name}</div>
                        <div className="text-sm text-paper-ink-secondary">{approver.department}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        approver.status === 'approved' ? 'text-paper-success' :
                        approver.status === 'rejected' ? 'text-paper-error' :
                        approver.status === 'pending' ? 'text-paper-warning' :
                        'text-paper-ink-secondary'
                      }`}>
                        {approver.status === 'approved' ? '已批准' :
                         approver.status === 'rejected' ? '已拒绝' :
                         approver.status === 'pending' ? '待处理' : '未开始'}
                      </div>
                      {approver.comment && (
                        <div className="text-sm text-paper-ink-secondary mt-1">{approver.comment}</div>
                      )}
                      {approver.actionAt && (
                        <div className="text-xs text-paper-ink-secondary">{approver.actionAt}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedApproval.attachments && selectedApproval.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-paper-ink mb-2">附件</h4>
                <div className="space-y-2">
                  {selectedApproval.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-paper-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-paper-primary">📎</span>
                        <span className="text-sm font-medium">{attachment.name}</span>
                      </div>
                      <span className="text-xs text-paper-ink-secondary">{attachment.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedApproval.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4">
                <PaperButton variant="outline" onClick={() => handleReject(selectedApproval.id)}>
                  拒绝
                </PaperButton>
                <PaperButton variant="primary" onClick={() => handleApprove(selectedApproval.id)}>
                  批准
                </PaperButton>
              </div>
            )}
          </div>
        </PaperModal>
      )}
    </DashboardLayout>
  );
}
