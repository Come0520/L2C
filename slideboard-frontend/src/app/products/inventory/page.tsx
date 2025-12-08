'use client'

import React from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput, PaperSelect } from '@/components/ui/paper-input'
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTableToolbar, PaperTablePagination } from '@/components/ui/paper-table'
 

type InboundType = 'purchase' | 'transfer_in' | 'return_in' | 'stocktake_gain'
type OutboundType = 'sales' | 'transfer_out' | 'loss_out' | 'stocktake_loss'

interface InboundRecord {
  id: string
  type: InboundType
  store: string
  orderNo: string
  sku: string
  productName: string
  qty: number
  operator: string
  time: string
}

interface OutboundRecord {
  id: string
  type: OutboundType
  store: string
  relatedNo: string
  sku: string
  productName: string
  qty: number
  operator: string
  time: string
}

interface TransferRecord {
  id: string
  fromStore: string
  toStore: string
  status: 'applied' | 'approved' | 'executing' | 'completed'
  sku: string
  productName: string
  qty: number
  operator: string
  time: string
}

interface StocktakeRecord {
  id: string
  store: string
  planName: string
  status: 'planning' | 'executing' | 'reconciled' | 'reported'
  diffQty: number
  operator: string
  time: string
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = React.useState<'inbound' | 'outbound' | 'transfer' | 'stocktake' | 'stats'>('inbound')
  const [store, setStore] = React.useState('一店')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const stores = [
    { value: '一店', label: '一店' },
    { value: '二店', label: '二店' },
    { value: '线上店', label: '线上店' },
  ]

  const inbound: InboundRecord[] = [
    { id: 'IN-001', type: 'purchase', store: '一店', orderNo: 'PO-2024-001', sku: 'TL-001', productName: '马可波罗瓷砖 800x800', qty: 50, operator: '张三', time: '2024-01-14 10:00' },
    { id: 'IN-002', type: 'transfer_in', store: '一店', orderNo: 'TR-2024-008', sku: 'DB-002', productName: '圣象复合地板 12mm', qty: 30, operator: '张三', time: '2024-01-14 12:10' },
    { id: 'IN-003', type: 'return_in', store: '一店', orderNo: 'RT-2024-003', sku: 'TL-003', productName: '立邦内墙涂料 18L', qty: 6, operator: '张三', time: '2024-01-15 09:15' },
  ]

  const outbound: OutboundRecord[] = [
    { id: 'OUT-001', type: 'sales', store: '一店', relatedNo: 'ORD-2024-001', sku: 'TL-001', productName: '马可波罗瓷砖 800x800', qty: 10, operator: '李四', time: '2024-01-15 14:10' },
    { id: 'OUT-002', type: 'transfer_out', store: '一店', relatedNo: 'TR-2024-008', sku: 'DB-002', productName: '圣象复合地板 12mm', qty: 10, operator: '李四', time: '2024-01-14 12:00' },
    { id: 'OUT-003', type: 'loss_out', store: '一店', relatedNo: 'LS-2024-001', sku: 'TL-003', productName: '立邦内墙涂料 18L', qty: 1, operator: '李四', time: '2024-01-12 09:00' },
  ]

  const transfers: TransferRecord[] = [
    { id: 'TR-2024-008', fromStore: '二店', toStore: '一店', status: 'completed', sku: 'DB-002', productName: '圣象复合地板 12mm', qty: 30, operator: '库存管理员-王五', time: '2024-01-14 12:10' },
    { id: 'TR-2024-009', fromStore: '一店', toStore: '线上店', status: 'approved', sku: 'TL-001', productName: '马可波罗瓷砖 800x800', qty: 20, operator: '库存管理员-王五', time: '2024-01-15 11:00' },
  ]

  const stocktakes: StocktakeRecord[] = [
    { id: 'ST-PLAN-01', store: '一店', planName: '一店月度盘点', status: 'executing', diffQty: -2, operator: '张三', time: '2024-01-15 10:30' },
    { id: 'ST-PLAN-02', store: '二店', planName: '二店季度盘点', status: 'planning', diffQty: 0, operator: '李四', time: '2024-01-12 16:00' },
  ]

  const filteredInbound = inbound.filter(r => r.store === store && (r.productName.includes(searchTerm) || r.sku.includes(searchTerm)))
  const filteredOutbound = outbound.filter(r => r.store === store && (r.productName.includes(searchTerm) || r.sku.includes(searchTerm)))
  const filteredTransfers = transfers.filter(r => (r.fromStore === store || r.toStore === store) && (r.productName.includes(searchTerm) || r.sku.includes(searchTerm)))
  const filteredStocktakes = stocktakes.filter(r => r.store === store && (r.planName.includes(searchTerm)))

  const renderInboundType = (t: InboundType) => {
    if (t === 'purchase') return <PaperBadge variant="info">采购入库</PaperBadge>
    if (t === 'transfer_in') return <PaperBadge variant="success">调拨入库</PaperBadge>
    if (t === 'return_in') return <PaperBadge variant="warning">退货入库</PaperBadge>
    return <PaperBadge variant="outline">盘点入库</PaperBadge>
  }

  const renderOutboundType = (t: OutboundType) => {
    if (t === 'sales') return <PaperBadge variant="success">销售出库</PaperBadge>
    if (t === 'transfer_out') return <PaperBadge variant="info">调拨出库</PaperBadge>
    if (t === 'loss_out') return <PaperBadge variant="error">报损出库</PaperBadge>
    return <PaperBadge variant="outline">盘点出库</PaperBadge>
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">库存管理（门店）</h1>
            <p className="text-ink-500 mt-1">各门店独立库存中心，支持入库/出库/调拨/盘点与统计</p>
          </div>
          <div className="flex items-center space-x-3">
            <PaperSelect label="门店" options={stores} value={store} onChange={(e) => setStore(e.target.value)} />
            <PaperButton variant="primary">新建单据</PaperButton>
          </div>
        </div>

        <PaperCard>
          <PaperCardContent>
            <PaperNav vertical={false}>
              <PaperNavItem href="#" active={activeTab === 'inbound'} onClick={() => setActiveTab('inbound')}>入库管理</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'outbound'} onClick={() => setActiveTab('outbound')}>出库管理</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')}>调拨管理</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'stocktake'} onClick={() => setActiveTab('stocktake')}>盘点管理</PaperNavItem>
              <PaperNavItem href="#" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>库存查询与统计</PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperTableToolbar>
            <div className="flex items-center space-x-2">
              <PaperInput placeholder="搜索商品/编码" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <PaperButton variant="outline">导入</PaperButton>
              <PaperButton variant="outline">导出</PaperButton>
            </div>
            <div className="text-sm text-ink-500">{store}</div>
          </PaperTableToolbar>
          <PaperCardContent className="p-0">
            {activeTab === 'inbound' && (
              <>
                <PaperTable>
                  <PaperTableHeader>
                    <PaperTableCell>类型</PaperTableCell>
                    <PaperTableCell>单号</PaperTableCell>
                    <PaperTableCell>商品</PaperTableCell>
                    <PaperTableCell>数量</PaperTableCell>
                    <PaperTableCell>操作人</PaperTableCell>
                    <PaperTableCell>时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableHeader>
                  <PaperTableBody>
                    {filteredInbound.map((r) => (
                      <PaperTableRow key={r.id}>
                        <PaperTableCell>{renderInboundType(r.type)}</PaperTableCell>
                        <PaperTableCell>{r.orderNo}</PaperTableCell>
                        <PaperTableCell>{r.sku} - {r.productName}</PaperTableCell>
                        <PaperTableCell>{r.qty}</PaperTableCell>
                        <PaperTableCell>{r.operator}</PaperTableCell>
                        <PaperTableCell>{r.time}</PaperTableCell>
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
                  totalPages={Math.ceil(filteredInbound.length / itemsPerPage)}
                  totalItems={filteredInbound.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}

            {activeTab === 'outbound' && (
              <>
                <PaperTable>
                  <PaperTableHeader>
                    <PaperTableCell>类型</PaperTableCell>
                    <PaperTableCell>关联单</PaperTableCell>
                    <PaperTableCell>商品</PaperTableCell>
                    <PaperTableCell>数量</PaperTableCell>
                    <PaperTableCell>操作人</PaperTableCell>
                    <PaperTableCell>时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableHeader>
                  <PaperTableBody>
                    {filteredOutbound.map((r) => (
                      <PaperTableRow key={r.id}>
                        <PaperTableCell>{renderOutboundType(r.type)}</PaperTableCell>
                        <PaperTableCell>{r.relatedNo}</PaperTableCell>
                        <PaperTableCell>{r.sku} - {r.productName}</PaperTableCell>
                        <PaperTableCell>{r.qty}</PaperTableCell>
                        <PaperTableCell>{r.operator}</PaperTableCell>
                        <PaperTableCell>{r.time}</PaperTableCell>
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
                  totalPages={Math.ceil(filteredOutbound.length / itemsPerPage)}
                  totalItems={filteredOutbound.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}

            {activeTab === 'transfer' && (
              <>
                <PaperTable>
                  <PaperTableHeader>
                    <PaperTableCell>单号</PaperTableCell>
                    <PaperTableCell>出库门店</PaperTableCell>
                    <PaperTableCell>入库门店</PaperTableCell>
                    <PaperTableCell>商品</PaperTableCell>
                    <PaperTableCell>数量</PaperTableCell>
                    <PaperTableCell>状态</PaperTableCell>
                    <PaperTableCell>操作人</PaperTableCell>
                    <PaperTableCell>时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableHeader>
                  <PaperTableBody>
                    {filteredTransfers.map((r) => (
                      <PaperTableRow key={r.id}>
                        <PaperTableCell>{r.id}</PaperTableCell>
                        <PaperTableCell>{r.fromStore}</PaperTableCell>
                        <PaperTableCell>{r.toStore}</PaperTableCell>
                        <PaperTableCell>{r.sku} - {r.productName}</PaperTableCell>
                        <PaperTableCell>{r.qty}</PaperTableCell>
                        <PaperTableCell><PaperBadge variant={r.status === 'completed' ? 'success' : r.status === 'approved' ? 'info' : r.status === 'executing' ? 'warning' : 'outline'}>{r.status}</PaperBadge></PaperTableCell>
                        <PaperTableCell>{r.operator}</PaperTableCell>
                        <PaperTableCell>{r.time}</PaperTableCell>
                        <PaperTableCell>
                          <div className="flex space-x-2">
                            <PaperButton size="sm" variant="outline">审批</PaperButton>
                            <PaperButton size="sm" variant="outline">执行</PaperButton>
                            <PaperButton size="sm" variant="ghost">跟踪</PaperButton>
                          </div>
                        </PaperTableCell>
                      </PaperTableRow>
                    ))}
                  </PaperTableBody>
                </PaperTable>
                <PaperTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredTransfers.length / itemsPerPage)}
                  totalItems={filteredTransfers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}

            {activeTab === 'stocktake' && (
              <>
                <PaperTable>
                  <PaperTableHeader>
                    <PaperTableCell>计划</PaperTableCell>
                    <PaperTableCell>门店</PaperTableCell>
                    <PaperTableCell>状态</PaperTableCell>
                    <PaperTableCell>差异数量</PaperTableCell>
                    <PaperTableCell>操作人</PaperTableCell>
                    <PaperTableCell>时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                  </PaperTableHeader>
                  <PaperTableBody>
                    {filteredStocktakes.map((r) => (
                      <PaperTableRow key={r.id}>
                        <PaperTableCell>{r.planName}</PaperTableCell>
                        <PaperTableCell>{r.store}</PaperTableCell>
                        <PaperTableCell><PaperBadge variant={r.status === 'reported' ? 'success' : r.status === 'reconciled' ? 'info' : r.status === 'executing' ? 'warning' : 'outline'}>{r.status}</PaperBadge></PaperTableCell>
                        <PaperTableCell>{r.diffQty}</PaperTableCell>
                        <PaperTableCell>{r.operator}</PaperTableCell>
                        <PaperTableCell>{r.time}</PaperTableCell>
                        <PaperTableCell>
                          <div className="flex space-x-2">
                            <PaperButton size="sm" variant="outline">执行</PaperButton>
                            <PaperButton size="sm" variant="outline">差异处理</PaperButton>
                            <PaperButton size="sm" variant="ghost">生成报告</PaperButton>
                          </div>
                        </PaperTableCell>
                      </PaperTableRow>
                    ))}
                  </PaperTableBody>
                </PaperTable>
                <PaperTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredStocktakes.length / itemsPerPage)}
                  totalItems={filteredStocktakes.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <div className="text-center p-6 bg-paper-300 rounded-lg">
                  <div className="text-3xl font-bold text-ink-800 mb-1">182</div>
                  <div className="text-sm text-ink-500">实时库存品项数</div>
                </div>
                <div className="text-center p-6 bg-paper-300 rounded-lg">
                  <div className="text-3xl font-bold text-ink-800 mb-1">12</div>
                  <div className="text-sm text-ink-500">库存预警（低于安全库存）</div>
                </div>
                <div className="text-center p-6 bg-paper-300 rounded-lg">
                  <div className="text-3xl font-bold text-ink-800 mb-1">86%</div>
                  <div className="text-sm text-ink-500">批次成本核算完成率</div>
                </div>
                <div className="text-center p-6 bg-paper-300 rounded-lg">
                  <div className="text-3xl font-bold text-ink-800 mb-1">24</div>
                  <div className="text-sm text-ink-500">本月调拨次数</div>
                </div>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
