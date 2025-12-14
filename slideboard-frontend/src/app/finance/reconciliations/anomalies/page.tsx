'use client'

import React, { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperModal } from '@/components/ui/paper-modal'
import { PaperSelect } from '@/components/ui/paper-select'
import { PaperTable, PaperTableHeader, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { PaperTextarea } from '@/components/ui/paper-textarea'
import { ReconciliationAnomalyDetector } from '@/lib/reconciliation/anomalyDetection';
import { ReconciliationAnomaly, AnomalyType, AnomalySeverity } from '@/shared/types/reconciliation';
import { ReconciliationStatement } from '@/shared/types/reconciliation'

const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<ReconciliationAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAnomaly, setSelectedAnomaly] = useState<ReconciliationAnomaly | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [resolutionNotes, setResolutionNotes] = useState('')
  
  const anomalyDetector = new ReconciliationAnomalyDetector()

  useEffect(() => {
    fetchAnomalies()
  }, [filterType, filterSeverity, filterStatus])

  const fetchAnomalies = async () => {
    setLoading(true)
    try {
      // 这里应该调用API获取异常数据
      // 现在返回模拟数据
      
      // 模拟获取对账单数据
      const mockStatements: ReconciliationStatement[] = [
        {
          id: 'stmt-1',
          statementNo: 'RS-20250101-001',
          type: 'customer',
          targetId: 'cust-1',
          targetName: '客户A',
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
          totalAmount: 10000,
          status: 'draft',
          items: [
            {
              id: 'item-1',
              statementId: 'stmt-1',
              sourceType: 'order',
              sourceId: 'order-1',
              sourceNo: 'SO-20250101-001',
              amount: 5000,
              date: '2025-01-15',
              notes: '测试订单1'
            },
            {
              id: 'item-2',
              statementId: 'stmt-1',
              sourceType: 'order',
              sourceId: 'order-2',
              sourceNo: 'SO-20250101-002',
              amount: 5000,
              date: '2025-01-20',
              notes: '测试订单2'
            }
          ],
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      // 模拟外部数据
      const mockExternalData = [
        {
          id: 'ext-1',
          sourceId: 'order-1',
          sourceType: 'sales_order',
          amount: 4999.99,
          date: '2025-01-15',
          status: 'completed'
        },
        {
          id: 'ext-2',
          sourceId: 'order-3',
          sourceType: 'sales_order',
          amount: 3000,
          date: '2025-01-25',
          status: 'completed'
        }
      ]
      
      // 模拟检测异常
      const mockAnomalies: ReconciliationAnomaly[] = []
      
      // 模拟检测结果，不直接调用不存在的方法
      // 手动创建一些异常数据
      for (const statement of mockStatements) {
        // 模拟金额不匹配异常
        if (statement.items) {
          for (const item of statement.items) {
            const externalItem = mockExternalData.find(ext => ext.sourceId === item.sourceId)
            if (externalItem && Math.abs(item.amount - externalItem.amount) > 0.01) {
              mockAnomalies.push({
                id: crypto.randomUUID(),
                statementId: statement.id,
                itemId: item.id,
                type: AnomalyType.AMOUNT_MISMATCH,
                severity: AnomalySeverity.HIGH,
                description: `金额不匹配: ${item.amount} vs ${externalItem.amount}`,
                details: {
                  source: 'system',
                  expected: item.amount,
                  actual: externalItem.amount,
                  amountDifference: externalItem.amount - item.amount,
                  percentageDifference: Math.abs((externalItem.amount - item.amount) / item.amount) * 100,
                  metadata: {
                    sourceType: 'sales_order',
                    sourceId: item.sourceId,
                    itemCount: 1
                  }
                },
                status: 'new',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
            }
          }
        }
      }
      
      // 添加一些模拟的其他类型异常
      mockAnomalies.push(
        {
          id: crypto.randomUUID(),
          statementId: 'stmt-1',
          itemId: 'item-1',
          type: AnomalyType.DUPLICATE_TRANSACTION,
          severity: AnomalySeverity.HIGH,
          description: '检测到重复交易',
          details: {
            source: 'system',
            expected: 1,
            actual: 2,
            amountDifference: 5000,
            percentageDifference: 100,
            metadata: {
              sourceType: 'sales_order',
              sourceId: 'order-1',
              itemCount: 2
            }
          },
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          statementId: 'stmt-1',
          itemId: 'item-2',
          type: AnomalyType.OTHER,
          severity: AnomalySeverity.MEDIUM,
          description: '长期未对账',
          details: {
            source: 'system',
            expected: 30,
            actual: 45,
            dateDifference: 15,
            metadata: {
              sourceType: 'sales_order',
              sourceId: 'order-1',
              itemDate: '2025-01-15',
              amount: 5000
            }
          },
          status: 'investigating',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )
      
      // 应用筛选
      let filteredAnomalies = [...mockAnomalies]
      
      if (filterType !== 'all') {
        filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.type === filterType)
      }
      
      if (filterSeverity !== 'all') {
        filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.severity === filterSeverity)
      }
      
      if (filterStatus !== 'all') {
        filteredAnomalies = filteredAnomalies.filter(anomaly => anomaly.status === filterStatus)
      }
      
      setAnomalies(filteredAnomalies)
    } catch (error) {
      console.error('Failed to fetch anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAnomaly = (anomaly: ReconciliationAnomaly) => {
    setSelectedAnomaly(anomaly)
    setResolutionNotes(anomaly.resolutionNotes || '')
    setIsModalOpen(true)
  }

  const handleResolveAnomaly = async () => {
    if (selectedAnomaly) {
      try {
        // 模拟更新异常状态，不直接调用不存在的方法
        const updatedAnomaly: ReconciliationAnomaly = {
          ...selectedAnomaly,
          status: 'resolved',
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedBy: 'current-user'
        }
        
        setAnomalies(prev => prev.map(anomaly => 
          anomaly.id === selectedAnomaly.id ? updatedAnomaly : anomaly
        ))
        
        setIsModalOpen(false)
        setSelectedAnomaly(null)
        setResolutionNotes('')
      } catch (error) {
        console.error('Failed to resolve anomaly:', error)
      }
    }
  }

  const handleIgnoreAnomaly = async () => {
    if (selectedAnomaly) {
      try {
        // 模拟更新异常状态，不直接调用不存在的方法
        const updatedAnomaly: ReconciliationAnomaly = {
          ...selectedAnomaly,
          status: 'ignored',
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedBy: 'current-user'
        }
        
        setAnomalies(prev => prev.map(anomaly => 
          anomaly.id === selectedAnomaly.id ? updatedAnomaly : anomaly
        ))
        
        setIsModalOpen(false)
        setSelectedAnomaly(null)
        setResolutionNotes('')
      } catch (error) {
        console.error('Failed to ignore anomaly:', error)
      }
    }
  }

  const getSeverityColor = (severity: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: ReconciliationAnomaly['status']) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-800'
      case 'investigating':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'ignored':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">对账异常管理</h1>
          <p className="text-ink-500 mt-1">查看和处理对账过程中发现的异常</p>
        </div>
        <PaperButton variant="primary" onClick={() => fetchAnomalies()}>刷新数据</PaperButton>
      </div>

      {/* 筛选条件 */}
      <PaperCard>
        <PaperCardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">异常类型：</span>
              <PaperSelect
                  value={filterType}
                  onChange={(value) => setFilterType(value)}
                  options={[
                    { value: 'all', label: '全部类型' },
                    { value: AnomalyType.AMOUNT_MISMATCH, label: '金额不匹配' },
                    { value: AnomalyType.DATE_MISMATCH, label: '日期不匹配' },
                    { value: AnomalyType.DUPLICATE_TRANSACTION, label: '重复交易' },
                    { value: AnomalyType.STATUS_MISMATCH, label: '状态不匹配' },
                    { value: AnomalyType.SUSPICIOUS_TRANSACTION, label: '可疑交易' },
                    { value: AnomalyType.INVALID_DATA, label: '无效数据' },
                    { value: AnomalyType.CURRENCY_MISMATCH, label: '货币不匹配' }
                  ]}
                  className="w-40"
                />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">严重程度：</span>
              <PaperSelect
                value={filterSeverity}
                onChange={(value) => setFilterSeverity(value)}
                options={[
                  { value: 'all', label: '全部程度' },
                  { value: 'critical', label: '严重' },
                  { value: 'high', label: '高' },
                  { value: 'medium', label: '中' },
                  { value: 'low', label: '低' }
                ]}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">处理状态：</span>
              <PaperSelect
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'detected', label: '已检测' },
                  { value: 'in_progress', label: '处理中' },
                  { value: 'resolved', label: '已解决' },
                  { value: 'ignored', label: '已忽略' }
                ]}
                className="w-36"
              />
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 异常统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <PaperCard>
          <PaperCardContent>
            <div className="text-2xl font-bold text-blue-600">{anomalies.length}</div>
            <div className="text-sm text-gray-500 mt-1">总异常数</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent>
            <div className="text-2xl font-bold text-red-600">
              {anomalies.filter(a => a.severity === AnomalySeverity.CRITICAL || a.severity === AnomalySeverity.HIGH).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">严重/高异常</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {anomalies.filter(a => a.severity === AnomalySeverity.MEDIUM).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">中异常</div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent>
            <div className="text-2xl font-bold text-green-600">
              {anomalies.filter(a => a.status === 'resolved' || a.status === 'ignored').length}
            </div>
            <div className="text-sm text-gray-500 mt-1">已处理</div>
          </PaperCardContent>
        </PaperCard>
      </div>

      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>对账异常列表</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="overflow-x-auto">
            <PaperTable>
              <PaperTableHeader>
                <PaperTableRow>
                  <PaperTableCell>异常类型</PaperTableCell>
                  <PaperTableCell>严重程度</PaperTableCell>
                  <PaperTableCell>描述</PaperTableCell>
                  <PaperTableCell>对账单号</PaperTableCell>
                  <PaperTableCell>差异</PaperTableCell>
                  <PaperTableCell>状态</PaperTableCell>
                  <PaperTableCell>检测时间</PaperTableCell>
                  <PaperTableCell>操作</PaperTableCell>
                </PaperTableRow>
              </PaperTableHeader>
              <tbody>
                {loading ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={8} className="text-center py-8 text-ink-400">加载中...</PaperTableCell>
                  </PaperTableRow>
                ) : anomalies.length === 0 ? (
                  <PaperTableRow>
                    <PaperTableCell colSpan={8} className="text-center py-8 text-ink-400">暂无异常</PaperTableCell>
                  </PaperTableRow>
                ) : (
                  anomalies.map((anomaly) => (
                    <PaperTableRow key={anomaly.id}>
                      <PaperTableCell>
                      <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                        {anomaly.type === AnomalyType.AMOUNT_MISMATCH ? '金额不匹配' :
                         anomaly.type === AnomalyType.DATE_MISMATCH ? '日期不匹配' :
                         anomaly.type === AnomalyType.DUPLICATE_TRANSACTION ? '重复交易' :
                         anomaly.type === AnomalyType.STATUS_MISMATCH ? '状态不匹配' :
                         anomaly.type === AnomalyType.SUSPICIOUS_TRANSACTION ? '可疑交易' :
                         anomaly.type === AnomalyType.INVALID_DATA ? '无效数据' :
                         anomaly.type === AnomalyType.CURRENCY_MISMATCH ? '货币不匹配' :
                         '其他异常'}
                      </span>
                    </PaperTableCell>
                    <PaperTableCell>
                      <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity === AnomalySeverity.CRITICAL ? '严重' :
                         anomaly.severity === AnomalySeverity.HIGH ? '高' :
                         anomaly.severity === AnomalySeverity.MEDIUM ? '中' :
                         '低'}
                      </span>
                    </PaperTableCell>
                      <PaperTableCell className="max-w-xs truncate">{anomaly.description}</PaperTableCell>
                      <PaperTableCell>{anomaly.statementId}</PaperTableCell>
                      <PaperTableCell>
                        {anomaly.details?.amountDifference !== undefined ? (
                          <span className={anomaly.details.amountDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                            {anomaly.details.amountDifference > 0 ? '+' : ''}{anomaly.details.amountDifference.toFixed(2)}
                            {anomaly.details.percentageDifference !== undefined && (
                              <span className="text-xs ml-1">({anomaly.details.percentageDifference.toFixed(2)}%)</span>
                            )}
                          </span>
                        ) : anomaly.details?.dateDifference !== undefined ? (
                          <span className="text-orange-600">
                            {anomaly.details.dateDifference}天
                          </span>
                        ) : (
                          '-'
                        )}
                      </PaperTableCell>
                      <PaperTableCell>
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(anomaly.status)}`}>
                          {anomaly.status === 'new' ? '已检测' :
                           anomaly.status === 'investigating' ? '处理中' :
                           anomaly.status === 'resolved' ? '已解决' :
                           '已忽略'}
                        </span>
                      </PaperTableCell>
                      <PaperTableCell>{new Date(anomaly.createdAt).toLocaleString()}</PaperTableCell>
                      <PaperTableCell>
                        <button
                          className="text-blue-600 hover:underline mr-2"
                          onClick={() => handleViewAnomaly(anomaly)}
                        >
                          查看
                        </button>
                      </PaperTableCell>
                    </PaperTableRow>
                  ))
                )}
              </tbody>
            </PaperTable>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 异常详情模态框 */}
      {selectedAnomaly && (
        <PaperModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="异常详情"
          className="max-w-2xl"
        >
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">异常类型</div>
                <div className="mt-1">
                  <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                    {selectedAnomaly.type === AnomalyType.AMOUNT_MISMATCH ? '金额不匹配' :
                     selectedAnomaly.type === AnomalyType.DATE_MISMATCH ? '日期不匹配' :
                     selectedAnomaly.type === AnomalyType.DUPLICATE_TRANSACTION ? '重复交易' :
                     selectedAnomaly.type === AnomalyType.STATUS_MISMATCH ? '状态不匹配' :
                     selectedAnomaly.type === AnomalyType.SUSPICIOUS_TRANSACTION ? '可疑交易' :
                     selectedAnomaly.type === AnomalyType.INVALID_DATA ? '无效数据' :
                     selectedAnomaly.type === AnomalyType.CURRENCY_MISMATCH ? '货币不匹配' :
                     selectedAnomaly.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">严重程度</div>
                <div className="mt-1">
                  <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(selectedAnomaly.severity)}`}>
                    {selectedAnomaly.severity === 'critical' ? '严重' :
                     selectedAnomaly.severity === 'high' ? '高' :
                     selectedAnomaly.severity === 'medium' ? '中' :
                     '低'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">描述</div>
              <div className="mt-1">{selectedAnomaly.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">期望结果</div>
                <div className="mt-1">{selectedAnomaly.details?.expected || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">实际结果</div>
                <div className="mt-1">{selectedAnomaly.details?.actual || '-'}</div>
              </div>
            </div>
            {selectedAnomaly.details?.amountDifference !== undefined && (
              <div>
                <div className="text-sm font-medium text-gray-500">金额差异</div>
                <div className={`mt-1 ${selectedAnomaly.details.amountDifference > 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                  {selectedAnomaly.details.amountDifference > 0 ? '+' : ''}{selectedAnomaly.details.amountDifference.toFixed(2)}
                  {selectedAnomaly.details.percentageDifference !== undefined && (
                    <span className="text-xs ml-1">({selectedAnomaly.details.percentageDifference.toFixed(2)}%)</span>
                  )}
                </div>
              </div>
            )}
            {selectedAnomaly.details?.dateDifference !== undefined && (
              <div>
                <div className="text-sm font-medium text-gray-500">日期差异</div>
                <div className="mt-1 text-orange-600 font-medium">{selectedAnomaly.details.dateDifference}天</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-500">检测时间</div>
              <div className="mt-1">{new Date(selectedAnomaly.createdAt).toLocaleString()}</div>
            </div>
            {selectedAnomaly.resolvedAt && (
              <div>
                <div className="text-sm font-medium text-gray-500">解决时间</div>
                <div className="mt-1">{new Date(selectedAnomaly.resolvedAt).toLocaleString()}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-500">处理状态</div>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedAnomaly.status)}`}>
                  {selectedAnomaly.status === 'new' ? '已检测' :
                   selectedAnomaly.status === 'investigating' ? '处理中' :
                   selectedAnomaly.status === 'resolved' ? '已解决' :
                   '已忽略'}
                </span>
              </div>
            </div>
            {selectedAnomaly.resolutionNotes && (
              <div>
                <div className="text-sm font-medium text-gray-500">处理备注</div>
                <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">{selectedAnomaly.resolutionNotes}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-500">处理备注</div>
              <PaperTextarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="输入处理备注"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <PaperButton variant="outline" onClick={() => setIsModalOpen(false)}>
                取消
              </PaperButton>
              <PaperButton variant="outline" onClick={handleIgnoreAnomaly}>
                忽略
              </PaperButton>
              <PaperButton variant="primary" onClick={handleResolveAnomaly}>
                标记为已解决
              </PaperButton>
            </div>
          </div>
        </PaperModal>
      )}
    </div>
  )
}

export default AnomaliesPage