import { MeasurementAssignFormData, MeasurementCompleteFormData } from '@/features/measurement/schemas/measurement-schema';
import { MeasurementTask } from '@/features/measurement/types';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export const measurementService = {
  /**
   * 获取测量任务列表
   */
  async getTasks(filters?: { status?: string; assignedTo?: string }) {
    let query = supabase
      .from('measurement_orders')
      .select(`
        id,
        status,
        scheduled_at,
        created_at,
        measurer_id,
        sales_order_id,
        measurement_no,
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
      query = query.eq('measurer_id', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching measurement tasks:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      orderId: item.sales_orders?.sales_no || item.sales_order_id || '', 
      customerName: item.sales_orders?.customer?.name || '未知客户',
      customerPhone: item.sales_orders?.customer?.phone || '', 
      address: item.sales_orders?.customer?.project_address || '', 
      status: item.status,
      assignedTo: item.measurer_id,
      appointmentTime: item.scheduled_at,
      createdAt: item.created_at,
    })) as MeasurementTask[];
  },

  /**
   * 获取单个测量任务详情
   */
  async getTaskById(id: string) {
    const { data, error } = await supabase
      .from('measurement_orders')
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
      assignedTo: item.measurer_id,
      appointmentTime: item.scheduled_at,
    } as MeasurementTask;
  },

  /**
   * 分配测量任务
   */
  async assignTask(id: string, data: MeasurementAssignFormData) {
    const { error } = await (supabase
      .from('measurement_orders') as any)
      .update({
        measurer_id: data.assignedTo,
        scheduled_at: data.appointmentTime,
        status: 'measuring_pending_visit',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * 完成测量任务
   */
  async completeTask(id: string, data: MeasurementCompleteFormData) {
    const { error } = await (supabase
      .from('measurement_orders') as any)
      .update({
        status: 'measuring_pending_confirmation',
        completed_at: data.completedTime,
        measurement_data: data as any,
        measurement_photos: data.images,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
  
  /**
   * 取消测量任务
   */
  async cancelTask(id: string, _reason?: string) {
      const { error } = await (supabase
      .from('measurement_orders') as any)
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

      if (error) throw error;
      return true;
  },
  
  /**
   * 申请重新分配测量任务
   */
  async requestReassign(id: string, reason: string) {
      const { error } = await (supabase
      .from('measurement_orders') as any)
      .update({
        status: 'measuring_pending_assignment',
        reassignment_reason: reason,
        measurer_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

      if (error) throw error;
      return true;
  }
};
