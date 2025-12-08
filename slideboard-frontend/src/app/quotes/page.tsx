'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableBody, PaperTableCell, PaperTableHeader, PaperTableRow } from '@/components/ui/paper-table'
import { quoteService } from '@/services/quotes.client'
import { Quote } from '@/shared/types/quote'

export default function QuotesPage() {
    const router = useRouter()
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('')

    useEffect(() => {
        const loadQuotes = async () => {
            setLoading(true)
            try {
                const data = await quoteService.getQuotes({
                    status: statusFilter || undefined
                })

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setQuotes(data as any)
            } catch {
                // Handle error appropriately
            } finally {
                setLoading(false)
            }
        }

        loadQuotes()
    }, [statusFilter])

    const handleCreateQuote = () => {
        router.push('/quotes/create')
    }

    const handleQuoteClick = (quoteId: string) => {
        router.push(`/quotes/${quoteId}`)
    }

    const statusOptions = [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'preliminary', label: '初稿' },
        { value: 'revised', label: '修订版' },
        { value: 'confirmed', label: '已确认' },
        { value: 'cancelled', label: '已取消' }
    ]

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">报价单管理</h1>
                        <p className="text-gray-500 mt-1">管理所有报价单及其版本</p>
                    </div>
                    <PaperButton variant="primary" onClick={handleCreateQuote}>
                        + 新建报价单
                    </PaperButton>
                </div>

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>报价单列表</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-4 items-center">
                                <div>
                                    <label className="text-sm mr-2">状态筛选：</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">加载中...</div>
                        ) : (
                            <PaperTable>
                                <PaperTableHeader>
                                    <PaperTableRow>
                                        <PaperTableCell>报价单号</PaperTableCell>
                                        <PaperTableCell>客户名称</PaperTableCell>
                                        <PaperTableCell>项目名称</PaperTableCell>
                                        <PaperTableCell>当前版本</PaperTableCell>
                                        <PaperTableCell>最新状态</PaperTableCell>
                                        <PaperTableCell>创建时间</PaperTableCell>
                                        <PaperTableCell>操作</PaperTableCell>
                                    </PaperTableRow>
                                </PaperTableHeader>
                                <PaperTableBody>
                                    {quotes.map((quote) => {
                                        const latestVersion = quote.versions && quote.versions.length > 0
                                            ? quote.versions[quote.versions.length - 1]
                                            : null

                                        if (!latestVersion) return null

                                        return (
                                            <PaperTableRow key={quote.id} onClick={() => handleQuoteClick(quote.id)} className="cursor-pointer hover:bg-gray-50">
                                                <PaperTableCell>{latestVersion.quoteNo}</PaperTableCell>
                                                <PaperTableCell>{quote.customerName}</PaperTableCell>
                                                <PaperTableCell>{quote.projectName}</PaperTableCell>
                                                <PaperTableCell>V{latestVersion.version}</PaperTableCell>
                                                <PaperTableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(latestVersion.status)}`}>
                                                        {getStatusLabel(latestVersion.status)}
                                                    </span>
                                                </PaperTableCell>
                                                <PaperTableCell>{new Date(quote.createdAt).toLocaleDateString()}</PaperTableCell>
                                                <PaperTableCell>
                                                    <PaperButton variant="outline" size="sm" onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleQuoteClick(quote.id)
                                                    }}>
                                                        查看详情
                                                    </PaperButton>
                                                </PaperTableCell>
                                            </PaperTableRow>
                                        )
                                    })}
                                </PaperTableBody>
                            </PaperTable>
                        )}
                    </PaperCardContent>
                </PaperCard>
            </div>
        </DashboardLayout>
    )
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
