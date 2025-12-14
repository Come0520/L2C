'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useState } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_CONFIG } from '@/constants/measurement-status'
import { MeasurementStatusModal } from '@/features/orders/components/measurements/MeasurementStatusModal'
import { useMeasurement } from '@/hooks/useMeasurements'
import { useRealtimeMeasurement } from '@/hooks/useRealtimeMeasurement'
import { MeasurementRoom } from '@/shared/types/measurement'
import { formatDateTime } from '@/utils/date'
import { ReportGenerator, ReportGeneratorOptions } from '@/utils/report-generator'

// 状态流转步骤配置
const statusSteps = [
  { status: MEASUREMENT_STATUS.PENDING_MEASUREMENT, title: '创建测量单' },
  { status: MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT, title: '待分配测量师' },
  { status: MEASUREMENT_STATUS.MEASURING_ASSIGNING, title: '分配中' },
  { status: MEASUREMENT_STATUS.MEASURING_PENDING_VISIT, title: '待上门测量' },
  { status: MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION, title: '待确认结果' },
  { status: MEASUREMENT_STATUS.COMPLETED, title: '测量完成' }
]

export default function MeasurementDetailPage() {
  const params = useParams()
  const measurementId = params.id as string

  // 使用React Query获取测量单详情
  const { measurement: initialMeasurement, isLoading, error, updateStatus } = useMeasurement(measurementId)

  // 使用实时测量单钩子获取实时更新
  const { measurement } = useRealtimeMeasurement(measurementId, initialMeasurement || null)

  // 状态更新模态框
  const [showStatusModal, setShowStatusModal] = useState(false)

  // 获取当前状态在步骤中的索引
  const getCurrentStepIndex = () => {
    if (!measurement) return 0
    return statusSteps.findIndex(step => step.status === measurement.status)
  }

  // 获取状态显示配置
  const isMeasurementStatus = (s: string): s is typeof MEASUREMENT_STATUS[keyof typeof MEASUREMENT_STATUS] => {
    return (Object.values(MEASUREMENT_STATUS) as readonly string[]).includes(s)
  }

  const getStatusConfig = (status: string) => {
    if (isMeasurementStatus(status)) {
      return MEASUREMENT_STATUS_CONFIG[status]
    }
    return {
      label: status,
      color: '#9E9E9E',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200'
    }
  }

  // 处理状态更新
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateStatus(newStatus)
      // Modal will be closed by the component or we can close it here explicitly if needed
      // But updateStatus is async, so we wait for it.
    } catch (_err) {
      // Error handling is done in the modal or hook
    }
  }

  // 处理报告生成
  const handleGenerateReport = async (format: 'json' | 'pdf' | 'html') => {
    try {
      const options: ReportGeneratorOptions = {
        format,
        includeRooms: true,
        includePhotos: !!measurement?.homeScreenshotUrl,
        template: 'detailed'
      }

      if (!measurement) return
      await ReportGenerator.downloadReport(measurement, options, `测量报告-${measurement.id.substring(0, 8)}`)
    } catch {
      // 这里可以添加错误提示
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-10">加载中...</div>
      </div>
    )
  }

  if (error || !measurement) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-10 text-red-500">
          {error ? '加载失败，请重试' : '测量单不存在'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">测量单详情</h1>
          <p className="text-ink-500 mt-1">查看测量单的详细信息</p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/orders/measurements/${measurement.id}/edit`}>
            <PaperButton variant="outline">编辑</PaperButton>
          </Link>
          {/* 报告生成按钮 */}
          <PaperButton
            variant="secondary"
            onClick={() => handleGenerateReport('pdf')}
          >
            生成PDF报告
          </PaperButton>
          {/* 状态更新按钮 */}
          <PaperButton variant="primary" onClick={() => setShowStatusModal(true)}>
            更新状态
          </PaperButton>
        </div>
      </div>

      {/* 状态流转进度条 */}
      <PaperCard>
        <PaperCardContent>
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink-800">测量流程进度</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(measurement.status).bgColor}`}
                style={{ color: getStatusConfig(measurement.status).color }}
              >
                {getStatusConfig(measurement.status).label}
              </span>
            </div>
            <div className="relative pb-4">
              {/* 进度条背景 */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>

              {/* 步骤节点 */}
              <div className="flex justify-between relative z-10">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= getCurrentStepIndex()
                  const isCurrent = index === getCurrentStepIndex()
                  const config = getStatusConfig(step.status)

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className={`relative z-20 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isCompleted ? config.bgColor : 'bg-gray-200'} ${isCurrent ? 'scale-110 ring-4 ring-white' : ''}`}>
                        <div
                          className={`w-3 h-3 rounded-full ${!isCompleted ? 'bg-gray-400' : ''}`}
                          style={isCompleted ? { backgroundColor: config.color } : undefined}
                        ></div>
                      </div>
                      <span className={`mt-2 text-xs font-medium transition-colors ${isCompleted ? 'text-ink-800' : 'text-gray-500'}`}>
                        {step.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 测量单基本信息 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>基本信息</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">测量单号</span>
                <span className="text-ink-800 font-semibold">{measurement.id.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">报价单号</span>
                <span className="text-ink-800">{measurement.quoteNo || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">客户姓名</span>
                <span className="text-ink-800">{measurement.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">项目地址</span>
                <span className="text-ink-800 max-w-[60%] truncate">{measurement.projectAddress || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">状态</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(measurement.status).bgColor}`}
                  style={{ color: getStatusConfig(measurement.status).color }}
                >
                  {getStatusConfig(measurement.status).label}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">测量师</span>
                <span className="text-ink-800">{measurement.surveyorName || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">计划测量时间</span>
                <span className="text-ink-800">
                  {formatDateTime(measurement.scheduledAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">实际测量时间</span>
                <span className="text-ink-800">
                  {formatDateTime(measurement.completedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">创建人</span>
                <span className="text-ink-800">{measurement.createdBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600 font-medium">创建时间</span>
                <span className="text-ink-800">{formatDateTime(measurement.createdAt)}</span>
              </div>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>

      {/* 测量数据 */}
      {measurement.measurementData && (
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量数据</PaperCardTitle>
            <div className="flex space-x-2">
              <PaperButton
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateReport('json')}
              >
                导出JSON
              </PaperButton>
              <PaperButton
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateReport('html')}
              >
                导出HTML
              </PaperButton>
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-ink-600 font-medium">总面积</span>
                <span className="text-ink-800 font-semibold text-lg">
                  {measurement.measurementData?.totalArea?.toFixed(2) ?? '0.00'} m²
                </span>
              </div>
            </div>

            {/* 房间列表 */}
            {measurement.measurementData.rooms && measurement.measurementData.rooms.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-ink-700 font-semibold text-lg">房间详情</h3>
                <div className="overflow-x-auto">
                  <PaperTable>
                    <PaperTableHeader>
                      <PaperTableRow>
                        <PaperTableCell>房间名称</PaperTableCell>
                        <PaperTableCell>房间类型</PaperTableCell>
                        <PaperTableCell>长 × 宽 × 高</PaperTableCell>
                        <PaperTableCell>面积</PaperTableCell>
                        <PaperTableCell>窗户数量</PaperTableCell>
                        <PaperTableCell>门数量</PaperTableCell>
                        <PaperTableCell>备注</PaperTableCell>
                      </PaperTableRow>
                    </PaperTableHeader>
                    <PaperTableBody>
                      {measurement.measurementData.rooms.map((room: MeasurementRoom, index: number) => {
                        const roomTypeLabelMap: Record<string, string> = {
                          'living-room': '客厅',
                          'bedroom': '卧室',
                          'kitchen': '厨房',
                          'bathroom': '卫生间',
                          'other': '其他'
                        }
                        const roomTypeLabel = roomTypeLabelMap[room.type] || room.type

                        return (
                          <PaperTableRow key={index}>
                            <PaperTableCell className="font-medium text-ink-800">{room.name}</PaperTableCell>
                            <PaperTableCell className="text-ink-700">{roomTypeLabel}</PaperTableCell>
                            <PaperTableCell className="text-ink-700">
                              {room.measurements?.length?.toFixed(2) ?? '0.00'} × {room.measurements?.width?.toFixed(2) ?? '0.00'} × {room.measurements?.height?.toFixed(2) ?? '0.00'} m
                            </PaperTableCell>
                            <PaperTableCell className="text-ink-700">{room.area?.toFixed(2) ?? '0.00'} m²</PaperTableCell>
                            <PaperTableCell className="text-ink-700">{room.windows?.count ?? '0'}</PaperTableCell>
                            <PaperTableCell className="text-ink-700">{room.doors?.count ?? '0'}</PaperTableCell>
                            <PaperTableCell className="text-ink-700">{room.notes || '-'}</PaperTableCell>
                          </PaperTableRow>
                        )
                      })}
                    </PaperTableBody>
                  </PaperTable>
                </div>
              </div>
            )}

            {/* 原始数据展示（折叠） */}
            <div className="mt-6">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-800">
                  查看原始数据
                </summary>
                <div className="mt-3 bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-ink-700">
                    {JSON.stringify(measurement.measurementData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 测量照片 */}
      {measurement.homeScreenshotUrl && (
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>测量照片</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border rounded-md overflow-hidden">
                <Image
                  src={measurement.homeScreenshotUrl}
                  alt={`测量照片`}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      )}

      {/* 状态更新模态框 */}
      <MeasurementStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={measurement.status}
        onUpdate={handleUpdateStatus}
      />
    </div>
  )
}
