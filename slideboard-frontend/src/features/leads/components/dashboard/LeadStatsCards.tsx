import React from 'react'

import { Lead } from '@/shared/types/lead'

interface LeadStatsCardsProps {
  useServerData: boolean
  filteredLeads: Lead[]
}

export const LeadStatsCards: React.FC<LeadStatsCardsProps> = ({ useServerData, filteredLeads }) => {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="p-6">
        <h3 className="font-medium text-ink-800 mb-4">线索状态统计</h3>
        {useServerData ? (
          <div className="text-center py-8 text-ink-500">
            注：使用服务端数据时，统计功能仅显示当前页数据。
            <br />
            完整统计功能将在后续版本中实现。
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-600">待分配</div>
              <div className="text-2xl font-bold text-blue-800">{filteredLeads.filter(lead => lead.status === 'PENDING_ASSIGNMENT').length}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-600">待跟踪</div>
              <div className="text-2xl font-bold text-yellow-800">{filteredLeads.filter(lead => lead.status === 'PENDING_FOLLOW_UP').length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-600">跟踪中</div>
              <div className="text-2xl font-bold text-green-800">{filteredLeads.filter(lead => lead.status === 'FOLLOWING_UP').length}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-sm text-purple-600">草签</div>
              <div className="text-2xl font-bold text-purple-800">{filteredLeads.filter(lead => lead.status === 'DRAFT_SIGNED').length}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-sm text-orange-600">待测量</div>
              <div className="text-2xl font-bold text-orange-800">{filteredLeads.filter(lead => lead.status === 'PENDING_MEASUREMENT').length}</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="text-sm text-indigo-600">方案待确认</div>
              <div className="text-2xl font-bold text-indigo-800">{filteredLeads.filter(lead => lead.status === 'PLAN_PENDING_CONFIRMATION').length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
