/**
 * 服务工单列表页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface ServiceItem { id: string; orderNo: string; description: string; status: string; statusText: string; createdAt: string }

export default function ServiceListPage() {
  const [list, setList] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/service/list')
      if (res.success) setList(res.data.items || [])
    } finally { setLoading(false) }
  }

  useDidShow(() => { fetchData() })

  return (
    <View className='list-page'>
      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {list.map((item) => (
          <View key={item.id} className='service-card card'>
            <View className='flex-between'>
              <Text className='service-no'>{item.orderNo || '无关联订单'}</Text>
              <Text className='service-status'>{item.statusText}</Text>
            </View>
            <Text className='service-desc'>{item.description}</Text>
            <Text className='service-date'>{item.createdAt}</Text>
          </View>
        ))}
        {list.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-text'>暂无工单</Text></View>
        )}
      </ScrollView>
      <View className='fab' onClick={() => Taro.navigateTo({ url: '/pages/service/apply/index' })}>
        <Text>+</Text>
      </View>
    </View>
  )
}
