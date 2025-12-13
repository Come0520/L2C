import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

// Types remain the same
export interface TodoItem {
  id: string;
  title: string;
  role: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

// 模拟 API 调用函数
const fetchTodos = async (): Promise<TodoItem[]> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: 't1', title: '报价审批', role: 'LEAD_SALES', dueDate: '2024-01-16', status: 'pending', priority: 'high' },
    { id: 't2', title: '线索分配与复核', role: 'LEAD_SALES', dueDate: '2024-01-17', status: 'in-progress', priority: 'medium' },
    { id: 't3', title: '测量预约安排', role: 'SALES_STORE', dueDate: '2024-01-15', status: 'pending', priority: 'high' },
    { id: 't4', title: '远程报价发送', role: 'SALES_REMOTE', dueDate: '2024-01-18', status: 'in-progress', priority: 'medium' },
    { id: 't5', title: '发票开具与回款确认', role: 'OTHER_FINANCE', dueDate: '2024-01-20', status: 'pending', priority: 'high' },
    { id: 't6', title: '安装派单与进度确认', role: 'SERVICE_DISPATCH', dueDate: '2024-01-15', status: 'completed', priority: 'low' },
  ];
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
