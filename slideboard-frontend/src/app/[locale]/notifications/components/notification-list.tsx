'use client';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { VirtualList } from '@/components/ui/virtual-list';

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

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
}

/**
 * 通知列表组件
 * 使用虚拟滚动渲染通知列表,提高性能
 */
export default function NotificationList({
  notifications,
  onNotificationClick,
  onMarkAsRead,
}: NotificationListProps) {
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
      default: return 'bg-paper-border text-paper-ink';
    }
  };

  return (
    <VirtualList
      items={notifications}
      containerHeight={600}
      itemHeight={160}
      renderItem={(notification) => (
        <PaperCard
          key={notification.id}
          className={`${getPriorityColor(notification.priority)} ${notification.status === 'unread' ? 'bg-paper-background' : ''
            }`}
        >
          <PaperCardContent>
            <div className="flex items-start gap-4">
              <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`font-medium ${notification.status === 'unread'
                        ? 'text-paper-ink'
                        : 'text-paper-ink-secondary'
                      }`}
                  >
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)
                        }`}
                    >
                      {notification.status === 'unread'
                        ? '未读'
                        : notification.status === 'read'
                          ? '已读'
                          : '已归档'}
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
                      onClick={() => onNotificationClick(notification)}
                    >
                      查看详情
                    </PaperButton>
                    {notification.status === 'unread' && onMarkAsRead && (
                      <PaperButton
                        variant="primary"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        标记已读
                      </PaperButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}
    />
  );
}
