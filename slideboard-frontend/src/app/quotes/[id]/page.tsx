'use client'
import { useParams, useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableBody, PaperTableCell, PaperTableHeader, PaperTableRow } from '@/components/ui/paper-table'
import { ShareModal } from '@/components/ui/share-modal'
import { toast } from '@/components/ui/toast'
import { approvalClientService } from '@/services/approval.client'
import { quoteService } from '@/services/quotes.client'
import { shareService } from '@/services/share.client'
import { Quote, QuoteVersion, QuoteItem } from '@/shared/types/quote'


export default function QuoteDetailPage() {
    const router = useRouter()
    const params = useParams()
    const quoteId = params.id as string

    const [quote, setQuote] = useState<Quote | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('details')
    const [selectedVersion, setSelectedVersion] = useState<QuoteVersion | null>(null)

    const loadQuoteDetail = useCallback(async () => {
        setLoading(true)
        try {
            const quoteData = await quoteService.getQuote(quoteId)

            if (quoteData) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setQuote(quoteData as any)
                // 默认选中最新版本
                if (quoteData.versions && quoteData.versions.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setSelectedVersion(quoteData.versions[quoteData.versions.length - 1] as any)
                }
            }
        } catch {
            // Handle error appropriately
        } finally {
            setLoading(false)
        }
    }, [quoteId])

    useEffect(() => {
        loadQuoteDetail()
    }, [loadQuoteDetail])

    const handleCreateVersion = () => {
        // 跳转到创建新版本页面
        router.push(`/quotes/create?quoteId=${quoteId}&baseVersionId=${selectedVersion?.id}`)
    }

    const handleVersionChange = async (versionId: string, newStatus: string) => {
        try {
            await quoteService.updateVersionStatus(versionId, newStatus)

            // 重新加载数据
            loadQuoteDetail()
        } catch {
            // Handle error appropriately
        }
    }

    const handleExportQuote = async (versionId: string, format: 'excel' | 'pdf') => {
        try {
            const v = quote?.versions.find((v: QuoteVersion) => v.id === versionId) || selectedVersion
            if (!quote || !v) throw new Error('not_found')
            if (format === 'excel') {
                const wb = XLSX.utils.book_new()
                const infoData = [
                    { field: '客户名称', value: quote.customerName },
                    { field: '项目名称', value: quote.projectName },
                    { field: '项目地址', value: quote.projectAddress },
                    { field: '销售人员', value: quote.salespersonName },
                    { field: '报价单号', value: v.quoteNo },
                    { field: '版本', value: v.version },
                    { field: '总价', value: `¥${v.totalAmount}` },
                    { field: '创建时间', value: new Date(v.createdAt).toLocaleString() }
                ]
                const infoSheet = XLSX.utils.json_to_sheet(infoData)
                XLSX.utils.book_append_sheet(wb, infoSheet, '基本信息')
                const itemsData = v.items.map((i: QuoteItem) => ({
                    产品名称: i.name,
                    数量: i.quantity,
                    单价: i.unitPrice,
                    总价: i.totalPrice,
                    规格: i.specification || '',
                    描述: i.description || ''
                }))
                const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
                XLSX.utils.book_append_sheet(wb, itemsSheet, '项目明细')
                const filename = `quote_${v.quoteNo || versionId}.xlsx`
                XLSX.writeFile(wb, filename)
            } else {
                const { jsPDF } = await import('jspdf')
                const autoTable = (await import('jspdf-autotable')).default
                const doc = new jsPDF()
                doc.setFontSize(16)
                doc.text('报价单', 105, 20, { align: 'center' })
                doc.setFontSize(12)
                doc.text(`报价单号: ${v.quoteNo}`, 20, 40)
                doc.text(`客户名称: ${quote.customerName}`, 20, 50)
                doc.text(`项目名称: ${quote.projectName}`, 20, 60)
                doc.text(`项目地址: ${quote.projectAddress}`, 20, 70)
                doc.text(`销售人员: ${quote.salespersonName}`, 20, 80)
                doc.text(`版本: ${v.version}`, 20, 90)
                doc.text(`总价: ¥${v.totalAmount}`, 20, 100)
                const head = [['产品名称', '数量', '单价', '总价', '规格', '描述']]
                const body = v.items.map((i: QuoteItem) => [i.name, String(i.quantity), `¥${i.unitPrice}`, `¥${i.totalPrice}`, i.specification || '', i.description || ''])
                autoTable(doc, { head, body, startY: 110, styles: { fontSize: 10 } })
                const blob = doc.output('blob')
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `quote_${v.quoteNo || versionId}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch {
            toast.error('导出失败，请重试')
        }
    }

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: '草稿',
            preliminary: '初稿',
            revised: '修订版',
            confirmed: '已确认',
            cancelled: '已取消'
        }
        return statusMap[status] || status
    }

    const getStatusBadgeClass = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            preliminary: 'bg-yellow-100 text-yellow-800',
            revised: 'bg-blue-100 text-blue-800',
            confirmed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return statusMap[status] || 'bg-gray-100 text-gray-800'
    }

    const getAvailableStatusTransitions = (currentStatus: string) => {
        const transitions: Record<string, string[]> = {
            draft: ['preliminary', 'cancelled'],
            preliminary: ['revised', 'confirmed', 'cancelled'],
            revised: ['confirmed', 'cancelled'],
            confirmed: ['cancelled'],
            cancelled: []
        }
        return transitions[currentStatus] || []
    }

    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [shareLink, setShareLink] = useState('')

    const handleGenerateShareLink = async () => {
        try {
            const active = await shareService.getActiveToken('quote', quoteId)
            const token = active ? active.token : (await shareService.generateToken('quote', quoteId)).token
            const link = `${window.location.origin}/api/sharing/validate?token=${token}`
            setShareLink(link)
            setIsShareModalOpen(true)
        } catch {
            toast.error('生成分享链接失败')
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 max-w-7xl mx-auto">
                    <div className="text-center py-8">加载中...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (!quote) {
        return (
            <DashboardLayout>
                <div className="p-6 max-w-7xl mx-auto">
                    <div className="text-center py-8">报价单不存在</div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">报价单详情</h1>
                        <p className="text-gray-500 mt-1">报价单号：{selectedVersion?.quoteNo}</p>
                    </div>
                    <div className="flex gap-2">
                        <PaperButton variant="outline" onClick={() => router.back()}>
                            返回列表
                        </PaperButton>
                        <PaperButton variant="primary" onClick={handleCreateVersion}>
                            + 创建新版本
                        </PaperButton>
                    </div>
                </div>

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>报价单基本信息</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">客户名称</div>
                                <div className="font-medium">{quote.customerName}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">项目名称</div>
                                <div className="font-medium">{quote.projectName}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">项目地址</div>
                                <div className="font-medium">{quote.projectAddress}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">销售人员</div>
                                <div className="font-medium">{quote.salespersonName}</div>
                            </div>
                        </div>
                    </PaperCardContent>
                </PaperCard>

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>版本管理</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">版本列表</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {quote.versions.map((version: QuoteVersion) => (
                                    <PaperCard
                                        key={version.id}
                                        className={`cursor-pointer transition-all ${selectedVersion?.id === version.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                                        onClick={() => setSelectedVersion(version)}
                                    >
                                        <PaperCardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium">版本 {version.version}</div>
                                                    <div className="text-sm text-gray-500">{version.quoteNo}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(version.status)}`}>
                                                    {getStatusLabel(version.status)}
                                                </span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="text-sm">总价：¥{version.totalAmount.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    创建时间：{new Date(version.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </PaperCardContent>
                                    </PaperCard>
                                ))}
                            </div>
                        </div>

                        {selectedVersion && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">版本详情 - V{selectedVersion.version}</h3>

                                <div className="border-b border-gray-200 mb-4">
                                    <div className="flex space-x-8">
                                        <button
                                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                            onClick={() => setActiveTab('details')}
                                        >
                                            版本详情
                                        </button>
                                        <button
                                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                            onClick={() => setActiveTab('items')}
                                        >
                                            报价项目
                                        </button>
                                        <button
                                            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'actions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                            onClick={() => setActiveTab('actions')}
                                        >
                                            状态操作
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {activeTab === 'details' && (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">报价单号</div>
                                                <div className="font-medium">{selectedVersion.quoteNo}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">状态</div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedVersion.status)}`}>
                                                    {getStatusLabel(selectedVersion.status)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">总价</div>
                                                <div className="font-medium">¥{selectedVersion.totalAmount.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">创建时间</div>
                                                <div>{new Date(selectedVersion.createdAt).toLocaleString()}</div>
                                            </div>
                                            {selectedVersion.validUntil && (
                                                <div>
                                                    <div className="text-sm text-gray-500 mb-1">有效期至</div>
                                                    <div>{new Date(selectedVersion.validUntil).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                            {selectedVersion.convertedToOrderId && (
                                                <div>
                                                    <div className="text-sm text-gray-500 mb-1">已转化为订单</div>
                                                    <div className="font-medium">订单ID: {selectedVersion.convertedToOrderId}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'items' && (
                                        <PaperTable>
                                            <PaperTableHeader>
                                                <PaperTableRow>
                                                    <PaperTableCell>产品名称</PaperTableCell>
                                                    <PaperTableCell>数量</PaperTableCell>
                                                    <PaperTableCell>单价</PaperTableCell>
                                                    <PaperTableCell>总价</PaperTableCell>
                                                    <PaperTableCell>规格</PaperTableCell>
                                                    <PaperTableCell>描述</PaperTableCell>
                                                </PaperTableRow>
                                            </PaperTableHeader>
                                            <PaperTableBody>
                                                {selectedVersion.items.map((item: QuoteItem) => (
                                                    <PaperTableRow key={item.id}>
                                                        <PaperTableCell>{item.name}</PaperTableCell>
                                                        <PaperTableCell>{item.quantity}</PaperTableCell>
                                                        <PaperTableCell>¥{item.unitPrice.toLocaleString()}</PaperTableCell>
                                                        <PaperTableCell>¥{item.totalPrice.toLocaleString()}</PaperTableCell>
                                                        <PaperTableCell>{item.specification || '-'}</PaperTableCell>
                                                        <PaperTableCell>{item.description || '-'}</PaperTableCell>
                                                    </PaperTableRow>
                                                ))}
                                                <PaperTableRow>
                                                    <PaperTableCell colSpan={3} className="text-right font-bold">总计</PaperTableCell>
                                                    <PaperTableCell className="font-bold">¥{selectedVersion.totalAmount.toLocaleString()}</PaperTableCell>
                                                    <PaperTableCell colSpan={2}>{null}</PaperTableCell>
                                                </PaperTableRow>
                                            </PaperTableBody>
                                        </PaperTable>
                                    )}

                                    {activeTab === 'actions' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-md font-semibold mb-2">状态流转</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {getAvailableStatusTransitions(selectedVersion.status).map((newStatus) => (
                                                        <PaperButton
                                                            key={newStatus}
                                                            variant="primary"
                                                            onClick={() => handleVersionChange(selectedVersion.id, newStatus)}
                                                        >
                                                            转为 {getStatusLabel(newStatus)}
                                                        </PaperButton>
                                                    ))}
                                                    {getAvailableStatusTransitions(selectedVersion.status).length === 0 && (
                                                        <div className="text-gray-500">当前状态无可用流转</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-md font-semibold mb-2">导出操作</h4>
                                                <div className="flex gap-2">
                                                    <PaperButton variant="outline" onClick={() => handleExportQuote(selectedVersion.id, 'excel')}>
                                                        导出为Excel
                                                    </PaperButton>
                                                    <PaperButton variant="outline" onClick={() => handleExportQuote(selectedVersion.id, 'pdf')}>
                                                        导出为PDF
                                                    </PaperButton>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-md font-semibold mb-2">分享</h4>
                                                <div className="flex gap-2">
                                                    <PaperButton variant="outline" onClick={handleGenerateShareLink}>
                                                        生成分享链接
                                                    </PaperButton>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-md font-semibold mb-2">审批</h4>
                                                <div className="flex gap-2">
                                                    <PaperButton variant="outline" onClick={async () => {
                                                        try {
                                                            const { data: flows } = await approvalClientService.getFlows()
                                                            if (!flows || flows.length === 0) {
                                                                toast.error('未找到可用的审批流')
                                                                return
                                                            }
                                                            // Use the first flow for now
                                                            const flowId = flows[0].id

                                                            await approvalClientService.createRequest({
                                                                flowId,
                                                                requesterId: '', // handled by backend
                                                                entityType: 'quote',
                                                                entityId: selectedVersion.id
                                                            })
                                                            toast.success('已提交审批')
                                                        } catch {
                                                            toast.error('提交审批失败')
                                                        }
                                                    }}>
                                                        提交审批
                                                    </PaperButton>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </PaperCardContent>
                </PaperCard>
            </div>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareLink={shareLink}
                title="分享报价单"
            />
        </DashboardLayout>
    )
}
