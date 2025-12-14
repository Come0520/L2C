'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'

import { ExportMenu } from '@/components/ui/export-menu'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { useExport } from '@/hooks/useExport'
import { reconciliationService } from '@/services/reconciliation.client'
import { ReconciliationStatement } from '@/shared/types/reconciliation'

export default function ReconciliationsPage() {
  const [statements, setStatements] = useState<ReconciliationStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'customer' | 'supplier'>('customer')

  useEffect(() => {
    async function fetchStatements() {
      setLoading(true)
      try {
        const data = await reconciliationService.getStatements(type)
        setStatements(data)
      } catch (error) {
        console.error('Failed to fetch statements:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStatements()
  }, [type])

  // 导出功能
  const { handleExport } = useExport<ReconciliationStatement>({
    filename: '对账单列表',
    columns: [
      { header: '对账单号', dataKey: 'statementNo' },
      { header: '对账对象', dataKey: 'targetName' },
      { header: '开始日期', dataKey: 'periodStart' },
      { header: '结束日期', dataKey: 'periodEnd' },
      { header: '总金额', dataKey: 'totalAmount', formatter: (val) => `¥${val?.toLocaleString()}` },
      { header: '状态', dataKey: 'status' },
      { header: '创建人', dataKey: 'createdBy' },
      { header: '创建时间', dataKey: 'createdAt', formatter: (val) => new Date(val).toLocaleDateString() },
    ]
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-text-primary">对账单管理</h1>
          <p className="text-theme-text-secondary mt-1">管理对账单的全生命周期</p>
        </div>
        <PaperButton variant="primary">新建对账单</PaperButton>
      </div>

      <PaperCard>
        <PaperCardHeader>
          <div className="flex justify-between items-center">
            <PaperCardTitle>对账单列表</PaperCardTitle>
            <div className="flex space-x-2">
              <PaperButton
                variant={type === 'customer' ? 'primary' : 'outline'}
                onClick={() => setType('customer')}
              >
                客户对账
              </PaperButton>
              <PaperButton
                variant={type === 'supplier' ? 'primary' : 'outline'}
                onClick={() => setType('supplier')}
              >
                供应商对账
              </PaperButton>
              <ExportMenu onExport={(format) => handleExport(statements, format)} />
            </div>
          </div>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="overflow-x-auto">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableCell>对账单号</PaperTableCell>
                  <PaperTableCell>对账对象</PaperTableCell>
                  <PaperTableCell>对账周期</PaperTableCell>
                  <PaperTableCell>总金额</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>创建人</PaperTableCell>
                  <PaperTableCell>创建时间</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableRow>
              </PaperTableHeader>
              <PaperTableBody>
                {loading ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={8} className="text-center py-8 text-ink-400">加载中...</PaperTableCell>
                  </PaperTableRow>
                ) : statements.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={8} className="text-center py-8 text-ink-400">暂无对账单</PaperTableCell>
                  </PaperTableRow>
                ) : (
                  statements.map((stmt) => (
                    <PaperTableRow key={stmt.id}>
                      <PaperTableCell>{stmt.statementNo}</PaperTableCell>
                      <PaperTableCell>{stmt.targetName}</PaperTableCell>
                      <PaperTableCell>{stmt.periodStart} ~ {stmt.periodEnd}</PaperTableCell>
                      <PaperTableCell>¥{stmt.totalAmount.toLocaleString()}</PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-sm ${stmt.status === 'settled' ? 'bg-success-100 text-success-800' :
                            stmt.status === 'confirmed' ? 'bg-primary-100 text-primary-800' :
                              'bg-theme-bg-tertiary text-theme-text-secondary'
                          }`}>
                          {stmt.status === 'draft' ? '草稿' : stmt.status === 'confirmed' ? '已确认' : '已结清'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>{stmt.createdBy}</PaperTableCell>
                      <PaperTableCell>{new Date(stmt.createdAt).toLocaleDateString()}</PaperTableCell>
                      <PaperTableCell>
                        <Link href={`/finance/reconciliations/${stmt.id}`} className="text-primary-600 hover:underline mr-2">详情</Link>
                        <button className="text-theme-text-secondary hover:underline">编辑</button>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))
                )}
              </PaperTableBody>
            </PaperTable>
          </div>
        </PaperCardContent>
      </PaperCard>
    </div>
  )
}
