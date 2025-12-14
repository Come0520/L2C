'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'

// 草稿/待签约订单类型定义
interface DraftOrder {
  id: string
  salesNo: string
  customerName: string
  customerPhone: string
  address: string
  totalAmount: number
  updatedAt: string
  status: 'draft' | 'pending_sign'
  salesPerson: string
}

export function DraftSignView() {
  const router = useRouter()
  
  // 模拟数据
  const [orders] = useState<DraftOrder[]>([
    {
      id: '1',
      salesNo: 'SO20241214001',
      customerName: '张三',
      customerPhone: '13800138000',
      address: '北京市朝阳区某某小区1号楼101',
      totalAmount: 12000,
      updatedAt: '2024-12-14 10:00',
      status: 'draft',
      salesPerson: '李销售'
    },
    {
      id: '2',
      salesNo: 'SO20241213002',
      customerName: '李四',
      customerPhone: '13900139000',
      address: '上海市浦东新区某某公寓',
      totalAmount: 25000,
      updatedAt: '2024-12-13 15:30',
      status: 'pending_sign',
      salesPerson: '王销售'
    }
  ])

  const handleCreateOrder = () => {
    // 假设有一个专门的创建页面路由，或者我们可以重用 OrderCreateView 但需要调整路由配置
    // 这里我们先假设跳转到 /orders/create，如果该路由不存在，可能需要创建或调整
    // 但根据之前的 route-access.ts，/orders/create 是存在的
    router.push('/orders/create')
  }

  const handleEditOrder = (id: string) => {
    router.push(`/orders/${id}/edit`)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 头部区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">开单</h1>
          <p className="text-ink-500 mt-1">管理草稿和待签约的订单</p>
        </div>
        <PaperButton
          variant="primary"
          onClick={handleCreateOrder}
        >
          新建订单
        </PaperButton>
      </div>

      {/* 统计卡片区域 - 可选 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-sm font-medium text-ink-500">草稿箱</div>
            <div className="text-3xl font-bold text-ink-800 mt-1">
              {orders.filter(o => o.status === 'draft').length}
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-sm font-medium text-ink-500">待签约</div>
            <div className="text-3xl font-bold text-ink-800 mt-1">
              {orders.filter(o => o.status === 'pending_sign').length}
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 订单列表 */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent px-6 py-4 flex justify-between items-center">
          <div className="text-sm font-medium text-ink-600">共 {orders.length} 条记录</div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell className="pl-6">销售单号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>地址</PaperTableCell>
              <PaperTableCell>总金额</PaperTableCell>
              <PaperTableCell>销售人员</PaperTableCell>
              <PaperTableCell>更新时间</PaperTableCell>
              <PaperTableCell>状态</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {orders.map(order => (
                <PaperTableRow key={order.id}>
                  <PaperTableCell className="pl-6">
                    <div className="font-mono text-xs text-gray-900">{order.salesNo}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-sm font-medium">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone}</div>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="text-xs text-gray-600 max-w-[200px] truncate" title={order.address}>
                      {order.address}
                    </div>
                  </PaperTableCell>
                  <PaperTableCell>
                    ¥{order.totalAmount.toLocaleString()}
                  </PaperTableCell>
                  <PaperTableCell>
                    {order.salesPerson}
                  </PaperTableCell>
                  <PaperTableCell>
                    {order.updatedAt}
                  </PaperTableCell>
                  <PaperTableCell>
                    <PaperBadge 
                      className={
                        order.status === 'draft' 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {order.status === 'draft' ? '草稿' : '待签约'}
                    </PaperBadge>
                  </PaperTableCell>
                  <PaperTableCell>
                    <div className="flex gap-2">
                      <PaperButton
                        size="small"
                        variant="primary"
                        onClick={() => handleEditOrder(order.id)}
                      >
                        编辑
                      </PaperButton>
                    </div>
                  </PaperTableCell>
                </PaperTableRow>
              ))}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination
            currentPage={1}
            totalPages={1}
            totalItems={orders.length}
            itemsPerPage={10}
            onPageChange={() => {}}
          />
        </PaperCardContent>
      </PaperCard>
    </div>
  )
}
