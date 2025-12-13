export type IconName =
  | 'trending-up'
  | 'users'
  | 'dollar-sign'
  | 'shopping-cart'
  | 'file-text'
  | 'alert-circle'
  | 'arrow-up-right'
  | 'arrow-down-right'
  | 'layout'
  | 'clock'
  | 'check-circle'
  | 'x-circle';

export type StatColor = 'success' | 'warning' | 'error' | 'info';
export type ActivityType = 'order' | 'customer' | 'payment' | 'alert' | 'system' | 'lead';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface DashboardStats {
  title: string;
  value: string;
  change: number;
  changeText: string;
  icon: IconName;
  color: StatColor;
}

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  status: StatColor;
}

export interface PendingTask {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  status: TaskStatus;
  link?: string; // Optional link to task detail
}

export interface DashboardData {
  stats: DashboardStats[];
  recentActivities: RecentActivity[];
  pendingTasks: PendingTask[];
}
