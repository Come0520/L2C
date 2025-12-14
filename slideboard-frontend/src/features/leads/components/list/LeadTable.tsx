import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import React, { useState } from 'react'

import { ExportMenu, type ExportFormat } from '@/components/ui/export-menu'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { BusinessTagsList, CustomerLevelTag } from '@/features/leads/components/BusinessTag'
import LeadActionButtons from '@/features/leads/components/LeadActionButtons'
import LeadStatusBadge from '@/features/leads/components/LeadStatusBadge'
import { QuickActionsBar } from '@/features/leads/components/list/QuickActionsBar'
import { Lead } from '@/shared/types/lead'
import { formatDateTime } from '@/utils/date'

interface LeadTableProps {
    leads: Lead[]
    totalItems: number
    currentPage: number
    totalPages: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (size: number) => void
    onAction: (action: string, lead: Lead) => void
    isLoading?: boolean
    currentUserRole?: string
    onToolbarAction?: (action: string) => void
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
}

export function LeadTable({
    leads,
    totalItems,
    currentPage,
    totalPages,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    onAction,
    isLoading = false,
    currentUserRole = 'sales_manager',
    onToolbarAction,
    selectedIds = [],
    onSelectionChange
}: LeadTableProps) {
    // 悬浮状态管理
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

    // 处理全选/取消全选
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange?.(leads.map(l => l.id))
        } else {
            onSelectionChange?.([])
        }
    }

    // 处理单选
    const handleSelectOne = (id: string, checked: boolean) => {
        if (!onSelectionChange) return
        if (checked) {
            onSelectionChange([...selectedIds, id])
        } else {
            onSelectionChange(selectedIds.filter(sid => sid !== id))
        }
    }

    const allSelected = leads.length > 0 && leads.every(l => selectedIds.includes(l.id))
    const someSelected = leads.some(l => selectedIds.includes(l.id)) && !allSelected

    // 检查是否需要预约提醒高亮
    const getAppointmentHighlight = (lead: Lead) => {
        if (!lead.appointmentTime || !lead.appointmentReminder) return ''
        if (lead.appointmentReminder === '24h') return 'bg-red-50 border-red-200'
        if (lead.appointmentReminder === '48h') return 'bg-orange-50 border-orange-200'
        return ''
    }

    // Check for timeout warnings (overdue)
    const getTimeoutWarning = (lead: Lead) => {
        if (!lead.lastStatusChangeAt) return null;

        const now = new Date().getTime();
        const lastChange = new Date(lead.lastStatusChangeAt).getTime();
        const diffHours = (now - lastChange) / (1000 * 60 * 60);

        // Define timeout thresholds based on status
        let threshold = 0;
        let warningText = '';

        switch (lead.status) {
            case 'PENDING_ASSIGNMENT': // 待分配
                threshold = 24; // 24 hours
                warningText = '待分配超时';
                break;
            case 'PENDING_FOLLOW_UP': // 待跟踪
                threshold = 48; // 48 hours
                warningText = '待跟踪超时';
                break;
            case 'FOLLOWING_UP': // 跟踪中 (7 days no update)
                threshold = 24 * 7;
                warningText = '长期未跟进';
                break;
            case 'PENDING_MEASUREMENT': // 待测量
                threshold = 48;
                warningText = '待测量超时';
                break;
            case 'PLAN_PENDING_CONFIRMATION': // 方案待确认
                threshold = 72;
                warningText = '方案确认超时';
                break;
            default:
                return null;
        }

        if (diffHours > threshold) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-2">
                    <svg className="mr-1 h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {warningText} ({Math.floor(diffHours)}h)
                </span>
            );
        }
        return null;
    }


    return (
        <>
            <PaperCard>
                <PaperTableToolbar>
                    <div className="flex items-center space-x-2">
                        <PaperButton variant="primary" onClick={() => onToolbarAction && onToolbarAction('create')}>新建线索</PaperButton>
                        <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('import')}>导入</PaperButton>
                        <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('dedupe')}>去重/合并</PaperButton>
                        {['sales_manager', 'business_manager'].includes(currentUserRole || '') && (
                            <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('batch_assign')}>批量分配</PaperButton>
                        )}
                        <ExportMenu
                            onExport={(format: ExportFormat) => {
                                onToolbarAction && onToolbarAction(`export_${format}`)
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <select
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value))
                                onPageChange(1)
                            }}
                        >
                            <option value={10}>每页 10 条</option>
                            <option value={20}>每页 20 条</option>
                            <option value={50}>每页 50 条</option>
                            <option value={100}>每页 100 条</option>
                        </select>
                        <div className="text-sm text-ink-500">共 {totalItems} 条</div>
                    </div>
                </PaperTableToolbar>
                <PaperCardContent className="p-0 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    )}
                    <PaperTable>
                        <PaperTableHeader>
                            <PaperTableCell className="w-12">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={allSelected}
                                    ref={input => { if (input) input.indeterminate = someSelected }}
                                    onChange={handleSelectAll}
                                    disabled={!onSelectionChange}
                                />
                            </PaperTableCell>
                            <PaperTableCell>线索编号</PaperTableCell>
                            <PaperTableCell>客户信息</PaperTableCell>
                            {/* <PaperTableCell>需求概述</PaperTableCell> */}
                            <PaperTableCell>客户等级</PaperTableCell>
                            <PaperTableCell>状态</PaperTableCell>
                            <PaperTableCell>预约时间</PaperTableCell>
                            <PaperTableCell>业务标签</PaperTableCell>
                            <PaperTableCell>归属人员</PaperTableCell>
                            <PaperTableCell>操作</PaperTableCell>
                        </PaperTableHeader>
                        <PaperTableBody>
                            {leads.map((l) => (
                                <PaperTableRow
                                    key={l.id}
                                    className={`${getAppointmentHighlight(l)} group relative`}
                                    onMouseEnter={() => setHoveredRow(l.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <PaperTableCell>
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.includes(l.id)}
                                            onChange={(e) => handleSelectOne(l.id, e.target.checked)}
                                            disabled={!onSelectionChange}
                                        />
                                    </PaperTableCell>
                                    <PaperTableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{l.leadNumber}</span>
                                            <span className="text-xs text-ink-400">{formatDateTime(l.createdAt)}</span>
                                        </div>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{l.name}</span>
                                                {getTimeoutWarning(l)}
                                            </div>
                                            <span className="text-xs text-ink-500">{l.phone}</span>
                                            <span className="text-xs text-ink-400 truncate max-w-[150px]" title={l.projectAddress}>{l.projectAddress}</span>
                                        </div>
                                    </PaperTableCell>
                                    {/* <PaperTableCell>
                                    <div className="max-w-xs">
                                        <p className="text-sm text-ink-700 truncate" title={l.requirements.join('，')}>
                                            {l.requirements.join('，')}
                                        </p>
                                        <p className="text-xs text-ink-500">
                                            {l.areaSize}㎡
                                            <span className="mx-1">|</span>
                                            ¥{l.budgetMin.toLocaleString()}-¥{l.budgetMax.toLocaleString()}
                                        </p>
                                    </div>
                                </PaperTableCell> */}
                                    <PaperTableCell>
                                        <CustomerLevelTag level={l.customerLevel as any} />
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <LeadStatusBadge status={l.status} />
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <div>
                                            {l.appointmentTime ? (
                                                <>
                                                    <p className="text-sm font-medium">{formatDateTime(l.appointmentTime, 'MM-DD HH:mm')}</p>
                                                    {l.appointmentReminder && (
                                                        <p className="text-xs text-orange-600">{l.appointmentReminder}</p>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-ink-400">-</span>
                                            )}
                                        </div>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <BusinessTagsList tags={l.businessTags as any[]} />
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs">
                                                <span className="w-12 text-ink-500">销售:</span>
                                                <span>{l.assignedToName || '-'}</span>
                                            </div>
                                            {l.designerName && (
                                                <div className="flex items-center text-xs">
                                                    <span className="w-12 text-ink-500">设计:</span>
                                                    <span>{l.designerName}</span>
                                                </div>
                                            )}
                                            {l.shoppingGuideName && (
                                                <div className="flex items-center text-xs">
                                                    <span className="w-12 text-ink-500">导购:</span>
                                                    <span>{l.shoppingGuideName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <LeadActionButtons
                                            lead={l}
                                            currentUserRole={currentUserRole}
                                            onAction={(action) => onAction(action, l)}
                                        />
                                        <div className="mt-2">
                                            <PaperButton variant="outline" size="sm" onClick={() => onAction('copyLink', l)}>复制详情链接</PaperButton>
                                        </div>

                                        {/* 快速操作栏 */}
                                        <QuickActionsBar
                                            lead={l}
                                            onAction={(action) => onAction(action, l)}
                                            visible={hoveredRow === l.id}
                                        />
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
                        onPageChange={onPageChange}
                    />
                </PaperCardContent>
            </PaperCard>

            {/* 批量操作浮动栏 */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50
                          bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg
                          flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4">
                    <span className="font-medium">已选择 {selectedIds.length} 项</span>
                    <div className="flex items-center space-x-2">
                        <PaperButton
                            variant="outline"
                            size="sm"
                            className="bg-white text-blue-600 hover:bg-gray-100 border-none"
                            onClick={() => onToolbarAction?.('batch_assign')}
                        >
                            批量分配
                        </PaperButton>
                        <PaperButton
                            variant="outline"
                            size="sm"
                            className="bg-white text-blue-600 hover:bg-gray-100 border-none"
                            onClick={() => onToolbarAction?.('batch_export')}
                        >
                            批量导出
                        </PaperButton>
                        <PaperButton
                            variant="outline"
                            size="sm"
                            className="bg-white text-blue-600 hover:bg-gray-100 border-none"
                            onClick={() => onToolbarAction?.('batch_tag')}
                        >
                            添加标签
                        </PaperButton>
                        <button
                            onClick={() => onSelectionChange?.([])}
                            className="text-white hover:text-gray-200 transition-colors"
                            aria-label="取消选择"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
