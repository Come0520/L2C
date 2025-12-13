'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

import { MeasurementTask } from '../types';

interface MeasurementDetailProps {
  task: MeasurementTask;
  onBack: () => void;
  onAssign?: () => void;
  onComplete?: () => void;
}

export function MeasurementDetail({ task, onBack, onAssign, onComplete }: MeasurementDetailProps) {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <PaperButton variant="outline" size="sm" onClick={onBack}>返回</PaperButton>
          <h1 className="text-2xl font-bold">测量任务详情</h1>
          <PaperBadge variant={getStatusBadgeVariant(task.status)}>
            {getStatusLabel(task.status)}
          </PaperBadge>
        </div>
        <div className="space-x-2">
          {task.status === 'pending' && onAssign && (
            <PaperButton variant="primary" onClick={onAssign}>分配任务</PaperButton>
          )}
          {task.status === 'assigned' && onComplete && (
            <PaperButton variant="success" onClick={onComplete}>完成测量</PaperButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>客户信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div>
              <label className="text-sm text-ink-500">客户姓名</label>
              <p className="font-medium">{task.customerName}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500">联系电话</label>
              <p className="font-medium">{task.customerPhone}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500">项目地址</label>
              <p className="font-medium">{task.address}</p>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>任务信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div>
              <label className="text-sm text-ink-500">任务编号</label>
              <p className="font-medium">{task.id}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500">关联订单</label>
              <p className="font-medium">{task.orderId}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500">测量员</label>
              <p className="font-medium">{task.assignedToName || '未分配'}</p>
            </div>
            <div>
              <label className="text-sm text-ink-500">预约时间</label>
              <p className="font-medium">
                {task.appointmentTime ? new Date(task.appointmentTime).toLocaleString() : '-'}
              </p>
            </div>
             {task.completedTime && (
                <div>
                  <label className="text-sm text-ink-500">完成时间</label>
                  <p className="font-medium">
                    {new Date(task.completedTime).toLocaleString()}
                  </p>
                </div>
            )}
            {task.remarks && (
                <div>
                  <label className="text-sm text-ink-500">备注</label>
                  <p className="font-medium text-ink-700 bg-paper-50 p-2 rounded">
                    {task.remarks}
                  </p>
                </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* Measurement Data Display (Placeholder) */}
      {task.status === 'completed' && task.measurements && (
         <PaperCard>
            <PaperCardHeader>
                <PaperCardTitle>测量数据</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
                <pre className="bg-paper-50 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(task.measurements, null, 2)}
                </pre>
            </PaperCardContent>
         </PaperCard>
      )}
    </div>
  );
}
