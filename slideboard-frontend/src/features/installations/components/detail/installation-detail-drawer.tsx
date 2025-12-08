'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { PaperDrawer } from '@/components/ui/paper-drawer'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperTabs, PaperTab } from '@/components/ui/paper-tabs'
import { PaperDialog } from '@/components/ui/paper-dialog'
import { installationService } from '@/services/installations.client'
import { Installation } from '@/types/installation'
import { INSTALLATION_STATUS_CONFIG, installationTypeMap, acceptanceStatusMap } from '@/constants/installation-order-status'
import { installationQualityCheckService } from '@/services/installation-quality-check.client'
import { installationCustomerFeedbackService } from '@/services/installation-customer-feedback.client'
import { InstallationStatusUpdateForm } from '../form/installation-status-update-form'
import { InstallationTeamAssignmentForm } from '../form/installation-team-assignment-form'
import { InstallationQualityCheckForm } from '../form/installation-quality-check-form'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

interface InstallationDetailDrawerProps {
  open: boolean
  onClose: () => void
  installationId: string
}

export const InstallationDetailDrawer: React.FC<InstallationDetailDrawerProps> = ({ open, onClose, installationId }) => {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [qualityCheck, setQualityCheck] = useState<any>(null)
  const [customerFeedback, setCustomerFeedback] = useState<any>(null)
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [teamAssignmentDialogOpen, setTeamAssignmentDialogOpen] = useState(false)
  const [teamAssignmentLoading, setTeamAssignmentLoading] = useState(false)
  const [qualityCheckDialogOpen, setQualityCheckDialogOpen] = useState(false)
  const [qualityCheckLoading, setQualityCheckLoading] = useState(false)

  // Fetch installation details
  const fetchInstallationDetails = useCallback(async () => {
    setLoading(true)
    try {
      const result = await installationService.getInstallationById(installationId)
      setInstallation(result)
      
      // Fetch quality check
      const qualityCheckResult = await installationQualityCheckService.getQualityCheckByInstallationId(installationId)
      setQualityCheck(qualityCheckResult)
      
      // Fetch customer feedback
      const feedbackResult = await installationCustomerFeedbackService.getCustomerFeedbackByInstallationId(installationId)
      setCustomerFeedback(feedbackResult)
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }, [installationId])

  useEffect(() => {
    if (open && installationId) {
      fetchInstallationDetails()
    }
  }, [open, installationId, fetchInstallationDetails])

  useRealtimeSubscription({
    table: 'installation_orders',
    event: '*',
    filter: installationId ? `id=eq.${installationId}` : undefined,
    channelName: installationId ? `installation_orders:${installationId}` : 'installation_orders:detail',
    handler: () => {
      if (open && installationId) {
        fetchInstallationDetails()
      }
    }
  })

  // Handle status update submit
  const handleStatusUpdate = async (formData: any) => {
    if (!installation) return
    
    setStatusUpdateLoading(true)
    try {
      await installationService.updateInstallationStatus(installation.id, formData.status)
      
      // Refresh installation details after status update
      fetchInstallationDetails()
      setStatusUpdateDialogOpen(false)
    } catch (_) {
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  // Handle team assignment submit
  const handleTeamAssignment = async (formData: any) => {
    if (!installation) return
    
    setTeamAssignmentLoading(true)
    try {
      await installationService.updateInstallation(installation.id, {
        installationTeamId: formData.installationTeamId,
        installerId: formData.installerId
      })
      
      // Refresh installation details after team assignment
      fetchInstallationDetails()
      setTeamAssignmentDialogOpen(false)
    } catch (_) {
    } finally {
      setTeamAssignmentLoading(false)
    }
  }

  // Handle quality check submit
  const handleQualityCheckSubmit = async (formData: any) => {
    if (!installation) return
    
    setQualityCheckLoading(true)
    try {
      if (qualityCheck) {
        // Update existing quality check
        await installationQualityCheckService.updateQualityCheck(qualityCheck.id, formData)
      } else {
        // Create new quality check
        await installationQualityCheckService.createQualityCheck({
          installationId: installation.id,
          installationNo: installation.installationNo,
          customerName: installation.customerName,
          projectAddress: installation.projectAddress,
          ...formData
        })
      }
      
      // Refresh installation details and quality check after submission
      fetchInstallationDetails()
      setQualityCheckDialogOpen(false)
    } catch (_) {
    } finally {
      setQualityCheckLoading(false)
    }
  }

  if (loading) {
    return (
      <PaperDrawer isOpen={open} onClose={onClose} title="安装单详情" width="lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        </div>
      </PaperDrawer>
    )
  }

  if (!installation) {
    return (
      <PaperDrawer isOpen={open} onClose={onClose} title="安装单详情" width="lg">
        <div className="text-center py-12">
          <p>未找到安装单信息</p>
          <PaperButton variant="primary" onClick={onClose} className="mt-4">
            关闭
          </PaperButton>
        </div>
      </PaperDrawer>
    )
  }

  return (
    <PaperDrawer isOpen={open} onClose={onClose} title="安装详情" width="lg">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装单号</h3>
              <p className="font-bold">{installation.installationNo}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">销售单号</h3>
              <p>{installation.salesOrderNo}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">客户名称</h3>
              <p>{installation.customerName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">客户电话</h3>
              <p>{installation.customerPhone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">项目地址</h3>
              <p>{installation.projectAddress}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">测量单号</h3>
              <p>{installation.measurementId || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装类型</h3>
              <p>{installationTypeMap[installation.installationType] || installation.installationType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装状态</h3>
              <p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INSTALLATION_STATUS_CONFIG[installation.status].bgColor} ${INSTALLATION_STATUS_CONFIG[installation.status].textColor}`}>
                  {INSTALLATION_STATUS_CONFIG[installation.status].label}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">验收状态</h3>
              <p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${acceptanceStatusMap[installation.acceptanceStatus].color}`}>
                  {acceptanceStatusMap[installation.acceptanceStatus].label}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装日期</h3>
              <p>{new Date(installation.scheduledAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">预约时段</h3>
              <p>{installation.appointmentTimeSlot}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">预计时长</h3>
              <p>{installation.estimatedDuration} 分钟</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装人员</h3>
              <p>{installation.installerName || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">安装团队</h3>
              <p>{installation.installationTeamName || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">现场联系人</h3>
              <p>{installation.installationContact}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">联系人电话</h3>
              <p>{installation.installationPhone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">质量评分</h3>
              <p>{installation.qualityRating || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">客户满意度</h3>
              <p>{installation.customerSatisfaction || '-'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <PaperTabs value={activeTab} onValueChange={setActiveTab}>
          <PaperTab value="basic">基本信息</PaperTab>
          <PaperTab value="requirements">需求信息</PaperTab>
          <PaperTab value="quality">质量检查</PaperTab>
          <PaperTab value="feedback">客户反馈</PaperTab>
          <PaperTab value="data">安装数据</PaperTab>
          <PaperTab value="financial">费用信息</PaperTab>
        </PaperTabs>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">特殊说明</h3>
                <p>{installation.specialInstructions || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">创建时间</h3>
                  <p>{new Date(installation.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">更新时间</h3>
                  <p>{new Date(installation.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">创建人</h3>
                  <p>{installation.createdByName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">完成时间</h3>
                  <p>{installation.completedAt ? new Date(installation.completedAt).toLocaleString() : '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">环境要求</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${installation.environmentRequirements.powerSupply ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>电源供应</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${installation.environmentRequirements.waterSupply ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>水源供应</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${installation.environmentRequirements.ventilation ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>通风条件</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${installation.environmentRequirements.lighting ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span>照明条件</span>
                  </div>
                  {installation.environmentRequirements.other && (
                    <div className="flex items-start">
                      <span className="inline-block w-3 h-3 rounded-full mr-2 mt-1 bg-yellow-500"></span>
                      <span>{installation.environmentRequirements.other}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">所需工具</h3>
                <div className="mt-2">
                  {installation.requiredTools.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {installation.requiredTools.map((tool, index) => (
                        <li key={index}>{tool}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">所需材料</h3>
                <div className="mt-2">
                  {installation.requiredMaterials.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {installation.requiredMaterials.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quality Check Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              {qualityCheck ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">质量检查记录</h3>
                    <PaperButton variant="outline" size="small" onClick={() => setQualityCheckDialogOpen(true)}>
                      编辑质量检查
                    </PaperButton>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">检查日期</h3>
                      <p>{new Date(qualityCheck.checkDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">检查人</h3>
                      <p>{qualityCheck.checkerName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">检查结果</h3>
                      <p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${qualityCheck.overallResult === 'pass' ? 'bg-green-100 text-green-800' : qualityCheck.overallResult === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {qualityCheck.overallResult === 'pass' ? '通过' : qualityCheck.overallResult === 'partial' ? '部分通过' : '未通过'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">检查项数量</h3>
                      <p>{qualityCheck.checkItems.length}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">检查备注</h3>
                    <p>{qualityCheck.notes || '-'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">检查项目</h3>
                    <div className="mt-2 space-y-3">
                      {qualityCheck.checkItems.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium">{item.name}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.result === 'pass' ? 'bg-green-100 text-green-800' : item.result === 'na' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                              {item.result === 'pass' ? '通过' : item.result === 'na' ? '不适用' : '未通过'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">标准：{item.standard}</div>
                          {item.notes && (
                            <div className="text-sm text-gray-600">备注：{item.notes}</div>
                          )}
                          {item.photoUrl && (
                            <div className="mt-2">
                              <Image 
                                src={item.photoUrl} 
                                alt={item.name} 
                                width={320}
                                height={128}
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                <p>暂无质量检查记录</p>
                <PaperButton variant="primary" className="mt-4" onClick={() => setQualityCheckDialogOpen(true)}>
                  添加质量检查
                </PaperButton>
              </div>
              )}
            </div>
          )}

          {/* Customer Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {customerFeedback ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">客户名称</h3>
                      <p>{customerFeedback.customerName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">评分</h3>
                      <p className="font-bold text-xl">{customerFeedback.rating} / 5</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">反馈时间</h3>
                      <p>{new Date(customerFeedback.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">反馈内容</h3>
                    <p className="mt-1">{customerFeedback.feedback}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>暂无客户反馈</p>
                  <PaperButton variant="primary" className="mt-4">
                    添加客户反馈
                  </PaperButton>
                </div>
              )}
            </div>
          )}

          {/* Installation Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">安装数据</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {installation.installationData.installationStartTime && (
                    <div>
                      <h4 className="text-xs text-gray-500">开始时间</h4>
                      <p>{new Date(installation.installationData.installationStartTime).toLocaleString()}</p>
                    </div>
                  )}
                  {installation.installationData.installationEndTime && (
                    <div>
                      <h4 className="text-xs text-gray-500">结束时间</h4>
                      <p>{new Date(installation.installationData.installationEndTime).toLocaleString()}</p>
                    </div>
                  )}
                  {installation.installationData.actualDuration && (
                    <div>
                      <h4 className="text-xs text-gray-500">实际时长</h4>
                      <p>{installation.installationData.actualDuration} 分钟</p>
                    </div>
                  )}
                </div>
              </div>

              {installation.installationData.materialsUsed && installation.installationData.materialsUsed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">使用材料</h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">材料名称</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {installation.installationData.materialsUsed.map((material: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">{material.name}</td>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">{material.quantity}</td>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">{material.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {installation.installationData.toolsUsed && installation.installationData.toolsUsed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">使用工具</h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工具名称</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {installation.installationData.toolsUsed.map((tool: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">{tool.name}</td>
                            <td className="px-4 py-2 text-sm whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tool.status === 'normal' ? 'bg-green-100 text-green-800' : tool.status === 'damaged' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {tool.status === 'normal' ? '正常' : tool.status === 'damaged' ? '损坏' : '丢失'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {installation.installationData.problemsEncountered && installation.installationData.problemsEncountered.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">遇到的问题</h3>
                  <div className="mt-2 space-y-2">
                    {installation.installationData.problemsEncountered.map((problem: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="font-medium mb-1">问题 {index + 1}</div>
                        <div className="text-sm text-gray-600 mb-1">描述：{problem.description}</div>
                        <div className="text-sm text-gray-600">解决方案：{problem.solution}</div>
                        <div className="text-sm mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${problem.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {problem.resolved ? '已解决' : '未解决'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Financial Info Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">安装费用</h3>
                  <p className="font-bold">¥{installation.installationFee.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">额外费用</h3>
                  <p>¥{installation.additionalFee.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">材料费用</h3>
                  <p>¥{installation.materialFee.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">总费用</h3>
                  <p className="font-bold text-xl">¥{(installation.installationFee + installation.additionalFee + installation.materialFee).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">费用备注</h3>
                <p>{installation.feeNotes || '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <PaperButton variant="outline" onClick={onClose}>
            关闭
          </PaperButton>
          <PaperButton variant="primary" onClick={() => setStatusUpdateDialogOpen(true)}>
            更新状态
          </PaperButton>
          <PaperButton variant="primary" onClick={() => setTeamAssignmentDialogOpen(true)}>
            分配团队
          </PaperButton>
          <PaperButton variant="primary">
            编辑
          </PaperButton>
          <PaperButton variant="primary">
            打印
          </PaperButton>
        </div>
      </div>
      
      {/* Status Update Dialog */}
      <PaperDialog
        open={statusUpdateDialogOpen}
        onOpenChange={setStatusUpdateDialogOpen}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold leading-none tracking-tight">更新安装状态</h3>
          </div>
          {installation && (
            <InstallationStatusUpdateForm
              currentStatus={installation.status}
              onSubmit={handleStatusUpdate}
              onCancel={() => setStatusUpdateDialogOpen(false)}
              loading={statusUpdateLoading}
            />
          )}
        </div>
      </PaperDialog>
      
      {/* Team Assignment Dialog */}
      <PaperDialog
        open={teamAssignmentDialogOpen}
        onOpenChange={setTeamAssignmentDialogOpen}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold leading-none tracking-tight">分配安装团队</h3>
          </div>
          {installation && (
            <InstallationTeamAssignmentForm
              installationId={installation.id}
              currentTeamId={installation.installationTeamId}
              currentInstallerId={installation.installerId}
              onSubmit={handleTeamAssignment}
              onCancel={() => setTeamAssignmentDialogOpen(false)}
              loading={teamAssignmentLoading}
            />
          )}
        </div>
      </PaperDialog>
      
      {/* Quality Check Dialog */}
      <PaperDialog
        open={qualityCheckDialogOpen}
        onOpenChange={setQualityCheckDialogOpen}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold leading-none tracking-tight">{qualityCheck ? "编辑质量检查" : "添加质量检查"}</h3>
          </div>
          {installation && (
            <InstallationQualityCheckForm
              installationId={installation.id}
              existingCheck={qualityCheck}
              onSubmit={handleQualityCheckSubmit}
              onCancel={() => setQualityCheckDialogOpen(false)}
              loading={qualityCheckLoading}
            />
          )}
        </div>
      </PaperDialog>
    </PaperDrawer>
  )
}
