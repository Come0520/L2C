import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/notification'

const supabase = createClient()

// 创建通知请求
interface CreateNotificationRequest {
  user_id: string;
  type: 'comment' | 'mention' | 'share' | 'system' | 'installation';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async getNotifications(limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
  
  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },
  
  async markAllRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) throw error
  },
  
  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
  
  /**
   * 创建安装相关通知
   */
  async createInstallationNotification(
    data: CreateNotificationRequest & { installationId: string }
  ) {
    const { installationId, ...notificationData } = data;
    
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        is_read: false,
        metadata: {
          ...notificationData.metadata,
          installationId
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    return newNotification as Notification;
  },
  
  /**
   * 获取安装相关通知
   */
  async getInstallationNotifications(installationId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .ilike('metadata->installationId', `%${installationId}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Notification[];
  }
}
