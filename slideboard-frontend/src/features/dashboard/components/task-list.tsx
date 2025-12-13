import React from 'react';

import { PendingTask } from '@/shared/types/dashboard';

import { TaskItem } from './task-item';

interface TaskListProps {
  tasks: PendingTask[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <ul className="divide-y divide-theme-border">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
