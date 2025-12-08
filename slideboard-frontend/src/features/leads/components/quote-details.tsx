'use client'

import React, { useState, useEffect, useCallback } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table'
import { quoteService, Quote } from '@/services/quotes.client'
import { LeadItem } from '@/types/lead'

interface QuoteDetailsProps {
  lead: LeadItem
  onGenerateNewQuote: (fromVersion?: number) => void
  onSetCurrentVersion: (version: number) => void
  onDraftSign: () => void
  onEditQuote: (quoteId: string) => void
}

export default function QuoteDetails({ lead, onGenerateNewQuote, onSetCurrentVersion, onDraftSign, onEditQuote }: QuoteDetailsProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined)

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await quoteService.getQuotesByLead(lead.id)
      setQuotes(data)
      if (data.length > 0 && data[0]) {
        setSelectedQuoteId(data[0].id)
        const quoteVersions = data[0].versions || []
        const latestVersion = [...quoteVersions].sort((a, b) => b.version - a.version)[0]
        if (latestVersion) {
          setSelectedVersion(latestVersion.version)
        }
      }
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  const activeQuote = quotes.find(q => q.id === selectedQuoteId)
  const versions = activeQuote?.versions ? [...activeQuote.versions].sort((a, b) => b.version - a.version) : []
  const selectedVersionData = versions.find(v => v.version === selectedVersion)

  if (loading) {
    return <div className="p-6 text-center">加载中...</div>
  }

  if (quotes.length === 0) {
    return (
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>报价详情</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="text-center py-6 text-ink-500">
            暂无报价记录
            <div className="mt-4">
              <PaperButton variant="primary" onClick={() => onGenerateNewQuote()}>
                生成报价
              </PaperButton>
            </div>
          </div>
        </PaperCardContent>
      </PaperCard>
    )
  }

  return (
    <PaperCard>
      <PaperCardHeader>
        <PaperCardTitle>报价详情</PaperCardTitle>
      </PaperCardHeader>
      <PaperCardContent>
        <div className="space-y-6">
          {/* 报价单选择 (如果有多个) */}
          {quotes.length > 1 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-ink-700 mb-2">选择报价单</h3>
              <div className="flex gap-2">
                {quotes.map(q => (
                  <PaperButton
                    key={q.id}
                    variant={q.id === selectedQuoteId ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelectedQuoteId(q.id)
                      const latest = q.versions?.sort((a, b) => b.version - a.version)[0]
                      if (latest) setSelectedVersion(latest.version)
                    }}
                  >
                    {q.projectName}
                  </PaperButton>
                ))}
              </div>
            </div>
          )}

          {/* 报价版本选择 */}
          <div>
            <h3 className="text-sm font-medium text-ink-700 mb-2">报价版本</h3>
            <div className="flex flex-wrap gap-2">
              {versions.map(version => (
                <PaperButton
                  key={version.version}
                  variant={version.version === selectedVersion ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedVersion(version.version)}
                >
                  版本 {version.version} ({new Date(version.createdAt).toLocaleDateString()})
                </PaperButton>
              ))}
              <PaperButton
                variant="outline"
                size="sm"
                onClick={() => onGenerateNewQuote(selectedVersion)}
              >
                从当前版本生成新报价
              </PaperButton>
            </div>
          </div>

          {/* 版本操作 */}
          <div className="flex gap-2">
            {/* Edit Button for Draft */}
            {selectedVersionData?.status === 'draft' && (
                <PaperButton
                  variant="outline"
                  size="sm"
                  onClick={() => selectedQuoteId && onEditQuote(selectedQuoteId)}
                >
                  编辑报价
                </PaperButton>
            )}

            {/* Show set current version button if needed, for now just confirm */}
            {selectedVersionData?.status === 'draft' && (
              <>
                <PaperButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onSetCurrentVersion(selectedVersion!)}
                >
                  设置为当前版本
                </PaperButton>
                <PaperButton variant="success" size="sm" onClick={onDraftSign}>
                  确认报价
                </PaperButton>
              </>
            )}
          </div>

          {/* 报价内容 */}
          {selectedVersionData && (
            <div>
              <h3 className="text-sm font-medium text-ink-700 mb-2">
                版本 {selectedVersionData.version} 详情
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-ink-500">创建时间</p>
                  <p className="font-medium">{new Date(selectedVersionData.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">状态</p>
                  <p className="font-medium">
                    {selectedVersionData.status === 'confirmed' ? '已确认' :
                      selectedVersionData.status === 'draft' ? '草稿' :
                        selectedVersionData.status === 'published' ? '已发布' : '已归档'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">总金额</p>
                  <p className="font-medium text-primary-600">¥{selectedVersionData.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* 报价项目 */}
              <PaperTable>
                <PaperTableHeader>
                  <PaperTableCell>项目名称</PaperTableCell>
                  <PaperTableCell>数量</PaperTableCell>
                  <PaperTableCell>单价</PaperTableCell>
                  <PaperTableCell>总价</PaperTableCell>
                </PaperTableHeader>
                <PaperTableBody>
                  {selectedVersionData.items?.map((item, index) => (
                    <PaperTableRow key={index}>
                      <PaperTableCell>{item.productName}</PaperTableCell>
                      <PaperTableCell>{item.quantity}</PaperTableCell>
                      <PaperTableCell>¥{item.unitPrice.toLocaleString()}</PaperTableCell>
                      <PaperTableCell>¥{item.totalPrice.toLocaleString()}</PaperTableCell>
                    </PaperTableRow>
                  ))}
                  <PaperTableRow className="font-medium">
                    <PaperTableCell colSpan={3} className="text-right">合计</PaperTableCell>
                    <PaperTableCell>¥{selectedVersionData.totalAmount.toLocaleString()}</PaperTableCell>
                  </PaperTableRow>
                </PaperTableBody>
              </PaperTable>
            </div>
          )}
        </div>
      </PaperCardContent>
    </PaperCard>
  )
}
