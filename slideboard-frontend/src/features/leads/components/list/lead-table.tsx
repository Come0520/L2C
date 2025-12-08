import React from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell, PaperTablePagination, PaperTableToolbar } from '@/components/ui/paper-table'
import { BusinessTagsList, CustomerLevelTag } from '@/features/leads/components/business-tag'
import LeadActionButtons from '@/features/leads/components/lead-action-buttons'
import LeadStatusBadge from '@/features/leads/components/lead-status-badge'
import { LeadItem } from '@/types/lead'

interface LeadTableProps {
    leads: LeadItem[]
    totalItems: number
    currentPage: number
    totalPages: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (size: number) => void
    onAction: (action: string, lead: LeadItem) => void
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

    // 格式化时间显示
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-'
        const d = new Date(timeStr)
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        return `${mm}-${dd} ${hh}:${mi}`
    }


    // 检查是否需要预约提醒高亮
    const getAppointmentHighlight = (lead: LeadItem) => {
        if (!lead.appointmentTime || !lead.appointmentReminder) return ''
        if (lead.appointmentReminder === '24h') return 'bg-red-50 border-red-200'
        if (lead.appointmentReminder === '48h') return 'bg-orange-50 border-orange-200'
        return ''
    }



    return (
        <PaperCard>
            <PaperTableToolbar>
                <div className="flex items-center space-x-2">
                    <PaperButton variant="primary" onClick={() => onToolbarAction && onToolbarAction('create')}>新建线索</PaperButton>
                    <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('import')}>导入</PaperButton>
                    <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('dedupe')}>去重/合并</PaperButton>
                    {['sales_manager', 'business_manager'].includes(currentUserRole || '') && (
                        <PaperButton variant="outline" onClick={() => onToolbarAction && onToolbarAction('batch_assign')}>批量分配</PaperButton>
                    )}
                    <div className="relative">
                        <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span>导出当前页</span>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                            <button onClick={() => onToolbarAction && onToolbarAction('export_csv')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">CSV</button>
                            <button onClick={() => onToolbarAction && onToolbarAction('export_excel')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Excel</button>
                            <button onClick={() => onToolbarAction && onToolbarAction('export_pdf')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">PDF</button>
                        </div>
                    </div>
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
                            <PaperTableRow key={l.id} className={getAppointmentHighlight(l)}>
                                <PaperTableCell>
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedIds.includes(l.id)}
                                        onChange={(e) => handleSelectOne(l.id, e.target.checked)}
                                        disabled={!onSelectionChange}
                                    />
                                </PaperTableCell>
                                <PaperTableCell>
                                    <span className="font-mono text-sm">{l.leadNumber}</span>
                                </PaperTableCell>
                                <PaperTableCell>
                                    <div>
                                        <p className="font-medium text-ink-800">{l.customerName}</p>
                                        <p className="text-xs text-ink-500 mt-0.5">{l.projectAddress || '-'}</p>
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
                                    <CustomerLevelTag level={l.customerLevel} />
                                </PaperTableCell>
                                <PaperTableCell>
                                    <LeadStatusBadge status={l.status} />
                                </PaperTableCell>
                                <PaperTableCell>
                                    <div>
                                        {l.appointmentTime ? (
                                            <>
                                                <p className="text-sm font-medium">{formatTime(l.appointmentTime)}</p>
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
                                    <BusinessTagsList tags={l.businessTags} />
                                </PaperTableCell>
                                <PaperTableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center text-xs">
                                            <span className="w-12 text-ink-500">销售:</span>
                                            <span>{l.currentOwner.name}</span>
                                        </div>
                                        {l.designer && (
                                            <div className="flex items-center text-xs">
                                                <span className="w-12 text-ink-500">设计:</span>
                                                <span>{l.designer.name}</span>
                                            </div>
                                        )}
                                        {l.shoppingGuide && (
                                            <div className="flex items-center text-xs">
                                                <span className="w-12 text-ink-500">导购:</span>
                                                <span>{l.shoppingGuide.name}</span>
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
    )
}
