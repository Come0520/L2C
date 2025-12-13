'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

import { MeasurementTask } from '../types';

interface MeasurementTaskListProps {
  tasks: MeasurementTask[];
  onAssign: (id: string) => void;
  onView: (id: string) => void;
}

export function MeasurementTaskList({ tasks, onAssign, onView }: MeasurementTaskListProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'assigned': return 'primary';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待分配';
      case 'assigned': return '已分配';
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
        <PaperTableCell>测量员</PaperTableCell>
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
                <PaperButton size="sm" variant="outline" onClick={() => onView(task.id)}>详情</PaperButton>
              </div>
            </PaperTableCell>
          </PaperTableRow>
        ))}
        {tasks.length === 0 && (
          <PaperTableRow>
            <PaperTableCell colSpan={7} className="text-center py-8 text-ink-400">
              暂无测量任务
            </PaperTableCell>
          </PaperTableRow>
        )}
      </PaperTableBody>
    </PaperTable>
  );
}
