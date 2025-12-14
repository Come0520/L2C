import { InstallationAssignFormData, InstallationCompleteFormData } from '@/features/installations/schemas/installation';
import { InstallationTask } from '@/features/installations/types';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const installationService = {
  /**
   * 获取安装任务列表
   */
  async getTasks(filters?: { status?: string; assignedTo?: string }) {
    let query = supabase
      .from('installation_orders')
      .select(`
        id,
        status,
        scheduled_at,
        created_at,
        installer_id,
        sales_order_id,
        installation_no,
        sales_orders (
            id,
            sales_no,
            customer:customers (
                name,
                phone,
                project_address
            )
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.assignedTo) {
      query = query.eq('installer_id', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching installation tasks:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      orderId: item.sales_orders?.sales_no || item.sales_order_id || '',
      customerName: item.sales_orders?.customer?.name || '未知客户',
      customerPhone: item.sales_orders?.customer?.phone || '',
      address: item.sales_orders?.customer?.project_address || '',
      status: item.status,
      assignedTo: item.installer_id,
      appointmentTime: item.scheduled_at,
      createdAt: item.created_at,
    })) as InstallationTask[];
  },

  /**
   * 获取单个安装任务详情
   */
  async getTaskById(id: string) {
    const { data, error } = await supabase
      .from('installation_orders')
      .select(`
        *,
        sales_orders (
            id,
            sales_no,
            customer:customers (
                name,
                phone,
                project_address
            )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    const item = data as any;

    return {
      id: item.id,
      orderId: item.sales_orders?.sales_no || item.sales_order_id,
      customerName: item.sales_orders?.customer?.name || '未知客户',
      customerPhone: item.sales_orders?.customer?.phone || '',
      address: item.sales_orders?.customer?.project_address || '',
      status: item.status,
      createdAt: item.created_at,
      assignedTo: item.installer_id,
      appointmentTime: item.scheduled_at,
    } as InstallationTask;
  },

  /**
   * 分配安装任务
   */
  async assignTask(id: string, data: InstallationAssignFormData) {
    const { error } = await (supabase
      .from('installation_orders') as any)
      .update({
        installer_id: data.assignedTo,
        scheduled_at: data.appointmentTime,
        status: 'installing_pending_visit',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * 开始安装任务
   */
  async startTask(id: string) {
      const { error } = await (supabase
      .from('installation_orders') as any)
      .update({
        status: 'installing',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

      if (error) throw error;
      return true;
  },

  /**
   * 完成安装任务
   */
  async completeTask(id: string, data: InstallationCompleteFormData) {
    const { error } = await (supabase
      .from('installation_orders') as any)
      .update({
        status: 'installing_pending_confirmation',
        completed_at: data.completedTime,
        installation_photos: data.images,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
  
  /**
   * 取消安装任务
   */
  async cancelTask(id: string, reason?: string) {
      const { error } = await (supabase
      .from('installation_orders') as any)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

      if (error) throw error;
      return true;
  }
};
