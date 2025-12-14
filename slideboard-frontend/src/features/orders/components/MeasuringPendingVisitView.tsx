'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter, PaperDialogDescription } from '@/components/ui/paper-dialog'
import { PaperInput, PaperTextarea } from '@/components/ui/paper-input'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { StatefulButton } from '@/components/ui/stateful-button'
import { toast } from '@/components/ui/toast'
import { MEASUREMENT_STATUS } from '@/constants/measurement-status'
import { measurementService } from '@/services/measurements.client'
import { Measurement } from '@/shared/types/measurement'
import { exportToExcel, formatMeasurementsForExport } from '@/utils/export'
import { logger } from '@/utils/logger'

export function MeasuringPendingVisitView() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [remindDialogOpen, setRemindDialogOpen] = useState(false)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [reassignReason, setReassignReason] = useState('')
  // 备注编辑模态框状态
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [remarkValue, setRemarkValue] = useState('')
  // 批量选择状态
  const [selectedMeasurements, setSelectedMeasurements] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)


  const loadMeasurements = useCallback(async () => {
    const maxRetries = 3
    let retries = 0
    let success = false

    while (retries < maxRetries && !success) {
      try {
        setIsLoading(true)
        setError(null)
        const result = await measurementService.getMeasurements(
          1,
          10,
          MEASUREMENT_STATUS.MEASURING_PENDING_VISIT,
          undefined,
          searchKeyword
        )
        setMeasurements(result.measurements)
        success = true
      } catch (err) {
        retries++
        const errorMessage = err instanceof Error ? err.message : '未知错误'
        logger.error('加载测量单失败', { error: errorMessage, searchKeyword, retries, maxRetries })
        
        if (retries === maxRetries) {
          setError(`加载测量单失败: ${errorMessage}，已尝试 ${maxRetries} 次，请稍后重试`)
        } else {
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } finally {
        if (success) {
          setIsLoading(false)
        }
      }
    }
    
    // 确保最终状态是加载完成
    if (!success) {
      setIsLoading(false)
    }
  }, [searchKeyword])

  useEffect(() => {
    loadMeasurements()
  }, [loadMeasurements])

  // Helper functions
  const getSurveyorStatusBadge = () => {
    // 暂时使用统一的状态标识，后续可根据实际需求扩展
    return <PaperBadge className="bg-blue-50 text-blue-700 border-blue-200">已接单</PaperBadge>
  }

  const formatRemainingTime = (measurement: Measurement) => {
    // 计算剩余时间（假设scheduledAt为预约时间）
    if (!measurement.scheduledAt) return '未预约时间'

    const now = new Date()
    const scheduled = new Date(measurement.scheduledAt)
    
    // 检查日期是否有效
    if (isNaN(scheduled.getTime())) return '时间格式无效'
    
    const diffMs = scheduled.getTime() - now.getTime()

    if (diffMs <= 0) return '已超时'

    const diffHours = diffMs / (1000 * 60 * 60)
    const formattedHours = diffHours.toFixed(1)
    return `剩余${formattedHours}小时`
  }

  const getTimeStatusColor = (measurement: Measurement) => {
    if (!measurement.scheduledAt) return 'text-gray-600'

    const now = new Date()
    const scheduled = new Date(measurement.scheduledAt)
    
    // 检查日期是否有效
    if (isNaN(scheduled.getTime())) return 'text-gray-600'
    
    const diffMinutes = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60))

    if (diffMinutes > 720) return 'text-green-600' // > 12h
    if (diffMinutes > 360) return 'text-orange-600' // 6-12h
    if (diffMinutes > 0) return 'text-red-600 font-bold' // < 6h
    return 'text-red-600 font-bold' // 已超时
  }

  // Handle remind order
  const handleRemindOrder = (measurement: Measurement) => {
    setSelectedMeasurement(measurement)
    setRemindDialogOpen(true)
  }

  const confirmRemindOrder = async () => {
    if (!selectedMeasurement) return
    try {
      setIsLoading(true)
      // 催单功能：实际项目中可能需要发送通知或更新状态
      // 这里仅刷新数据
      await loadMeasurements()
      setRemindDialogOpen(false)
      setSelectedMeasurement(null)
    } catch (_err) {
      setError('催单失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadMeasurements()
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAllSelected(e.target.checked)
    if (e.target.checked) {
      setSelectedMeasurements(new Set(measurements.map(m => m.id)))
    } else {
      setSelectedMeasurements(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedMeasurements)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedMeasurements(newSelected)
    setIsAllSelected(newSelected.size === measurements.length)
  }

  const handleBatchRemind = async () => {
    if (selectedMeasurements.size === 0) {
      toast.info('请先选择要提醒的测量单')
      return
    }
    try {
      setIsLoading(true)
      // 调用批量提醒API
      await measurementService.batchRemindMeasurements(Array.from(selectedMeasurements))
      // 刷新数据
      await loadMeasurements()
      // 清空选择
      setSelectedMeasurements(new Set())
      setIsAllSelected(false)
      toast.success('批量提醒发送成功')
    } catch (_err) {
      setError('批量提醒失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRemark = (measurement: Measurement) => {
    setSelectedMeasurement(measurement)
    setRemarkValue(measurement.measurementData?.remark || '')
    setIsRemarkModalOpen(true)
  }

  const saveRemark = async () => {
    if (!selectedMeasurement) return
    try {
      setIsLoading(true)
      await measurementService.updateMeasurement(selectedMeasurement.id, {
        measurementData: {
          ...selectedMeasurement.measurementData,
          remark: remarkValue
        }
      })
      await loadMeasurements()
      setIsRemarkModalOpen(false)
      toast.success('备注已更新')
    } catch (_err) {
      setError('更新备注失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReassignOrder = (measurement: Measurement) => {
    setSelectedMeasurement(measurement)
    setReassignDialogOpen(true)
  }

  const confirmReassignOrder = async () => {
    if (!selectedMeasurement) return
    if (!reassignReason.trim()) {
      toast.warning('请输入重新分配理由')
      return
    }
    try {
      setIsLoading(true)
      // Call the reassign service
      await measurementService.requestReassign(selectedMeasurement.id, reassignReason)
      toast.success('重新分配申请已提交')
      setReassignDialogOpen(false)
      setReassignReason('')
      await loadMeasurements()
    } catch (_err) {
      setError('重新分配申请提交失败')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle export data
  const handleExport = () => {
    if (measurements.length === 0) {
      setError('暂无数据可导出')
      return
    }

    try {
      const formattedData = formatMeasurementsForExport(measurements)
      exportToExcel(formattedData, '测量中待上门数据', '测量单列表')
    } catch (err) {
      setError('导出失败,请重试')
      logger.error('导出失败', { resourceType: 'measurement', details: { err } })
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Time Alert Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">正常状态 (&gt;12h)</div>
                <div className="text-3xl font-bold text-green-700 mt-1">
                  {measurements.filter(m => {
                    if (!m.scheduledAt) return false
                    const now = new Date()
                    const scheduled = new Date(m.scheduledAt)
                    const diffMinutes = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60))
                    return diffMinutes > 720
                  }).length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600/80 font-medium">
              进度正常，无需干预
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">紧急状态 (6-12h)</div>
                <div className="text-3xl font-bold text-orange-700 mt-1">
                  {measurements.filter(m => {
                    if (!m.scheduledAt) return false
                    const now = new Date()
                    const scheduled = new Date(m.scheduledAt)
                    const diffMinutes = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60))
                    return diffMinutes > 360 && diffMinutes <= 720
                  }).length}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="text-2xl">!</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-600/80 font-medium">
              建议发送提醒通知
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/20 pointer-events-none" />
          <PaperCardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-ink-500 mb-1">超期预警 (&lt;6h)</div>
                <div className="text-3xl font-bold text-red-700 mt-1">
                  {measurements.filter(m => {
                    if (!m.scheduledAt) return false
                    const now = new Date()
                    const scheduled = new Date(m.scheduledAt)
                    const diffMinutes = Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60))
                    return diffMinutes <= 360
                  }).length}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600/80 font-medium">
              需立即介入处理
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 2. Order List Area */}
      <PaperCard className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 border border-white/20 shadow-xl ring-1 ring-black/5 dark:ring-white/10 flex-1">
        <PaperTableToolbar className="border-b border-black/5 dark:border-white/5 bg-transparent p-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <PaperInput
                placeholder="搜索销售单/测量单号"
                className="w-64 bg-white/50 pr-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <StatefulButton
              variant="primary"
              className="px-6 py-2"
              onClick={handleSearch}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="查询中..."
            >
              查询
            </StatefulButton>
          </div>
          <div className="flex gap-2">
            <StatefulButton
              variant="outline"
              size="small"
              onClick={handleBatchRemind}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="处理中..."
              disabled={selectedMeasurements.size === 0}
            >
              批量提醒
            </StatefulButton>
            <StatefulButton
              variant="outline"
              size="small"
              onClick={handleExport}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="导出中..."
              disabled={measurements.length === 0}
            >
              导出数据
            </StatefulButton>
          </div>
        </PaperTableToolbar>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader className="bg-gray-50/50 dark:bg-white/5">
              <PaperTableCell>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={isLoading || measurements.length === 0}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                />
              </PaperTableCell>
              <PaperTableCell>测量单号</PaperTableCell>
              <PaperTableCell>客户信息</PaperTableCell>
              <PaperTableCell>项目地址</PaperTableCell>
              <PaperTableCell>测量师信息</PaperTableCell>
              <PaperTableCell>预约/状态</PaperTableCell>
              <PaperTableCell>时效状态</PaperTableCell>
              <PaperTableCell>备注</PaperTableCell>
              <PaperTableCell>操作</PaperTableCell>
            </PaperTableHeader>
            <PaperTableBody>
              {isLoading ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center py-8">
                    加载中...
                  </PaperTableCell>
                </PaperTableRow>
              ) : measurements.length === 0 ? (
                <PaperTableRow>
                  <PaperTableCell colSpan={9} className="text-center py-8">
                    暂无测量中-待上门的测量单
                  </PaperTableCell>
                </PaperTableRow>
              ) : (
                measurements.map(measurement => (
                  <PaperTableRow key={measurement.id}>
                    <PaperTableCell>
                      <input
                        type="checkbox"
                        checked={selectedMeasurements.has(measurement.id)}
                        onChange={(e) => handleSelectOne(measurement.id, e.target.checked)}
                        disabled={isLoading}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                      />
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="font-mono text-xs text-gray-900">{measurement.quoteNo}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="text-sm font-medium">{measurement.customerName}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{measurement.projectAddress}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="font-medium">{measurement.surveyorName || '未分配'}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="text-sm">{measurement.scheduledAt || '未预约'}</div>
                      <div className="mt-1">{getSurveyorStatusBadge()}</div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className={`text-sm font-medium ${getTimeStatusColor(measurement)}`}>
                        {formatRemainingTime(measurement)}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div
                        className="text-xs text-gray-600 max-w-[150px] truncate cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onDoubleClick={() => handleEditRemark(measurement)}
                      >
                        {measurement.measurementData?.remark || '- 双击添加备注'}
                      </div>
                    </PaperTableCell>
                    <PaperTableCell>
                      <div className="flex flex-col gap-2">
                        <PaperButton size="small" variant="outline" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleRemindOrder(measurement)}>催单</PaperButton>
                        <PaperButton size="small" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleReassignOrder(measurement)}>重新分配</PaperButton>
                      </div>
                    </PaperTableCell>
                  </PaperTableRow>
                ))
              )}
            </PaperTableBody>
          </PaperTable>
          <PaperTablePagination
            currentPage={1}
            totalPages={1}
            totalItems={measurements.length}
            itemsPerPage={10}
            onPageChange={() => { }} // 分页功能后续实现
          />
        </PaperCardContent>
      </PaperCard>

      {/* 4. Remind Order Dialog */}
      <PaperDialog open={remindDialogOpen} onOpenChange={setRemindDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>确认催单</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            您确定要对测量单 {selectedMeasurement?.quoteNo} 进行催单吗？
          </PaperDialogDescription>
        </PaperDialogContent>
        <PaperDialogFooter>
            <PaperButton variant="outline" onClick={() => setRemindDialogOpen(false)}>
              取消
            </PaperButton>
            <StatefulButton
              variant="primary"
              onClick={confirmRemindOrder}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="处理中..."
            >
              确认催单
            </StatefulButton>
          </PaperDialogFooter>
      </PaperDialog>

      {/* 5. Reassign Order Dialog */}
      <PaperDialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <PaperDialogHeader>
          <PaperDialogTitle>确认重新分配</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            您确定要将测量单 {selectedMeasurement?.quoteNo} 重新分配吗？测量单将回到测量中-待分配状态。
          </PaperDialogDescription>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">重新分配理由</label>
            <PaperTextarea
              placeholder="请输入重新分配的理由"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
            <PaperButton variant="outline" onClick={() => setReassignDialogOpen(false)}>
              取消
            </PaperButton>
            <StatefulButton
              variant="primary"
              onClick={confirmReassignOrder}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="处理中..."
              disabled={!reassignReason.trim()}
            >
              确认重新分配
            </StatefulButton>
          </PaperDialogFooter>
      </PaperDialog>

      {/* 6. Remark Edit Modal */}
      <PaperDialog
        open={isRemarkModalOpen}
        onOpenChange={setIsRemarkModalOpen}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>编辑备注</PaperDialogTitle>
        </PaperDialogHeader>
        <PaperDialogContent>
          <PaperDialogDescription>
            请为测量单 {selectedMeasurement?.quoteNo} 编辑备注内容。
          </PaperDialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注内容</label>
              <PaperInput
                type="textarea"
                value={remarkValue}
                onChange={(e) => setRemarkValue(e.target.value)}
                placeholder="请输入备注内容..."
                className="w-full h-32 text-sm"
              />
            </div>
          </div>
        </PaperDialogContent>
        <PaperDialogFooter>
            <PaperButton variant="outline" onClick={() => setIsRemarkModalOpen(false)}>
              取消
            </PaperButton>
            <StatefulButton
              variant="primary"
              onClick={saveRemark}
              status={isLoading ? 'loading' : 'idle'}
              loadingText="保存中..."
            >
              保存
            </StatefulButton>
          </PaperDialogFooter>
      </PaperDialog>
    </div>
  )
}
