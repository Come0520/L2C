/**
 * 线索详情 + 跟进记录
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { leadService } from '@/services/lead-service'
import type { Lead } from '@/types/business'
import './index.scss'

interface Activity { id: string; content: string; createdAt: string; type: string }

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [leadId, setLeadId] = useState('')

  useLoad(async (params) => {
    const { id } = params
    setLeadId(id)
    try {
      const [leadRes, activitiesRes] = await Promise.all([
        leadService.getLeadDetail(id),
        leadService.getLeadFollowUps(id)
      ])
      if (leadRes) setLead(leadRes)
      if (activitiesRes) setActivities(activitiesRes)
    } catch (error) {
      console.error('Failed to fetch lead detail:', error)
    } finally {
      setLoading(false)
    }
  })

  // 状态文本转换 Helper
  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'PENDING_FOLLOWUP': '待跟进',
      'FOLLOWING': '跟进中',
      'QUOTED': '已报价',
      'LOST': '已流失',
      'CONVERTED': '已转化'
    }
    return map[status] || status
  }

  if (loading) return <View className='page flex-center'><View className="loading">加载中...</View></View>
  if (!lead) return <View className='page flex-center'><Text>线索不存在</Text></View>

  return (
    <View className='lead-detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        <View className='info-card card'>
          <Text className='lead-name'>{lead.customerName}</Text>
          <Text className='lead-phone'>{lead.customerPhone}</Text>
          <View className='info-row'><Text className='info-label'>状态</Text><Text className='info-value status'>{getStatusText(lead.status)}</Text></View>
          <View className='info-row'><Text className='info-label'>意向</Text><Text className='info-value'>{lead.intentionLevel === 'HIGH' ? '高意向' : lead.intentionLevel === 'MEDIUM' ? '中意向' : '低意向'}</Text></View>
          <View className='info-row'><Text className='info-label'>来源</Text><Text className='info-value'>{lead.sourceChannel?.name || '未知来源'}</Text></View>
          {lead.address && <View className='info-row'><Text className='info-label'>地址</Text><Text className='info-value'>{lead.address}</Text></View>}
          {lead.community && <View className='info-row'><Text className='info-label'>小区</Text><Text className='info-value'>{lead.community} {lead.houseType || ''}</Text></View>}
          {lead.assignedSales?.name && <View className='info-row'><Text className='info-label'>负责人</Text><Text className='info-value'>{lead.assignedSales.name}</Text></View>}
        </View>

        <View className='activities-section'>
          <View className='section-header flex-between'>
            <Text className='section-title'>跟进记录</Text>
            <View className='btn-add-activity' onClick={() => Taro.navigateTo({ url: `/packageSales/quick-follow-up/index?id=${leadId}` })}>
              <Text>+ 快速跟进</Text>
            </View>
          </View>
          {activities?.map((a) => (
            <View key={a.id} className='activity-item card'>
              <View className='flex-between'>
                <Text className='activity-type'>{a.type}</Text>
                <Text className='activity-date'>{new Date(a.createdAt).toLocaleString()}</Text>
              </View>
              <Text className='activity-content'>{a.content}</Text>
            </View>
          ))}
          {(!activities || activities.length === 0) && (
            <View className='empty flex-center'><Text className='empty-text'>暂无跟进记录</Text></View>
          )}
        </View>

        {/* 底部操作区 */}
        <View className="bottom-bar">
          <View className="btn btn-outline" onClick={() => Taro.navigateTo({ url: `/packageSales/lead-actions/index?id=${leadId}` })}>管理</View>
          <View className="btn btn-outline" onClick={() => Taro.navigateTo({ url: `/packageCustomer/quote-view/index?customerId=${leadId}` })}>报价</View>
          <View className="btn btn-primary" onClick={() => Taro.navigateTo({ url: `/packageSales/quick-follow-up/index?id=${leadId}` })}>写跟进</View>
          <View className="safe-bottom-space"></View>
        </View>
      </ScrollView>
    </View>
  )
}
