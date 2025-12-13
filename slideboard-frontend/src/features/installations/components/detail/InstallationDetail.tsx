'use client';

import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

import { InstallationTask } from '../types';

interface InstallationDetailProps {
  task: InstallationTask;
  onBack: () => void;
  onAssign?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export function InstallationDetail({ task, onBack, onAssign, onStart, onComplete }: InstallationDetailProps) {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <PaperButton variant="outline" size="sm" onClick={onBack}>返回</PaperButton>
          <h1 className="text-2xl font-bold">安装任务详情</h1>
          <PaperBadge variant={getStatusBadgeVariant(task.status)}>
            {getStatusLabel(task.status)}
          </PaperBadge>
        </div>
        <div className="space-x-2">
          {task.status === 'pending' && onAssign && (
            <PaperButton variant="primary" onClick={onAssign}>分配任务</PaperButton>
          )}
          {task.status === 'assigned' && onStart && (
             <PaperButton variant="secondary" onClick={onStart}>开始安装</PaperButton>
          )}
          {task.status === 'in_progress' && onComplete && (
            <PaperButton variant="success" onClick={onComplete}>完成安装</PaperButton>
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
              <label className="text-sm text-ink-500">安装工</label>
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

       {/* Items list would go here */}
       {task.items && task.items.length > 0 && (
           <PaperCard>
             <PaperCardHeader>
               <PaperCardTitle>安装项目</PaperCardTitle>
             </PaperCardHeader>
             <PaperCardContent>
               {/* Item list implementation */}
               <div className="text-sm text-ink-500">暂无项目详情展示</div>
             </PaperCardContent>
           </PaperCard>
       )}
    </div>
  );
}
