'use client'

import { MapPin, DollarSign } from 'lucide-react'
import React from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperSelect } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table'

interface PartnerItem {
  id: string
  name: string
  region: string
  level: 'A' | 'B' | 'C'
  contractStatus: 'active' | 'inactive' | 'pending'
  settlementCycle: 'monthly' | 'quarterly' | 'semiannual'
  pricingSystem: 'standard' | 'custom' | 'rebate'
  sla: 'excellent' | 'good' | 'risk'
  reconciliationStatus: 'on_track' | 'overdue' | 'auditing'
  amount: number
  grossMargin: number
  fulfillmentRate: number
  returnRate: number
  reconciliationRate: number
  lastInteraction: string
}

const levelOptions = [
  { value: '', label: '全部' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const contractOptions = [
  { value: '', label: '全部' },
  { value: 'active', label: '有效' },
  { value: 'pending', label: '待生效' },
  { value: 'inactive', label: '失效' },
]

const cycleOptions = [
  { value: '', label: '全部' },
  { value: 'monthly', label: '月度' },
  { value: 'quarterly', label: '季度' },
  { value: 'semiannual', label: '半年' },
]

const pricingOptions = [
  { value: '', label: '全部' },
  { value: 'standard', label: '标准价' },
  { value: 'custom', label: '自定义' },
  { value: 'rebate', label: '返利' },
]

const slaOptions = [
  { value: '', label: '全部' },
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'risk', label: '风险' },
]

const reconciliationOptions = [
  { value: '', label: '全部' },
  { value: 'on_track', label: '正常' },
  { value: 'overdue', label: '逾期' },
  { value: 'auditing', label: '审计中' },
]

export default function CooperativePage() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [level, setLevel] = React.useState('')
  const [contractStatus, setContractStatus] = React.useState('')
  const [settlementCycle, setSettlementCycle] = React.useState('')
  const [pricingSystem, setPricingSystem] = React.useState('')
  const [sla, setSla] = React.useState('')
  const [reconciliationStatus, setReconciliationStatus] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const partners: PartnerItem[] = [
    { id: 'p1', name: '华艺装饰集团', region: '上海', level: 'A', contractStatus: 'active', settlementCycle: 'monthly', pricingSystem: 'rebate', sla: 'excellent', reconciliationStatus: 'on_track', amount: 1260000, grossMargin: 28.5, fulfillmentRate: 96.2, returnRate: 1.8, reconciliationRate: 98.3, lastInteraction: '2024-01-15' },
    { id: 'p2', name: '博雅装饰', region: '杭州', level: 'B', contractStatus: 'pending', settlementCycle: 'quarterly', pricingSystem: 'standard', sla: 'good', reconciliationStatus: 'auditing', amount: 540000, grossMargin: 22.1, fulfillmentRate: 92.5, returnRate: 3.2, reconciliationRate: 94.0, lastInteraction: '2024-01-14' },
    { id: 'p3', name: '盛世装企', region: '深圳', level: 'C', contractStatus: 'active', settlementCycle: 'semiannual', pricingSystem: 'custom', sla: 'risk', reconciliationStatus: 'overdue', amount: 310000, grossMargin: 18.7, fulfillmentRate: 88.4, returnRate: 5.1, reconciliationRate: 84.5, lastInteraction: '2024-01-13' },
  ]

  const filtered = partners.filter((p) => {
    const matchSearch = p.name.includes(searchTerm) || p.region.includes(searchTerm)
    const matchLevel = level ? p.level === level : true
    const matchContract = contractStatus ? p.contractStatus === contractStatus : true
    const matchCycle = settlementCycle ? p.settlementCycle === settlementCycle : true
    const matchPricing = pricingSystem ? p.pricingSystem === pricingSystem : true
    const matchSla = sla ? p.sla === sla : true
    const matchRecon = reconciliationStatus ? p.reconciliationStatus === reconciliationStatus : true
    return matchSearch && matchLevel && matchContract && matchCycle && matchPricing && matchSla && matchRecon
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageData = filtered.slice(startIndex, startIndex + itemsPerPage)

  const statAmount = partners.reduce((sum, p) => sum + p.amount, 0)
  const statGrossMargin = Math.round((partners.reduce((sum, p) => sum + p.grossMargin, 0) / partners.length) * 10) / 10
  const statFulfillment = Math.round((partners.reduce((sum, p) => sum + p.fulfillmentRate, 0) / partners.length) * 10) / 10
  const statReturnRate = Math.round((partners.reduce((sum, p) => sum + p.returnRate, 0) / partners.length) * 10) / 10
  const statReconRate = Math.round((partners.reduce((sum, p) => sum + p.reconciliationRate, 0) / partners.length) * 10) / 10

  const renderBadge = (v: string) => {
    if (v === 'excellent') return <PaperBadge variant="success">优秀</PaperBadge>
    if (v === 'good') return <PaperBadge variant="info">良好</PaperBadge>
    if (v === 'risk') return <PaperBadge variant="error">风险</PaperBadge>
    if (v === 'on_track') return <PaperBadge variant="success">正常</PaperBadge>
    if (v === 'overdue') return <PaperBadge variant="error">逾期</PaperBadge>
    if (v === 'auditing') return <PaperBadge variant="warning">审计中</PaperBadge>
    if (v === 'active') return <PaperBadge variant="success">有效</PaperBadge>
    if (v === 'pending') return <PaperBadge variant="warning">待生效</PaperBadge>
    if (v === 'inactive') return <PaperBadge variant="info">失效</PaperBadge>
    if (v === 'monthly') return <PaperBadge variant="info">月度</PaperBadge>
    if (v === 'quarterly') return <PaperBadge variant="info">季度</PaperBadge>
    if (v === 'semiannual') return <PaperBadge variant="info">半年</PaperBadge>
    if (v === 'standard') return <PaperBadge variant="outline">标准价</PaperBadge>
    if (v === 'custom') return <PaperBadge variant="outline">自定义</PaperBadge>
    if (v === 'rebate') return <PaperBadge variant="outline">返利</PaperBadge>
    return <PaperBadge variant="default">-</PaperBadge>
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">已合作装企</h1>
            <p className="text-ink-500 mt-1">经营视图，支持协议、价格体系与结算配置的综合管理</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500">成交额</p>
                  <p className="text-2xl font-bold text-ink-800">¥{statAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-success-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">平均毛利率</p>
              <p className="text-2xl font-bold text-ink-800">{statGrossMargin}%</p>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">履约及时率</p>
              <p className="text-2xl font-bold text-ink-800">{statFulfillment}%</p>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">退换货与返工率</p>
              <p className="text-2xl font-bold text-ink-800">{statReturnRate}%</p>
            </PaperCardContent>
          </PaperCard>
          <PaperCard hover>
            <PaperCardContent className="p-6">
              <p className="text-sm text-ink-500">对账与回款达成率</p>
              <p className="text-2xl font-bold text-ink-800">{statReconRate}%</p>
            </PaperCardContent>
          </PaperCard>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>筛选</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <PaperInput label="搜索" placeholder="公司/区域" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <PaperSelect label="合作等级" options={levelOptions} value={level} onChange={(e) => setLevel(e.target.value)} />
              <PaperSelect label="合同状态" options={contractOptions} value={contractStatus} onChange={(e) => setContractStatus(e.target.value)} />
              <PaperSelect label="结算周期" options={cycleOptions} value={settlementCycle} onChange={(e) => setSettlementCycle(e.target.value)} />
              <PaperSelect label="价格体系" options={pricingOptions} value={pricingSystem} onChange={(e) => setPricingSystem(e.target.value)} />
              <PaperSelect label="SLA" options={slaOptions} value={sla} onChange={(e) => setSla(e.target.value)} />
              <PaperSelect label="对账/回款" options={reconciliationOptions} value={reconciliationStatus} onChange={(e) => setReconciliationStatus(e.target.value)} />
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <div className="flex items-center justify-between">
              <PaperCardTitle>装企列表</PaperCardTitle>
              <div className="flex space-x-2">
                <PaperButton variant="outline">导入</PaperButton>
                <PaperButton variant="outline">导出</PaperButton>
                <PaperButton variant="primary">新建合作</PaperButton>
              </div>
            </div>
          </PaperCardHeader>
          <PaperCardContent className="p-0">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>公司</PaperTableCell>
                <PaperTableCell>区域</PaperTableCell>
                <PaperTableCell>等级</PaperTableCell>
                <PaperTableCell>合同</PaperTableCell>
                <PaperTableCell>结算</PaperTableCell>
                <PaperTableCell>SLA</PaperTableCell>
                <PaperTableCell>对账/回款</PaperTableCell>
                <PaperTableCell>成交额</PaperTableCell>
                <PaperTableCell>毛利率</PaperTableCell>
                <PaperTableCell>操作</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {pageData.map((p) => (
                  <PaperTableRow key={p.id}>
                    <PaperTableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-ink-800">{p.name}</p>
                        <p className="text-sm text-ink-500">最后互动 {p.lastInteraction}</p>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{p.region}</span>
                      </div>
                    </PaperTableCell>
                    <PaperTableCell><PaperBadge variant="outline">{p.level}</PaperBadge></PaperTableCell>
                    <PaperTableCell>{renderBadge(p.contractStatus)}</PaperTableCell>
                    <PaperTableCell>{renderBadge(p.settlementCycle)}</PaperTableCell>
                    <PaperTableCell>{renderBadge(p.sla)}</PaperTableCell>
                    <PaperTableCell>{renderBadge(p.reconciliationStatus)}</PaperTableCell>
                    <PaperTableCell>¥{p.amount.toLocaleString()}</PaperTableCell>
                    <PaperTableCell>{p.grossMargin}%</PaperTableCell>
                    <PaperTableCell>
                      <div className="flex space-x-2">
                        <PaperButton size="sm" variant="ghost">查看</PaperButton>
                        <PaperButton size="sm" variant="outline">编辑</PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
            <PaperTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
