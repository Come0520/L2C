import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

// Types remain the same
export interface TodoItem {
  id: string;
  title: string;
  role: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

// 真实 API 调用函数
const fetchTodos = async (): Promise<TodoItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Fetch assigned leads that need follow-up
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, status, last_status_change_at')
    .eq('assigned_to_id', user.id)
    .in('status', ['PENDING_FOLLOW_UP', 'FOLLOWING_UP'])
    .order('last_status_change_at', { ascending: true })
    .limit(5);

  // 2. Fetch assigned measurement tasks
  const { data: measurements } = await supabase
    .from('measurement_orders')
    .select('id, status, scheduled_at, sales_orders(customer:customers(name))')
    .eq('measurer_id', user.id)
    .in('status', ['pending_measurement', 'measuring_pending_visit'])
    .limit(5);

  // 3. Fetch assigned installation tasks
  const { data: installations } = await supabase
    .from('installation_orders')
    .select('id, status, scheduled_at, sales_orders(customer:customers(name))')
    .eq('installer_id', user.id)
    .in('status', ['pending_installation', 'installing_pending_visit'])
    .limit(5);

  const todoItems: TodoItem[] = [];

  // Map leads to todos
  leads?.forEach((lead: any) => {
    todoItems.push({
      id: `lead-${lead.id}`,
      title: `跟进线索: ${lead.name}`,
      role: 'SALES', // Generalized role
      dueDate: lead.last_status_change_at ? new Date(new Date(lead.last_status_change_at).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: 'high'
    });
  });

  // Map measurements to todos
  measurements?.forEach((m: any) => {
    todoItems.push({
      id: `measure-${m.id}`,
      title: `测量任务: ${m.sales_orders?.customer?.name || '未知客户'}`,
      role: 'MEASURER',
      dueDate: m.scheduled_at ? m.scheduled_at.split('T')[0] : '待定',
      status: 'pending',
      priority: 'medium'
    });
  });

  // Map installations to todos
  installations?.forEach((i: any) => {
    todoItems.push({
      id: `install-${i.id}`,
      title: `安装任务: ${i.sales_orders?.customer?.name || '未知客户'}`,
      role: 'INSTALLER',
      dueDate: i.scheduled_at ? i.scheduled_at.split('T')[0] : '待定',
      status: 'pending',
      priority: 'medium'
    });
  });

  return todoItems;
};

export const ROLE_MAP: Record<string, string> = {
  'LEAD_SALES': '销售主管',
  'SALES_STORE': '门店销售',
  'SALES_REMOTE': '远程销售',
  'OTHER_FINANCE': '财务专员',
  'SERVICE_DISPATCH': '服务调度',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  'completed': { label: '已完成', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  'in-progress': { label: '进行中', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  'pending': { label: '待处理', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  'high': { 
    label: '高', 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500/10', 
    borderColor: 'border-rose-500/20',
    dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
  },
  'medium': { 
    label: '中', 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/20',
    dotColor: 'bg-amber-500'
  },
  'low': { 
    label: '低', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10', 
    borderColor: 'border-blue-500/20',
    dotColor: 'bg-blue-500'
  },
};

export const useTodos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 使用 useQuery 获取数据
  const { data: todos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  // 可以添加过滤、排序等逻辑
  const filteredTodos = todos.filter(todo => 
    todo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    todos: filteredTodos,
    searchTerm,
    setSearchTerm,
    isLoading,
    isError,
    refetch,
    totalCount: todos.length,
  };
};
