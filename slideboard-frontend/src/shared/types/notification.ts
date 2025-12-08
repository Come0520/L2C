// 通知相关类型
export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'mention' | 'share' | 'system';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}