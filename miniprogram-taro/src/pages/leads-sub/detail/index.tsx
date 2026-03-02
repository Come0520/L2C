/**
 * 线索详情 + 跟进记录
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface Activity { id: string; content: string; createdAt: string; type: string }
interface LeadDetail { id: string; customerName: string; phone: string; source: string; status: string; statusText: string; address: string; remark: string; assigneeName: string; createdAt: string; activities: Activity[] }

export default function LeadDetailPage() {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [leadId, setLeadId] = useState('')

  useLoad(async (params) => {
    const { id } = params
    setLeadId(id)
    try {
      const res = await api.get(`/crm/customers/${id}`)
      if (res.success) setLead(res.data)
    } finally {
      setLoading(false)
    }
  })

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!lead) return <View className='page flex-center'><Text>线索不存在</Text></View>

  return (
    <View className='lead-detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        <View className='info-card card'>
          <Text className='lead-name'>{lead.customerName}</Text>
          <Text className='lead-phone'>{lead.phone}</Text>
          <View className='info-row'><Text className='info-label'>状态</Text><Text className='info-value status'>{lead.statusText}</Text></View>
          <View className='info-row'><Text className='info-label'>来源</Text><Text className='info-value'>{lead.source}</Text></View>
          {lead.address && <View className='info-row'><Text className='info-label'>地址</Text><Text className='info-value'>{lead.address}</Text></View>}
          {lead.assigneeName && <View className='info-row'><Text className='info-label'>负责人</Text><Text className='info-value'>{lead.assigneeName}</Text></View>}
        </View>

        <View className='activities-section'>
          <View className='section-header flex-between'>
            <Text className='section-title'>跟进记录</Text>
            <View className='btn-add-activity' onClick={() => Taro.navigateTo({ url: `/pages/crm/followup/index?id=${leadId}` })}>
              <Text>+ 添加跟进</Text>
            </View>
          </View>
          {lead.activities?.map((a) => (
            <View key={a.id} className='activity-item card'>
              <View className='flex-between'>
                <Text className='activity-type'>{a.type}</Text>
                <Text className='activity-date'>{a.createdAt}</Text>
              </View>
              <Text className='activity-content'>{a.content}</Text>
            </View>
          ))}
          {(!lead.activities || lead.activities.length === 0) && (
            <View className='empty flex-center'><Text className='empty-text'>暂无跟进记录</Text></View>
          )}
        </View>

        {/* 快捷操作 */}
        <View className='quick-ops'>
          <View className='op-btn' onClick={() => Taro.navigateTo({ url: `/pages/quotes/create/index?customerId=${leadId}` })}>
            <Text>创建报价</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
