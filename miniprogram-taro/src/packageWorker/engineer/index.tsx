/**
 * 工程师收益结算页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface EarningItem { id: string; taskNo: string; type: string; amount: number; date: string; status: string }

export default function EngineerPage() {
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [items, setItems] = useState<EarningItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/worker/earnings')
      if (res.success) {
        setTotal(res.data.totalEarnings || 0)
        setPending(res.data.pendingAmount || 0)
        setItems(res.data.items || [])
      }
    } finally { setLoading(false) }
  }

  useDidShow(() => { fetchData() })

  return (
    <View className='engineer-page'>
      <View className='earnings-header'>
        <View className='earnings-card card'>
          <Text className='earnings-label'>累计收益</Text>
          <Text className='earnings-value'>¥{total.toLocaleString()}</Text>
        </View>
        <View className='earnings-card card'>
          <Text className='earnings-label'>待结算</Text>
          <Text className='earnings-value pending'>¥{pending.toLocaleString()}</Text>
        </View>
      </View>
      <Text className='section-title'>收益明细</Text>
      <ScrollView className='earnings-list' scrollY enhanced showScrollbar={false}>
        {items.map((item) => (
          <View key={item.id} className='earning-item card'>
            <View className='flex-between'>
              <Text className='task-no'>{item.taskNo}</Text>
              <Text className='earning-amount'>+¥{item.amount}</Text>
            </View>
            <View className='flex-between'>
              <Text className='earning-type'>{item.type}</Text>
              <Text className='earning-date'>{item.date}</Text>
            </View>
          </View>
        ))}
        {items.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-text'>暂无收益记录</Text></View>
        )}
      </ScrollView>
    </View>
  )
}
