/**
 * 销售目标管理页（Manager 专属）
 */
import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface SalesTarget { id: string; salesName: string; target: number; achieved: number; rate: number }

export default function TargetsPage() {
  const [targets, setTargets] = useState<SalesTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter'>('month')

  const fetchData = async (p = period) => {
    setLoading(true)
    try {
      const res = await api.get('/manager/targets', { data: { period: p } })
      if (res.success) setTargets(res.data.items || [])
    } finally { setLoading(false) }
  }

  useDidShow(() => { fetchData() })

  return (
    <View className='targets-page'>
      <View className='period-tabs'>
        {(['month', 'quarter'] as const).map((p) => (
          <View key={p} className={`period-tab ${period === p ? 'period-tab--active' : ''}`}
            onClick={() => { setPeriod(p); fetchData(p) }}>
            <Text>{p === 'month' ? '本月' : '本季度'}</Text>
          </View>
        ))}
      </View>
      <ScrollView className='targets-list' scrollY enhanced showScrollbar={false}>
        {targets.map((t) => (
          <View key={t.id} className='target-card card'>
            <Text className='sales-name'>{t.salesName}</Text>
            <View className='progress-bar'>
              <View className='progress-fill' style={{ width: `${Math.min(t.rate, 100)}%` }} />
            </View>
            <View className='flex-between'>
              <Text className='target-achieved'>已完成 ¥{t.achieved.toLocaleString()}</Text>
              <Text className='target-goal'>目标 ¥{t.target.toLocaleString()}</Text>
            </View>
            <Text className='target-rate'>{t.rate}%</Text>
          </View>
        ))}
        {targets.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-text'>暂无目标数据</Text></View>
        )}
      </ScrollView>
    </View>
  )
}
