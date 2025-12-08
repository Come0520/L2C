'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { installationService } from '@/services/installations.client'
import { InstallationListItem, CreateInstallationRequest } from '@/types/installation'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperDialog, PaperDialogContent, PaperDialogHeader, PaperDialogTitle, PaperDialogFooter } from '@/components/ui/paper-dialog'
import { INSTALLATION_STATUS_CONFIG } from '@/constants/installation-order-status'
import { InstallationDetailDrawer } from '../detail/installation-detail-drawer'
import { InstallationCreateForm } from '../form/installation-create-form'
import { InstallationEditForm } from '../form/installation-edit-form'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

// Define TableColumn type locally
interface TableColumn<T> {
  header: string
  accessor: keyof T | string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface InstallationTableProps {
  initialFilters?: any
}

export const InstallationTable: React.FC<InstallationTableProps> = ({ initialFilters = {} }) => {
  const [installations, setInstallations] = useState<InstallationListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, _setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [filters, _setFilters] = useState(initialFilters)
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationListItem | null>(null)
  const [editingInstallation, setEditingInstallation] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'delete'>('create')
  const [formLoading, setFormLoading] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)

  // Fetch installations
  const fetchInstallations = useCallback(async () => {
    setLoading(true)
    try {
      const result = await installationService.getInstallations({
        page,
        pageSize,
        ...filters
      })
      setInstallations(result.installations)
      setTotal(result.total)
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchInstallations()
  }, [fetchInstallations])

  useRealtimeSubscription({
    table: 'installation_orders',
    event: '*',
    channelName: 'installation_orders:list',
    handler: () => {
      fetchInstallations()
    }
  })

  // Handle row click
  const handleRowClick = (installation: InstallationListItem) => {
    setSelectedInstallation(installation)
    setDrawerOpen(true)
  }

  // Handle action button click
  const handleActionClick = async (installation: InstallationListItem, action: string) => {
    setSelectedInstallation(installation)
    if (action === 'create') {
      setDialogType('create')
      setDialogOpen(true)
    } else if (action === 'edit') {
      setDialogType('edit')
      setDialogLoading(true)
      try {
        // Fetch full installation details for editing
        const fullInstallation = await installationService.getInstallationById(installation.id)
        setEditingInstallation(fullInstallation)
        setDialogOpen(true)
      } catch (_) {
      } finally {
        setDialogLoading(false)
      }
    } else if (action === 'delete') {
      setDialogType('delete')
      setDialogOpen(true)
    }
  }

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedInstallation(null)
    setEditingInstallation(null) // Reset editing installation when dialog closes
  }

  // Handle installation edit submit
  const handleInstallationEdit = async (formData: any) => {
    if (!editingInstallation) return

    setFormLoading(true)
    try {
      // Transform form data to match update request type
      const updateData = {
        salesOrderNo: formData.salesOrderNo,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        projectAddress: formData.projectAddress,
        installationType: formData.installationType,
        status: formData.status,
        scheduledAt: formData.scheduledAt,
        appointmentTimeSlot: formData.appointmentTimeSlot,
        estimatedDuration: formData.estimatedDuration,
        installationContact: formData.installationContact,
        installationPhone: formData.installationPhone,
        specialInstructions: formData.specialInstructions,
        environmentRequirements: {
          powerSupply: formData.powerSupply,
          waterSupply: formData.waterSupply,
          ventilation: formData.ventilation,
          lighting: formData.lighting,
          other: formData.otherEnvironmentRequirements
        },
        requiredTools: formData.requiredTools,
        requiredMaterials: formData.requiredMaterials,
        installationFee: formData.installationFee,
        additionalFee: formData.additionalFee,
        materialFee: formData.materialFee,
        feeNotes: formData.feeNotes
      }

      await installationService.updateInstallation(editingInstallation.id, updateData)
      setDialogOpen(false)
      fetchInstallations() // Refresh installations after update
    } catch (_) {
    } finally {
      setFormLoading(false)
    }
  }

  // Handle installation create submit
  const handleInstallationCreate = async (formData: any) => {
    setFormLoading(true)
    try {
      // Transform form data to match CreateInstallationRequest type
      const installationData: CreateInstallationRequest = {
        salesOrderId: formData.salesOrderNo,
        installationType: formData.installationType,
        scheduledAt: formData.scheduledAt,
        appointmentTimeSlot: formData.appointmentTimeSlot,
        estimatedDuration: formData.estimatedDuration,
        installationContact: formData.installationContact,
        installationPhone: formData.installationPhone,
        installationAddress: formData.projectAddress,
        environmentRequirements: {
          powerSupply: formData.powerSupply,
          waterSupply: formData.waterSupply,
          ventilation: formData.ventilation,
          lighting: formData.lighting,
          other: formData.otherEnvironmentRequirements || ''
        },
        requiredTools: formData.requiredTools || [],
        requiredMaterials: formData.requiredMaterials || [],
        specialInstructions: formData.specialInstructions
      }

      await installationService.createInstallation(installationData)
      setDialogOpen(false)
      fetchInstallations() // Refresh installations after creation
    } catch (_) {
    } finally {
      setFormLoading(false)
    }
  }

  // Handle dialog confirm
  const handleDialogConfirm = async () => {
    // Implement dialog confirm logic based on dialog type
    if (dialogType === 'delete' && selectedInstallation) {
      try {
        await installationService.deleteInstallation(selectedInstallation.id)
        fetchInstallations() // Refresh installations after deletion
      } catch (_) {
      }
    }
    setDialogOpen(false)
    setSelectedInstallation(null)
  }

  // Columns definition
  const columns: TableColumn<InstallationListItem>[] = [
    {
      header: '安装单号',
      accessor: 'installationNo',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      header: '销售单号',
      accessor: 'salesOrderNo',
      sortable: true
    },
    {
      header: '客户名称',
      accessor: 'customerName',
      sortable: true
    },
    {
      header: '项目地址',
      accessor: 'projectAddress',
      sortable: true,
      render: (value: string) => (
        <span className="truncate max-w-[200px]">{value}</span>
      )
    },
    {
      header: '安装类型',
      accessor: 'installationType',
      sortable: true,
      render: (value: string) => {
        const typeMap: Record<string, string> = {
          'standard': '标准安装',
          'complex': '复杂安装',
          'supplement': '补装',
          'repair': '维修安装',
          'modification': '改装'
        }
        return typeMap[value] || value
      }
    },
    {
      header: '状态',
      accessor: 'status',
      sortable: true,
      render: (value: string) => {
        const statusConfig = INSTALLATION_STATUS_CONFIG[value as keyof typeof INSTALLATION_STATUS_CONFIG] || { label: value, bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        )
      }
    },
    {
      header: '验收状态',
      accessor: 'acceptanceStatus',
      sortable: true,
      render: (value: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          'pending': { label: '待验收', color: 'bg-yellow-100 text-yellow-800' },
          'passed': { label: '验收通过', color: 'bg-green-100 text-green-800' },
          'failed': { label: '验收失败', color: 'bg-red-100 text-red-800' },
          'partial': { label: '部分通过', color: 'bg-orange-100 text-orange-800' }
        }
        const status = statusMap[value] || { label: value, color: 'bg-gray-100 text-gray-800' }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        )
      }
    },
    {
      header: '安装日期',
      accessor: 'scheduledAt',
      sortable: true,
      render: (value: string) => {
        return new Date(value).toLocaleDateString()
      }
    },
    {
      header: '安装人员',
      accessor: 'installerName',
      sortable: true
    },
    {
      header: '安装团队',
      accessor: 'installationTeamName',
      sortable: true
    },
    {
      header: '质量评分',
      accessor: 'qualityRating',
      sortable: true,
      render: (value?: number) => {
        if (!value) return '-';
        return (
          <span className="font-medium">{value.toFixed(1)}</span>
        )
      }
    },
    {
      header: '客户满意度',
      accessor: 'customerSatisfaction',
      sortable: true,
      render: (value?: number) => {
        if (!value) return '-';
        return (
          <span className="font-medium">{value.toFixed(1)}</span>
        )
      }
    },
    {
      header: '创建时间',
      accessor: 'createdAt',
      sortable: true,
      render: (value: string) => {
        return new Date(value).toLocaleDateString()
      }
    },
    {
      header: '操作',
      accessor: 'id',
      render: (_: string, row: InstallationListItem) => (
        <div className="flex space-x-2">
          <PaperButton
            variant="outline"
            size="small"
            onClick={() => handleRowClick(row)}
          >
            查看
          </PaperButton>
          <PaperButton
            variant="outline"
            size="small"
            onClick={() => handleActionClick(row, 'edit')}
          >
            编辑
          </PaperButton>
          <PaperButton
            variant="outline"
            size="small"
            onClick={() => handleActionClick(row, 'delete')}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            删除
          </PaperButton>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">安装单管理</h2>
        <div className="flex space-x-2">
          <PaperButton
            variant="primary"
            onClick={() => handleActionClick({} as InstallationListItem, 'create')}
          >
            创建安装单
          </PaperButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-paper-600 bg-paper-100 shadow-paper">
        {/* Table Header */}
        <div className="bg-paper-300">
          <div className="grid grid-cols-12 gap-2 p-4">
            {columns.map((column) => (
              <div key={column.accessor} className="font-medium text-ink-700">
                {column.header}
              </div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="divide-y divide-paper-500">
            {installations.map((installation, index) => (
              <div
                key={installation.id}
                className={`grid grid-cols-12 gap-2 p-4 hover:bg-paper-200 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-paper-100' : 'bg-paper-200'}`}
                onClick={() => handleRowClick(installation)}
              >
                {columns.map((column) => {
                  const value = (installation as any)[column.accessor];
                  return (
                    <div key={column.accessor} className="align-middle">
                      {column.render ? column.render(value, installation) : value}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Table Footer */}
        {total > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-paper-600 bg-paper-200">
            <div className="text-sm text-ink-500">
              显示 {((page - 1) * pageSize) + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-paper-600 rounded-md bg-paper-100 hover:bg-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm">
                第 {page} 页，共 {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => setPage(page < Math.ceil(total / pageSize) ? page + 1 : page)}
                disabled={page === Math.ceil(total / pageSize)}
                className="px-3 py-1 border border-paper-600 rounded-md bg-paper-100 hover:bg-paper-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <PaperDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      >
        <PaperDialogHeader>
          <PaperDialogTitle>
            {dialogType === 'create' ? '创建安装单' :
              dialogType === 'edit' ? '编辑安装单' :
                '删除安装单'}
          </PaperDialogTitle>
        </PaperDialogHeader>

        <PaperDialogContent>
          {/* Dialog content based on dialogType */}
          {dialogType === 'create' && (
            <div className="space-y-4 p-6">
              <InstallationCreateForm
                onSubmit={handleInstallationCreate}
                onCancel={handleDialogClose}
                loading={formLoading}
              />
            </div>
          )}
          {dialogType === 'edit' && dialogLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p>加载安装单详情...</p>
              </div>
            </div>
          )}
          {dialogType === 'edit' && !dialogLoading && editingInstallation && (
            <div className="space-y-4 p-6">
              <InstallationEditForm
                installation={editingInstallation}
                onSubmit={handleInstallationEdit}
                onCancel={handleDialogClose}
                loading={formLoading}
              />
            </div>
          )}
          {dialogType === 'delete' && (
            <div className="space-y-4 p-6">
              <p>确定要删除安装单 {selectedInstallation?.installationNo} 吗？</p>
              <p className="text-sm text-red-600">此操作不可恢复</p>
            </div>
          )}
        </PaperDialogContent>

        {dialogType === 'delete' && (
          <PaperDialogFooter>
            <PaperButton
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              className="mr-2"
            >
              取消
            </PaperButton>
            <PaperButton
              type="button"
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDialogConfirm}
            >
              删除
            </PaperButton>
          </PaperDialogFooter>
        )}
      </PaperDialog>

      {/* Installation Detail Drawer */}
      {selectedInstallation && (
        <InstallationDetailDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            setSelectedInstallation(null)
          }}
          installationId={selectedInstallation.id}
        />
      )}
    </div>
  )
}
