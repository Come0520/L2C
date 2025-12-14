'use client';

import { Clock } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { PendingTask } from '@/shared/types/dashboard';

interface TaskItemProps {
  task: PendingTask;
}

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
    case 'medium': return 'bg-amber-500';
    default: return 'bg-blue-500';
  }
};

export const TaskItem = React.memo(({ task }: TaskItemProps) => {
  return (
    <li className="flex items-center justify-between p-4 border-b border-theme-border last:border-0 hover:bg-theme-bg-tertiary transition-colors">
      <div className="flex items-center space-x-4">
        <div className={cn("h-2 w-2 rounded-full", getPriorityStyles(task.priority))} />
        <div>
          <p className="text-sm font-medium text-theme-text-primary">{task.title}</p>
          <div className="flex items-center mt-1 space-x-3 text-xs text-theme-text-secondary">
            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {task.dueDate}</span>
            <span>•</span>
            <span>{task.assignee}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center">
         <span className={cn(
            "px-2.5 py-0.5 rounded text-xs font-medium border",
            task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            task.status === 'in-progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-theme-bg-tertiary text-theme-text-secondary border-theme-border'
         )}>
            {task.status === 'completed' ? '已完成' :
             task.status === 'in-progress' ? '进行中' : '待处理'}
         </span>
      </div>
    </li>
  );
});

TaskItem.displayName = 'TaskItem';
