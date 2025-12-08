'use client';

import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperModal } from '@/components/ui/paper-modal';

import ApprovalList from './approval-list';
import NotificationFilters from './notification-filters';
import NotificationList from './notification-list';

// Types (exported for use in page.tsx)
export interface Notification {
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

interface NotificationsViewProps {
    initialNotifications: Notification[];
    initialApprovals: ApprovalRequest[];
}

export default function NotificationsView({ initialNotifications, initialApprovals }: NotificationsViewProps) {
    const [activeTab, setActiveTab] = useState<'notifications' | 'approvals' | 'sent'>('notifications');
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
    const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Use props as initial data, but in a real app we might want to update this state via server actions or revalidation
    const notifications = initialNotifications;
    const approvalRequests = initialApprovals;

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
        // 处理审批通过逻辑
        console.log('批准审批:', approvalId);
    };

    const handleReject = (approvalId: string) => {
        // 处理审批拒绝逻辑
        console.log('拒绝审批:', approvalId);
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    const pendingApprovalCount = approvalRequests.filter(a => a.status === 'pending').length;

    return (
        <div className="space-y-6">
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${activeTab === 'notifications'
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${activeTab === 'approvals'
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
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'sent'
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
            <NotificationFilters
                activeTab={activeTab}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                notificationFilter={notificationFilter}
                onNotificationFilterChange={setNotificationFilter}
                approvalFilter={approvalFilter}
                onApprovalFilterChange={setApprovalFilter}
            />

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <NotificationList
                    notifications={filteredNotifications}
                    onNotificationClick={(notification) => {
                        setSelectedNotification(notification);
                        setShowNotificationModal(true);
                    }}
                    onMarkAsRead={(id) => {
                        // TODO: 实现标记已读逻辑
                        console.log('标记已读:', id);
                    }}
                />
            )}

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
                <ApprovalList
                    approvals={filteredApprovals}
                    onApprovalClick={(approval) => {
                        setSelectedApproval(approval);
                        setShowApprovalModal(true);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
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

            {/* Notification Detail Modal */}
            {showNotificationModal && selectedNotification && (
                <PaperModal
                    isOpen={showNotificationModal}
                    onClose={() => setShowNotificationModal(false)}
                    title="通知详情"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">
                                {selectedNotification.type === 'info' ? 'ℹ️' :
                                    selectedNotification.type === 'warning' ? '⚠️' :
                                        selectedNotification.type === 'success' ? '✅' :
                                            selectedNotification.type === 'error' ? '❌' :
                                                selectedNotification.type === 'system' ? '🔧' : '📢'}
                            </div>
                            <div>
                                <h3 className="font-bold text-paper-ink">{selectedNotification.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedNotification.status === 'unread' ? 'bg-paper-primary-light text-paper-primary' :
                                            selectedNotification.status === 'read' ? 'bg-paper-ink-light text-paper-ink-secondary' :
                                                'bg-paper-border text-paper-ink-secondary'
                                        }`}>
                                        {selectedNotification.status === 'unread' ? '未读' :
                                            selectedNotification.status === 'read' ? '已读' : '已归档'}
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
                                    <div><span className="text-paper-ink-secondary">类型:</span><span className="font-medium">{selectedApproval.type === 'order' ? '订单' : selectedApproval.type === 'expense' ? '费用' : selectedApproval.type === 'discount' ? '折扣' : selectedApproval.type === 'contract' ? '合同' : selectedApproval.type === 'leave' ? '请假' : selectedApproval.type === 'procurement' ? '采购' : selectedApproval.type}</span></div>
                                    <div><span className="text-paper-ink-secondary">申请人：</span>{selectedApproval.requester} ({selectedApproval.requesterDepartment})</div>
                                    {selectedApproval.amount && (
                                        <div><span className="text-paper-ink-secondary">金额：</span><span className="font-bold text-paper-primary">¥{selectedApproval.amount.toLocaleString()}</span></div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-paper-ink mb-2">审批信息</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-paper-ink-secondary">状态:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${selectedApproval.status === 'pending' ? 'bg-paper-warning-light text-paper-warning' :
                                                selectedApproval.status === 'approved' ? 'bg-paper-success-light text-paper-success' :
                                                    selectedApproval.status === 'rejected' ? 'bg-paper-error-light text-paper-error' :
                                                        'bg-paper-ink-light text-paper-ink-secondary'
                                            }`}>
                                            {selectedApproval.status === 'pending' ? '待审批' :
                                                selectedApproval.status === 'approved' ? '已批准' :
                                                    selectedApproval.status === 'rejected' ? '已拒绝' : '已撤回'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-paper-ink-secondary">优先级:</span>
                                        {selectedApproval.priority}
                                    </div>
                                    <div>
                                        <span className="text-paper-ink-secondary">提交时间:</span>
                                        {selectedApproval.submittedAt}
                                    </div>
                                    <div>
                                        <span className="text-paper-ink-secondary">进度:</span>
                                        {selectedApproval.currentStep}/{selectedApproval.totalSteps}
                                    </div>
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
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${approver.status === 'approved' ? 'bg-paper-success text-white' :
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
                                            <div className={`font-medium ${approver.status === 'approved' ? 'text-paper-success' :
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
        </div>
    );
}
