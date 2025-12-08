'use client'

import React from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperButton } from '@/components/ui/paper-button'
import Link from 'next/link'

// 模拟对账单数据
const mockReconciliations = [
  {
    id: '1',
    customerName: '张三',
    period: '2024-01',
    totalAmount: 380000,
    reconciledAmount: 380000,
    status: 'completed',
    statusText: '已完成',
    salesOrders: [
      { id: '1', orderNo: 'SO202401010001', amount: 380000, reconciledAmount: 380000 }
    ],
    createdBy: '财务李四',
    createdAt: '2024-02-01T10:30:00'
  },
  {
    id: '2',
    customerName: '李四',
    period: '2024-01',
    totalAmount: 120000,
    reconciledAmount: 100000,
    discrepancyAmount: 20000,
    status: 'discrepancy',
    statusText: '有差异',
    salesOrders: [
      { id: '2', orderNo: 'SO202401010002', amount: 120000, reconciledAmount: 100000 }
    ],
    createdBy: '财务李四',
    createdAt: '2024-02-01T11:15:00'
  },
  {
    id: '3',
    customerName: '王五',
    period: '2024-01',
    totalAmount: 980000,
    reconciledAmount: 0,
    status: 'reconciling',
    statusText: '对账中',
    salesOrders: [
      { id: '3', orderNo: 'SO202401010003', amount: 980000, reconciledAmount: 0 }
    ],
    createdBy: '财务李四',
    createdAt: '2024-02-01T14:20:00'
  }
]

export default function ReconciliationsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">对账单管理</h1>
            <p className="text-ink-500 mt-1">管理对账单的全生命周期</p>
          </div>
          <PaperButton variant="primary">新建对账单</PaperButton>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>对账单列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-ink-600">对账单号</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">客户姓名</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">对账周期</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">总金额</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">已对账金额</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">差异金额</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建人</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">创建时间</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReconciliations.map((reconciliation) => (
                    <tr key={reconciliation.id} className="border-b hover:bg-paper-100">
                      <td className="py-3 px-4">{reconciliation.id}</td>
                      <td className="py-3 px-4">{reconciliation.customerName}</td>
                      <td className="py-3 px-4">{reconciliation.period}</td>
                      <td className="py-3 px-4">¥{reconciliation.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">¥{reconciliation.reconciledAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {reconciliation.discrepancyAmount ? (
                          <span className="text-red-600">¥{reconciliation.discrepancyAmount.toLocaleString()}</span>
                        ) : (
                          '-'  
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${reconciliation.status === 'completed' ? 'bg-green-100 text-green-800' : reconciliation.status === 'discrepancy' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {reconciliation.statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4">{reconciliation.createdBy}</td>
                      <td className="py-3 px-4">{new Date(reconciliation.createdAt).toLocaleString('zh-CN')}</td>
                      <td className="py-3 px-4">
                        <Link href={`/finance/reconciliations/${reconciliation.id}`} className="text-blue-600 hover:underline mr-2">详情</Link>
                        <button className="text-gray-600 hover:underline">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
