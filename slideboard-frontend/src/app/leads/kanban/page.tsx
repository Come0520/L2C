import { Suspense } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { LeadItem } from '@/types/lead'

import KanbanContent from './components/kanban-content'
import KanbanLoading from './loading'


// 异步获取看板数据（模拟数据获取）
async function getKanbanData(): Promise<LeadItem[]> {
  // 在真实应用中，这里应该是从API获取数据
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1200))

  // 返回模拟数据
  return [
    {
      id: 'LEAD001',
      leadNumber: 'L2024001',
      customerName: '张三',
      phone: '13800138000',
      projectAddress: '北京市朝阳区',
      requirements: ['全屋定制'],
      budgetMin: 100000,
      budgetMax: 200000,
      status: 'PENDING_ASSIGNMENT',
      customerLevel: 'A',
      businessTags: ['high-intent'],
      currentOwner: { name: '李四' },
      createdAt: new Date().toISOString(),
      lastFollowUpAt: new Date().toISOString(),
      source: '自然流量'
    },
    {
      id: 'LEAD002',
      leadNumber: 'L2024002',
      customerName: '李四',
      phone: '13900139000',
      projectAddress: '上海市浦东新区',
      requirements: ['橱柜'],
      budgetMin: 50000,
      budgetMax: 80000,
      status: 'PENDING_FOLLOW_UP',
      customerLevel: 'B',
      businessTags: ['quoted'],
      currentOwner: { name: '王五' },
      createdAt: new Date().toISOString(),
      lastFollowUpAt: new Date().toISOString(),
      source: '广告投放'
    },
    {
      id: 'LEAD003',
      leadNumber: 'L2024003',
      customerName: '王五',
      phone: '13700137000',
      projectAddress: '广州市天河区',
      requirements: ['衣柜'],
      budgetMin: 30000,
      budgetMax: 50000,
      status: 'FOLLOWING_UP',
      customerLevel: 'A',
      businessTags: ['appointment'],
      currentOwner: { name: '赵六' },
      createdAt: new Date().toISOString(),
      lastFollowUpAt: new Date().toISOString(),
      source: '转介绍'
    },
    {
      id: 'LEAD004',
      leadNumber: 'L2024004',
      customerName: '赵六',
      phone: '13600136000',
      projectAddress: '深圳市南山区',
      requirements: ['全屋定制'],
      budgetMin: 150000,
      budgetMax: 300000,
      status: 'DRAFT_SIGNED',
      customerLevel: 'A',
      businessTags: ['measured'],
      currentOwner: { name: '孙七' },
      createdAt: new Date().toISOString(),
      lastFollowUpAt: new Date().toISOString(),
      source: '自然流量'
    }
  ] as unknown as LeadItem[] as unknown as LeadItem[]
}

// 异步组件：看板数据加载
async function KanbanDataProvider() {
  const leadsData = await getKanbanData()
  return <KanbanContent initialData={leadsData} />
}

export default function LeadsKanbanPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">线索看板</h1>

        {/* 使用Suspense包裹看板内容，实现流式加载 */}
        <Suspense fallback={<KanbanLoading />}>
          <KanbanDataProvider />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
