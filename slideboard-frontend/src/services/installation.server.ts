import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

type InstallationTaskRow = Database['public']['Tables']['installation_tasks']['Row']

export interface InstallationTask {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  projectAddress: string;
  address: string; // 兼容组件使用的 address 字段
  assignedTo: string | null;
  assignedByName: string | null;
  assignedToName: string | null; // 兼容组件使用的 assignedToName 字段
  scheduledTime: string | null;
  appointmentTime: string | null; // 兼容组件使用的 appointmentTime 字段
  completedTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getInstallationTasks(): Promise<InstallationTask[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('installation_tasks')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return (data || []).map(mapDbToInstallationTask)
}

export async function getInstallationTaskById(id: string): Promise<InstallationTask | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('installation_tasks')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
    }

    return mapDbToInstallationTask(data)
}

function mapDbToInstallationTask(row: InstallationTaskRow): InstallationTask {
    return {
        id: row.id,
        orderId: row.order_id,
        status: row.status,
        customerName: row.customer_name,
        projectAddress: row.project_address,
        address: row.project_address, // 兼容组件使用的 address 字段
        assignedTo: row.assigned_to,
        assignedByName: row.assigned_by_name,
        assignedToName: row.assigned_by_name, // 兼容组件使用的 assignedToName 字段
        scheduledTime: row.scheduled_time,
        appointmentTime: row.scheduled_time, // 兼容组件使用的 appointmentTime 字段
        completedTime: row.completed_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}