'use client';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperInput } from '@/components/ui/paper-input';

interface NotificationFiltersProps {
  activeTab: 'notifications' | 'approvals' | 'sent';
  searchTerm: string;
  onSearchChange: (value: string) => void;
  notificationFilter: 'all' | 'unread' | 'read' | 'archived';
  onNotificationFilterChange: (filter: 'all' | 'unread' | 'read' | 'archived') => void;
  approvalFilter: 'all' | 'pending' | 'approved' | 'rejected';
  onApprovalFilterChange: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
}

/**
 * 通知和审批的搜索与筛选组件
 * 根据当前激活的标签页显示不同的筛选选项
 */
export default function NotificationFilters({
  activeTab,
  searchTerm,
  onSearchChange,
  notificationFilter,
  onNotificationFilterChange,
  approvalFilter,
  onApprovalFilterChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      {/* 搜索框 */}
      <PaperInput
        placeholder="搜索通知或审批..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />

      {/* 通知筛选器 */}
      {activeTab === 'notifications' && (
        <div className="flex gap-2">
          <PaperButton
            variant={notificationFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onNotificationFilterChange('all')}
          >
            全部
          </PaperButton>
          <PaperButton
            variant={notificationFilter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onNotificationFilterChange('unread')}
          >
            未读
          </PaperButton>
          <PaperButton
            variant={notificationFilter === 'read' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onNotificationFilterChange('read')}
          >
            已读
          </PaperButton>
        </div>
      )}

      {/* 审批筛选器 */}
      {activeTab === 'approvals' && (
        <div className="flex gap-2">
          <PaperButton
            variant={approvalFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onApprovalFilterChange('all')}
          >
            全部
          </PaperButton>
          <PaperButton
            variant={approvalFilter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onApprovalFilterChange('pending')}
          >
            待审批
          </PaperButton>
          <PaperButton
            variant={approvalFilter === 'approved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onApprovalFilterChange('approved')}
          >
            已批准
          </PaperButton>
          <PaperButton
            variant={approvalFilter === 'rejected' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onApprovalFilterChange('rejected')}
          >
            已拒绝
          </PaperButton>
        </div>
      )}
    </div>
  );
}
