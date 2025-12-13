'use client'

import { useRouter } from 'next/navigation'
import { Quote } from '../types'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperTable, PaperTableBody, PaperTableCell, PaperTableHeader, PaperTableRow, PaperTableToolbar } from '@/components/ui/paper-table'
import { ExportMenu } from '@/components/ui/export-menu'
import { useExport } from '@/hooks/useExport'

interface QuoteListTableProps {
    quotes: Quote[]
}

export function QuoteListTable({ quotes }: QuoteListTableProps) {
    const router = useRouter()

    const handleQuoteClick = (quoteId: string) => {
        router.push(`/quotes/${quoteId}`)
    }

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: '草稿',
            active: '生效中',
            won: '已赢单',
            lost: '已输单',
            expired: '已过期',
            presented: '已发布',
            rejected: '已拒绝',
            accepted: '已接受'
        }
        return statusMap[status] || status
    }

    const getStatusBadgeClass = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            active: 'bg-blue-100 text-blue-800',
            won: 'bg-green-100 text-green-800',
            lost: 'bg-red-100 text-red-800',
            expired: 'bg-yellow-100 text-yellow-800',
        }
        return statusMap[status] || 'bg-gray-100 text-gray-800'
    }

    // 导出功能
    const { handleExport } = useExport<Quote>({
        filename: '报价单列表',
        columns: [
            { header: '报价单号', dataKey: 'quoteNo' },
            { header: '客户ID', dataKey: 'customerId' },
            { header: '项目名称', dataKey: 'projectName' },
            { header: '状态', dataKey: 'status' },
            { header: '创建时间', dataKey: 'createdAt', formatter: (val) => new Date(val).toLocaleDateString() },
        ]
    })

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <ExportMenu onExport={(format) => handleExport(quotes, format)} />
            </div>
            <PaperTable>
            <PaperTableHeader>
                <PaperTableRow>
                    <PaperTableCell>报价单号</PaperTableCell>
                    <PaperTableCell>客户名称</PaperTableCell>
                    <PaperTableCell>项目名称</PaperTableCell>
                    <PaperTableCell>当前版本</PaperTableCell>
                    <PaperTableCell>状态</PaperTableCell>
                    <PaperTableCell>创建时间</PaperTableCell>
                    <PaperTableCell>操作</PaperTableCell>
                </PaperTableRow>
            </PaperTableHeader>
            <PaperTableBody>
                {quotes.map((quote) => {
                    const versionNo = quote.currentVersion?.versionNumber
                    const versionSuffix = quote.currentVersion?.versionSuffix

                    return (
                        <PaperTableRow key={quote.id} onClick={() => handleQuoteClick(quote.id)} className="cursor-pointer hover:bg-gray-50">
                            <PaperTableCell>{quote.quoteNo}</PaperTableCell>
                            {/* Note: customer_id is available, but customer name needs join or separate fetch if not joined. 
                  My SQL didn't join customer name. For now showing ID or placeholder if name missing.
                  Wait, old code had customerName property which was likely joined. 
                  My schema assumes customer table. 
                  I should probably join customer in getQuotes later. 
                  For now I'll just show 'N/A' or Customer ID if needed.
              */}
                            <PaperTableCell>{quote.customerId || '-'}</PaperTableCell>
                            <PaperTableCell>{quote.projectName}</PaperTableCell>
                            <PaperTableCell>{versionSuffix || (versionNo ? `V${versionNo}` : '-')}</PaperTableCell>
                            <PaperTableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(quote.status)}`}>
                                    {getStatusLabel(quote.status)}
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
        </div>
    )
}
