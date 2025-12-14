import { useQuery } from '@tanstack/react-query'
import React from 'react'

import { leadService } from '@/services/leads.client'
import { Lead } from '@/shared/types/lead'

interface LeadStatsCardsProps {
  useServerData: boolean
  filteredLeads: Lead[]
}

export const LeadStatsCards: React.FC<LeadStatsCardsProps> = ({ useServerData, filteredLeads }) => {
  // Fetch real stats if useServerData is true
  const { data: serverStats, isLoading } = useQuery({
    queryKey: ['leadStats'],
    queryFn: () => leadService.getLeadStats(),
    enabled: useServerData,
    staleTime: 60000, // 1 minute
  });

  const getCount = (status: string) => {
    if (useServerData) {
      if (isLoading || !serverStats) return '-';
      return serverStats[status] || 0;
    } else {
      // Fallback to client-side filtering (current page only)
      return filteredLeads.filter(lead => lead.status === status).length;
    }
  }

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="p-6">
        <h3 className="font-medium text-ink-800 mb-4">线索状态统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">待分配</div>
            <div className="text-2xl font-bold text-blue-800">{getCount('PENDING_ASSIGNMENT')}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-600">待跟踪</div>
            <div className="text-2xl font-bold text-yellow-800">{getCount('PENDING_FOLLOW_UP')}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600">跟踪中</div>
            <div className="text-2xl font-bold text-green-800">{getCount('FOLLOWING_UP')}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-600">草签</div>
            <div className="text-2xl font-bold text-purple-800">{getCount('DRAFT_SIGNED')}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-600">待测量</div>
            <div className="text-2xl font-bold text-orange-800">{getCount('PENDING_MEASUREMENT')}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="text-sm text-indigo-600">方案待确认</div>
            <div className="text-2xl font-bold text-indigo-800">{getCount('PLAN_PENDING_CONFIRMATION')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
