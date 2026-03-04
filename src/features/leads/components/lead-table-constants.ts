import { getLeads } from '@/features/leads/actions/queries';

// 从查询推断类型
export type LeadData = Awaited<ReturnType<typeof getLeads>>['data'][number];

// 状态映射
export const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING_ASSIGNMENT: { label: '待分配', variant: 'secondary' },
  PENDING_FOLLOWUP: { label: '待跟进', variant: 'default' },
  FOLLOWING_UP: { label: '跟进中', variant: 'default' },
  WON: { label: '已成交', variant: 'outline' },
  INVALID: { label: '无效', variant: 'destructive' },
};

// 意向等级映射
export const INTENTION_MAP: Record<string, { label: string; className: string }> = {
  HIGH: { label: '高', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  MEDIUM: {
    label: '中',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  LOW: { label: '低', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

// 系统标签映射
export const SYSTEM_TAGS: Record<string, { label: string; className: string }> = {
  INVITED: { label: '已邀约', className: 'bg-blue-100 text-blue-700' },
  QUOTED: { label: '已报价', className: 'bg-green-100 text-green-700' },
  VISITED: { label: '已到店', className: 'bg-purple-100 text-purple-700' },
  MEASURED: { label: '已测量', className: 'bg-orange-100 text-orange-700' },
};
