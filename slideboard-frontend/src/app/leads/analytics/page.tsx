'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { PaperProgress } from '@/components/ui/paper-badge'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav'
import { leadService } from '@/services/leads.client'

export default function LeadsAnalyticsPage() {
  const pathname = usePathname()
  const [warnings, setWarnings] = useState({ followUpStale: 0, quotedNoDraft: 0 })
  const [funnel, setFunnel] = useState({ total: 0, quoted: 0, visited: 0, drafted: 0 })

  useEffect(() => {
    let mounted = true
      ; (async () => {
        const w = await leadService.getLeadWarnings()
        if (mounted) setWarnings(w)
        const res = await leadService.getLeads(1, 1000, {})
        const total = res.data.length
        let quoted = 0
        let visited = 0
        let drafted = 0
        for (const l of res.data) {
          if ((l.businessTags || []).includes('quoted')) quoted++
          if ((l.businessTags || []).includes('arrived')) visited++
          if (l.status === 'DRAFT_SIGNED') drafted++
        }
        if (mounted) setFunnel({ total, quoted, visited, drafted })
      })()
    return () => { mounted = false }
  }, [])

  const leadsToQuotedRate = funnel.total ? Math.round((funnel.quoted / funnel.total) * 100) : 0
  const quotedToVisitedRate = funnel.quoted ? Math.round((funnel.visited / funnel.quoted) * 100) : 0
  const visitedToSignedRate = funnel.visited ? Math.round((funnel.drafted / funnel.visited) * 100) : 0

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">转化分析</h1>
          <p className="text-ink-500 mt-1">漏斗与来源分析、停滞与超时预警</p>
        </div>

        <PaperCard>
          <PaperCardContent>
            <PaperNav vertical={false}>
              <PaperNavItem href="/leads" active={pathname === '/leads'}>列表视图</PaperNavItem>
              <PaperNavItem href="/leads/kanban" active={pathname === '/leads/kanban'}>看板视图</PaperNavItem>
              <PaperNavItem href="/leads/analytics" active={pathname === '/leads/analytics'}>转化分析</PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>转化漏斗</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-ink-600 mb-1">线索总数 → 已报价</div>
                  <PaperProgress value={leadsToQuotedRate} max={100} showLabel />
                </div>
                <div>
                  <div className="text-sm text-ink-600 mb-1">已报价 → 已到店</div>
                  <PaperProgress value={quotedToVisitedRate} max={100} color="info" showLabel />
                </div>
                <div>
                  <div className="text-sm text-ink-600 mb-1">已到店 → 成交（草签）</div>
                  <PaperProgress value={visitedToSignedRate} max={100} color="success" showLabel />
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>

          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>来源分析</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-700">门店到店</span>
                  <span className="text-ink-600">42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-700">渠道转介</span>
                  <span className="text-ink-600">36%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-700">线上咨询</span>
                  <span className="text-ink-600">22%</span>
                </div>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>停滞与超时预警</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-ink-700">跟踪超3天未更新</span>
                <span className="text-error-600">{warnings.followUpStale}条</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-700">报价后超7天未草签</span>
                <span className="text-error-600">{warnings.quotedNoDraft}条</span>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  )
}
