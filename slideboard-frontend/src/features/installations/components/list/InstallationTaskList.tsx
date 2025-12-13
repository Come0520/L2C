'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

import { InstallationTask } from '../types';

interface InstallationTaskListProps {
  tasks: InstallationTask[];
  onAssign: (id: string) => void;
  onView: (id: string) => void;
  onComplete: (id: string) => void;
}

export function InstallationTaskList({ tasks, onAssign, onView, onComplete }: InstallationTaskListProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'assigned': return 'info';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待分配';
      case 'assigned': return '待安装';
      case 'in_progress': return '安装中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <PaperTable>
      <PaperTableHeader>
        <PaperTableCell>任务编号</PaperTableCell>
        <PaperTableCell>关联订单</PaperTableCell>
        <PaperTableCell>客户信息</PaperTableCell>
        <PaperTableCell>预约时间</PaperTableCell>
        <PaperTableCell>安装工</PaperTableCell>
        <PaperTableCell>状态</PaperTableCell>
        <PaperTableCell>操作</PaperTableCell>
      </PaperTableHeader>
      <PaperTableBody>
        {tasks.map(task => (
          <PaperTableRow key={task.id}>
            <PaperTableCell>{task.id.slice(0, 8)}</PaperTableCell>
            <PaperTableCell>{task.orderId}</PaperTableCell>
            <PaperTableCell>
              <div>
                <div className="font-medium">{task.customerName}</div>
                <div className="text-xs text-ink-500">{task.address}</div>
              </div>
            </PaperTableCell>
            <PaperTableCell>
              {task.appointmentTime ? new Date(task.appointmentTime).toLocaleString() : '-'}
            </PaperTableCell>
            <PaperTableCell>{task.assignedToName || '-'}</PaperTableCell>
            <PaperTableCell>
              <PaperBadge variant={getStatusBadgeVariant(task.status)}>
                {getStatusLabel(task.status)}
              </PaperBadge>
            </PaperTableCell>
            <PaperTableCell>
              <div className="flex gap-2">
                {task.status === 'pending' && (
                  <PaperButton size="sm" onClick={() => onAssign(task.id)}>分配</PaperButton>
                )}
                {task.status === 'assigned' && (
                   <PaperButton size="sm" variant="secondary" onClick={() => {}}>开始</PaperButton>
                )}
                 {task.status === 'in_progress' && (
                   <PaperButton size="sm" variant="success" onClick={() => onComplete(task.id)}>完成</PaperButton>
                )}
                <PaperButton size="sm" variant="outline" onClick={() => onView(task.id)}>详情</PaperButton>
              </div>
            </PaperTableCell>
          </PaperTableRow>
        ))}
        {tasks.length === 0 && (
          <PaperTableRow>
            <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
              暂无安装任务
            </PaperTableCell>
          </PaperTableRow>
        )}
      </PaperTableBody>
    </PaperTable>
  );
}
