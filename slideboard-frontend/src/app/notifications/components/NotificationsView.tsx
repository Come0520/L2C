'use client';

import React from 'react';
import { PaperButton } from '@/components/ui/paper-button';
import ApprovalList, { ApprovalRequest } from './ApprovalList';
import NotificationList, { Notification } from './NotificationList';

interface NotificationsViewProps {
  notifications: Notification[];
  approvals: ApprovalRequest[];
}

export default function NotificationsView({ notifications, approvals }: NotificationsViewProps) {
  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification.id);
  };

  const handleMarkAsRead = (id: string) => {
    console.log('Mark as read:', id);
  };

  const handleApprovalClick = (approval: ApprovalRequest) => {
    console.log('Approval clicked:', approval.id);
  };

  const handleApprove = (id: string) => {
    console.log('Approve:', id);
  };

  const handleReject = (id: string) => {
    console.log('Reject:', id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-800">通知消息</h2>
          <PaperButton variant="outline" size="small">
            全部已读
          </PaperButton>
        </div>
        <NotificationList
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-800">审批任务</h2>
          <PaperButton variant="primary" size="small">
            发起审批
          </PaperButton>
        </div>
        <ApprovalList
          approvals={approvals}
          onApprovalClick={handleApprovalClick}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}
