'use client';

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import { PaperProgress } from '@/components/ui/paper-badge'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav'
import { leadService } from '@/services/leads.client'
import type { LeadWarnings } from '@/shared/types/lead'

function WarningItem({ label, count, icon, severity = 'normal', onClick }: { label: string, count: number, icon: string, severity?: 'normal' | 'high', onClick?: () => void }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${severity === 'high' ? 'bg-error-50 border-error-200' : 'bg-paper-50 border-paper-200'} cursor-pointer hover:shadow-sm transition-all`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className={`text-sm font-medium ${severity === 'high' ? 'text-error-900' : 'text-ink-700'}`}>{label}</span>
      </div>
      <div className={`text-lg font-bold ${severity === 'high' ? 'text-error-600' : 'text-ink-900'}`}>
        {count}
      </div>
    </div>
  )
}

export default function LeadsAnalyticsPage() {
  const [warnings, setWarnings] = useState<LeadWarnings>({
    followUpStale: 0,
    quotedNoDraft: 0,
    measurementOverdue: 0,
    noFollowUp7Days: 0,
    highIntentStale: 0,
    budgetExceeded: 0,
    churnRisk: 0,
    competitorThreat: 0,
    total: 0,
    generated_at: ''
  })
  const [funnel, setFunnel] = useState({ total: 0, quoted: 0, visited: 0, drafted: 0 })

  useEffect(() => {
    let mounted = true
      ; (async () => {
        // 获取预警数据
        const w = await leadService.getLeadWarnings()
        if (mounted) setWarnings(w)

        // 获取线索数据用于漏斗分析
        const res = await leadService.getLeads(1, 1000, {})
        // ... existing funnel logic ...
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
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PaperCard>
            {/* ... Funnel Card Content ... */}
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
            <div className="flex items-center justify-between">
              <PaperCardTitle>停滞与超时预警</PaperCardTitle>
              <span className="px-2 py-1 bg-error-50 text-error-600 text-xs font-bold rounded-full">
                {warnings.total} 条需关注
              </span>
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <WarningItem
                label="跟踪超时"
                count={warnings.followUpStale}
                icon="⏰"
              />
              <WarningItem
                label="报价未草签"
                count={warnings.quotedNoDraft}
                icon="📄"
              />
              <WarningItem
                label="测量超期"
                count={warnings.measurementOverdue}
                icon="📏"
              />
              <WarningItem
                label="新线索未跟进"
                count={warnings.noFollowUp7Days}
                icon="🆕"
              />
              <WarningItem
                label="高意向流失"
                count={warnings.highIntentStale}
                icon="🔥"
                severity="high"
              />
              <WarningItem
                label="预算超标"
                count={warnings.budgetExceeded}
                icon="💰"
              />
              <WarningItem
                label="流失风险"
                count={warnings.churnRisk}
                icon="⚠️"
                severity="high"
              />
              <WarningItem
                label="竞品威胁"
                count={warnings.competitorThreat}
                icon="⚔️"
              />
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
  )
}
