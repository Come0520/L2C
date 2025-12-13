import { Suspense } from 'react';

import { createClient } from '@/lib/supabase/server';

import { ApprovalRequest } from './components/ApprovalList';
import { Notification } from './components/NotificationList';
import NotificationsView from './components/NotificationsView';
import NotificationsLoading from './loading';

async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    type: item.type as any,
    priority: 'medium' as const,
    sender: '系统',
    recipient: '我',
    createdAt: item.created_at,
    status: item.is_read ? 'read' : 'unread',
    readAt: undefined,
    relatedEntity: {
      type: item.related_entity_type,
      id: item.related_entity_id,
      name: '详情'
    }
  } as any));
}

async function getApprovals(): Promise<ApprovalRequest[]> {
  // Simulate network delay for streaming demonstration
  // await new Promise(resolve => setTimeout(resolve, 1500)); 
  // Commented out delay to improve perceived performance since we are blocking

  return [
    {
      id: 'APP001',
      title: '项目A阶段费用报销',
      description: '项目A阶段施工费用报销申请，包含材料费、人工费等，总计金额：¥45,000',
      type: 'expense',
      requester: '李工程师',
      requesterDepartment: '工程部',
      amount: 45000,
      submittedAt: '2024-01-15 15:20:10',
      status: 'pending',
      priority: 'medium',
      currentStep: 2,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '王项目经理',
          department: '项目部',
          status: 'approved',
          comment: '费用合理，同意报销',
          actionAt: '2024-01-15 16:30:25'
        },
        {
          step: 2,
          name: '财务经理',
          department: '财务部',
          status: 'pending'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ],
      attachments: [
        { name: '费用明细表.pdf', url: '#', size: '2.3MB' },
        { name: '发票扫描件.zip', url: '#', size: '15.6MB' }
      ]
    },
    {
      id: 'APP002',
      title: '大额订单折扣申请',
      description: '客户"创新科技"订单金额超过¥100,000，申请10%折扣优惠',
      type: 'discount',
      requester: '张销售',
      requesterDepartment: '销售部',
      amount: 12000,
      submittedAt: '2024-01-15 14:15:30',
      status: 'pending',
      priority: 'high',
      currentStep: 1,
      totalSteps: 2,
      approvers: [
        {
          step: 1,
          name: '销售总监',
          department: '销售部',
          status: 'pending'
        },
        {
          step: 2,
          name: '总经理',
          department: '管理层',
          status: 'pending'
        }
      ]
    },
    {
      id: 'APP003',
      title: '采购合同审批',
      description: '与"金牌建材"签订年度采购合同，合同金额：¥500,000',
      type: 'contract',
      requester: '采购专员',
      requesterDepartment: '采购部',
      amount: 500000,
      submittedAt: '2024-01-14 10:30:45',
      status: 'approved',
      priority: 'urgent',
      currentStep: 3,
      totalSteps: 3,
      approvers: [
        {
          step: 1,
          name: '采购经理',
          department: '采购部',
          status: 'approved',
          comment: '合同条款合理',
          actionAt: '2024-01-14 11:45:20'
        },
        {
          step: 2,
          name: '法务专员',
          department: '法务部',
          status: 'approved',
          comment: '法律条款无问题',
          actionAt: '2024-01-14 14:20:15'
        },
        {
          step: 3,
          name: '总经理',
          department: '管理层',
          status: 'approved',
          comment: '同意签署',
          actionAt: '2024-01-15 09:15:30'
        }
      ],
      attachments: [
        { name: '采购合同.pdf', url: '#', size: '3.2MB' },
        { name: '供应商资质证明.pdf', url: '#', size: '1.8MB' }
      ]
    }
  ] as ApprovalRequest[];
}

export default async function NotificationsPage() {
  const [notifications, approvals] = await Promise.all([
    getNotifications(),
    getApprovals()
  ]);

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">通知中心</h1>
        <NotificationsView 
          notifications={notifications} 
          approvals={approvals} 
        />
      </div>
  );
}
