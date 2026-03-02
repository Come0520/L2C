/**
 * 报表/数据报告页（Manager 和 Sales 专属）
 *
 * @description 轻量版报表：展示核心 KPI，复杂分析引导至 Web 端。
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

interface KPI { label: string; value: string; unit: string; trend?: string }
interface SalesRankItem { rank: number; name: string; amount: number; count: number }

export default function ReportsPage() {
  const { currentRole } = useAuthStore()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [rankList, setRankList] = useState<SalesRankItem[]>([])
  const [period, setPeriod] = useState<'month' | 'quarter'>('month')
  const [loading, setLoading] = useState(false)

  const isManager = currentRole === 'manager' || currentRole === 'admin'
  const isSales = currentRole === 'sales'

  const fetchData = async (p = period) => {
    setLoading(true)
    try {
      const res = await api.get('/reports/summary', { data: { period: p } })
      if (res.success) {
        setKpis(res.data.kpis || [])
        if (isManager) setRankList(res.data.salesRank || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchData() })

  return (
    <View className='reports-page'>
      {/* 周期切换 */}
      <View className='period-tabs'>
        {(['month', 'quarter'] as const).map((p) => (
          <View key={p} className={`period-tab ${period === p ? 'period-tab--active' : ''}`}
            onClick={() => { setPeriod(p); fetchData(p) }}>
            <Text>{p === 'month' ? '本月' : '本季度'}</Text>
          </View>
        ))}
      </View>

      <ScrollView className='reports-scroll' scrollY enhanced showScrollbar={false}>
        {/* KPI 指标卡 */}
        <View className='kpi-grid'>
          {kpis.map((k, i) => (
            <View key={i} className='kpi-card card'>
              <Text className='kpi-value'>{k.value}<Text className='kpi-unit'>{k.unit}</Text></Text>
              <Text className='kpi-label'>{k.label}</Text>
              {k.trend && <Text className={`kpi-trend ${k.trend.startsWith('+') ? 'kpi-trend--up' : 'kpi-trend--down'}`}>{k.trend}</Text>}
            </View>
          ))}
        </View>

        {/* Manager 专属：销售排行 */}
        {isManager && rankList.length > 0 && (
          <View className='rank-section'>
            <Text className='section-title'>销售排行</Text>
            {rankList.map((item) => (
              <View key={item.rank} className='rank-item card'>
                <Text className='rank-no'>{item.rank}</Text>
                <Text className='rank-name flex-1'>{item.name}</Text>
                <View>
                  <Text className='rank-amount'>¥{item.amount.toLocaleString()}</Text>
                  <Text className='rank-count'>{item.count} 单</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Web 端深度分析引导 */}
        <View className='web-guide card' onClick={() => Taro.navigateTo({ url: '/pages/landing/index' })}>
          <Text className='web-guide-title'>💻 深度分析 → Web 管理端</Text>
          <Text className='web-guide-desc'>财务明细、趋势图表、导出 Excel</Text>
        </View>
      </ScrollView>
    </View>
  )
}
