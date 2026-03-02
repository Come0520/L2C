/**
 * CRM 客户详情页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface CustomerDetail {
  id: string; name: string; phone: string; source: string; stage: string; stageText: string
  address: string; assigneeName: string; createdAt: string
  activities: Array<{ id: string; content: string; createdAt: string; type: string }>
  quotes: Array<{ id: string; quoteNo: string; totalAmount: number; statusText: string }>
}

export default function CrmDetailPage() {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState('')

  useLoad(async (params) => {
    const { id } = params
    setCustomerId(id)
    try {
      const res = await api.get(`/crm/customers/${id}`)
      if (res.success) setCustomer(res.data)
    } finally {
      setLoading(false)
    }
  })

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!customer) return <View className='page flex-center'><Text>客户不存在</Text></View>

  return (
    <View className='crm-detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        {/* 基本信息 */}
        <View className='info-card card'>
          <Text className='customer-name'>{customer.name}</Text>
          <Text className='customer-phone'>{customer.phone}</Text>
          <View className='info-row'><Text className='info-label'>阶段</Text><Text className='info-value stage'>{customer.stageText}</Text></View>
          {customer.address && <View className='info-row'><Text className='info-label'>地址</Text><Text className='info-value'>{customer.address}</Text></View>}
          {customer.assigneeName && <View className='info-row'><Text className='info-label'>负责人</Text><Text className='info-value'>{customer.assigneeName}</Text></View>}
        </View>

        {/* 报价列表 */}
        {customer.quotes?.length > 0 && (
          <View className='quotes-section'>
            <Text className='section-title'>报价单</Text>
            {customer.quotes.map((q) => (
              <View key={q.id} className='quote-mini-card card'
                onClick={() => Taro.navigateTo({ url: `/pages/quotes/detail/index?id=${q.id}` })}>
                <View className='flex-between'>
                  <Text>{q.quoteNo}</Text>
                  <Text style={{ color: '#E6B450' }}>{q.statusText}</Text>
                </View>
                <Text style={{ color: '#E6B450', fontWeight: '700' }}>¥{q.totalAmount?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 跟进记录 */}
        <View className='activities-section'>
          <View className='section-header flex-between'>
            <Text className='section-title'>跟进记录</Text>
            <View className='btn-add-activity'
              onClick={() => Taro.navigateTo({ url: `/pages/crm/followup/index?id=${customerId}` })}>
              <Text>+ 添加</Text>
            </View>
          </View>
          {customer.activities?.map((a) => (
            <View key={a.id} className='activity-item card'>
              <View className='flex-between'>
                <Text className='activity-type'>{a.type}</Text>
                <Text className='activity-date'>{a.createdAt}</Text>
              </View>
              <Text className='activity-content'>{a.content}</Text>
            </View>
          ))}
        </View>

        {/* 快捷操作 */}
        <View className='quick-ops'>
          <View className='op-btn' onClick={() => Taro.navigateTo({ url: `/pages/quotes/create/index?customerId=${customerId}` })}>
            <Text>创建报价</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
