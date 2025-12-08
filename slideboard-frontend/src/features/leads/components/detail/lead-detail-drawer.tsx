import { useEffect, useState } from 'react'

import { PaperBadge } from '@/components/ui/paper-badge'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperDrawer } from '@/components/ui/paper-drawer'
import { BusinessTagsList, CustomerLevelTag } from '@/features/leads/components/business-tag'
import LeadStatusBadge from '@/features/leads/components/lead-status-badge'
import { leadService } from '@/services/leads.client'
import { LeadItem } from '@/types/lead'

import { LeadTimeline } from './lead-timeline'
import QuoteDetails from '../quote-details'

interface LeadDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    lead: LeadItem | null
}

type LeadAssignmentRecord = {
    id: string
    toUser?: { name?: string }
    createdAt: string
    assignmentReason?: string
}

export function LeadDetailDrawer({ isOpen, onClose, lead }: LeadDetailDrawerProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'files' | 'quotes' | 'assignments' | 'status-history'>('overview')
    const [statusHistory, setStatusHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [assignments, setAssignments] = useState<LeadAssignmentRecord[]>([])

    const tabs = [
        { key: 'overview' as const, label: '概览' },
        { key: 'timeline' as const, label: '跟进记录' },
        { key: 'assignments' as const, label: '分配记录' },
        { key: 'status-history' as const, label: '状态变更' },
        { key: 'quotes' as const, label: '报价详情' },
        { key: 'files' as const, label: '相关文件' },
    ]

    useEffect(() => {
        let mounted = true
            ; (async () => {
                if (!lead) return

                // Fetch assignments
                const assignmentsData = await leadService.getLeadAssignments(lead.id)
                if (mounted) setAssignments(assignmentsData as LeadAssignmentRecord[])

                // Fetch status history if tab is active
                if (activeTab === 'status-history') {
                    setIsLoading(true)
                    try {
                        const response = await fetch(`/api/leads/${lead.id}/status-history`)
                        if (response.ok) {
                            const data = await response.json()
                            if (mounted) {
                                setStatusHistory(data)
                            }
                        } else {
                            console.error('Failed to fetch status history:', response.statusText)
                        }
                    } catch (error) {
                        console.error('Failed to fetch status history:', error)
                    } finally {
                        if (mounted) {
                            setIsLoading(false)
                        }
                    }
                }

                // Fetch quotes if tab is active
                if (activeTab === 'quotes') {
                    // We need to implement fetching quotes here or pass them to QuoteDetails
                    // For now, let's assume QuoteDetails will handle it or we fetch and pass
                    // But QuoteDetails currently takes `lead` which has `quoteDetails`.
                    // We should probably update QuoteDetails to take `quotes` prop.
                }
            })()
        return () => { mounted = false }
    }, [lead, activeTab])

    if (!lead) return null

    // 报价相关操作
    const handleGenerateNewQuote = (fromVersion?: number) => {
        // Navigate to create quote page
        let url = `/quotes/create?leadId=${lead.id}`
        if (fromVersion) {
            url += `&fromVersion=${fromVersion}`
        }
        window.location.href = url
    }

    const handleSetCurrentVersion = () => {
        // 设置当前版本逻辑
    }

    const handleDraftSign = () => {
        // 草签逻辑
    }

    const handleEditQuote = (quoteId: string) => {
        // Navigate to edit quote page
        window.location.href = `/quotes/${quoteId}/edit`
    }

    return (
        <PaperDrawer isOpen={isOpen} onClose={onClose} title={`线索详情 - ${lead.customerName}`} width="xl">
            {/* Tabs */}
            <div className="flex border-b border-paper-300 px-6 pt-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === tab.key
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-ink-500 hover:text-ink-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="px-6 py-4">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-ink-800 mb-4">基本信息</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-ink-500">线索编号</label>
                                    <p className="font-mono text-ink-800 mt-1">{lead.leadNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">客户姓名</label>
                                    <p className="text-ink-800 mt-1">{lead.customerName}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">联系电话</label>
                                    <p className="text-ink-800 mt-1">{lead.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">项目地址</label>
                                    <p className="text-ink-800 mt-1">{lead.projectAddress || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">客户等级</label>
                                    <div className="mt-1">
                                        <CustomerLevelTag level={lead.customerLevel} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">状态</label>
                                    <div className="mt-1">
                                        <LeadStatusBadge status={lead.status} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">来源渠道</label>
                                    <p className="text-ink-800 mt-1">{lead.source}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">业务标签</label>
                                    <div className="mt-1">
                                        <BusinessTagsList tags={lead.businessTags} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-ink-800 mb-4">归属人员</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-ink-500">销售</label>
                                    <p className="text-ink-800 mt-1">{lead.currentOwner.name}</p>
                                </div>
                                {lead.designer && (
                                    <div>
                                        <label className="text-sm text-ink-500">设计师</label>
                                        <p className="text-ink-800 mt-1">{lead.designer.name}</p>
                                    </div>
                                )}
                                {lead.shoppingGuide && (
                                    <div>
                                        <label className="text-sm text-ink-500">导购</label>
                                        <p className="text-ink-800 mt-1">{lead.shoppingGuide.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <h3 className="text-lg font-semibold text-ink-800 mb-4">需求信息</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-ink-500">需求类型</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {lead.requirements.map((req, index) => (
                                            <PaperBadge key={index} variant="outline">{req}</PaperBadge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-ink-500">面积</label>
                                    <p className="text-ink-800 mt-1">{lead.areaSize} ㎡</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm text-ink-500">预算范围</label>
                                    <p className="text-ink-800 mt-1">
                                        ¥{lead.budgetMin.toLocaleString()} - ¥{lead.budgetMax.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Appointment */}
                        {lead.appointmentTime && (
                            <div>
                                <h3 className="text-lg font-semibold text-ink-800 mb-4">预约信息</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-ink-500">预约时间</label>
                                        <p className="text-ink-800 mt-1">
                                            {new Date(lead.appointmentTime).toLocaleString('zh-CN')}
                                        </p>
                                    </div>
                                    {lead.appointmentReminder && (
                                        <div>
                                            <label className="text-sm text-ink-500">提醒状态</label>
                                            <p className="text-orange-600 mt-1">{lead.appointmentReminder}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-4 border-t border-paper-300">
                            <PaperButton variant="primary">
                                <span className="mr-2">📞</span>
                                拨打电话
                            </PaperButton>
                            <PaperButton variant="outline">
                                <span className="mr-2">💬</span>
                                发送消息
                            </PaperButton>
                            <PaperButton variant="outline">
                                <span className="mr-2">📅</span>
                                预约到店
                            </PaperButton>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <LeadTimeline leadId={lead.id} />
                )}

                {activeTab === 'files' && (
                    <div className="text-center py-12 text-ink-400">
                        <p>暂无相关文件</p>
                    </div>
                )}

                {activeTab === 'status-history' && (
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-2 text-ink-500">加载中...</p>
                            </div>
                        ) : statusHistory.length === 0 ? (
                            <div className="text-center py-12 text-ink-400">暂无状态变更记录</div>
                        ) : (
                            <div className="space-y-4">
                                {statusHistory.map((record, index) => (
                                    <div key={record.id || index} className="border border-paper-300 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-primary-50 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {record.from_status ? `从 ${record.from_status} 到 ${record.to_status}` : `初始状态: ${record.to_status}`}
                                                </div>
                                            </div>
                                            <div className="text-sm text-ink-500">
                                                {new Date(record.changed_at).toLocaleString('zh-CN')}
                                            </div>
                                        </div>
                                        <div className="text-sm text-ink-700">
                                            {record.comment || '无备注'}
                                        </div>
                                        {record.changed_by_id && (
                                            <div className="text-xs text-ink-500 mt-1">
                                                操作人: {record.changed_by_id}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="space-y-4">
                        {assignments.length === 0 && (
                            <div className="text-center py-12 text-ink-400">暂无分配记录</div>
                        )}
                        {assignments.map((a) => (
                            <div key={a.id} className="border border-paper-300 rounded p-3">
                                <div className="flex justify-between">
                                    <div className="font-medium">{a.toUser?.name || '未知用户'}</div>
                                    <div className="text-ink-500 text-sm">{new Date(a.createdAt).toLocaleString('zh-CN')}</div>
                                </div>
                                {a.assignmentReason && (
                                    <div className="text-ink-600 text-sm mt-1">{a.assignmentReason}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'quotes' && (
                    <QuoteDetails
                        lead={lead}
                        onGenerateNewQuote={handleGenerateNewQuote}
                        onSetCurrentVersion={handleSetCurrentVersion}
                        onDraftSign={handleDraftSign}
                        onEditQuote={handleEditQuote}
                    />
                )}
            </div>
        </PaperDrawer>
    )
}
