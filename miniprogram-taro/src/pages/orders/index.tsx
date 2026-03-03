/**
 * 订单列表页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom, useLoad } from '@tarojs/taro'
import { useState, useRef } from 'react'
import { api } from '@/services/api'
import { requireRole } from '@/utils/route-guard'
import './index.scss'

type OrderStatus = 'all' | 'pending' | 'in_production' | 'installing' | 'completed'

interface Order {
  id: string
  orderNo: string
  customerName: string
  totalAmount: number
  status: string
  statusText: string
  createdAt: string
}

const STATUS_TABS: { key: OrderStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待生产' },
  { key: 'in_production', label: '生产中' },
  { key: 'installing', label: '待安装' },
  { key: 'completed', label: '已完成' },
]

export default function OrdersPage() {
  useLoad(() => {
    requireRole(['manager', 'admin', 'sales'])
  })

  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all')
  const [list, setList] = useState<Order[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)

  const fetchList = async (reset = false, status = activeStatus) => {
    if (loading) return
    const p = reset ? 1 : pageRef.current
    setLoading(true)
    try {
      const res = await api.get('/orders', {
        data: { page: p, pageSize: 20, ...(status !== 'all' ? { status } : {}) },
      })
      if (res.success) {
        const { items, pagination } = res.data
        const newList = reset ? items : [...list, ...items]
        setList(newList)
        pageRef.current = p + 1
        setHasMore(newList.length < pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchList(true) })
  usePullDownRefresh(() => { fetchList(true).then(() => Taro.stopPullDownRefresh()) })
  useReachBottom(() => { if (hasMore && !loading) fetchList() })

  const handleStatusChange = (s: OrderStatus) => {
    setActiveStatus(s)
    setList([])
    pageRef.current = 1
    setHasMore(true)
    fetchList(true, s)
  }

  return (
    <View className='orders-page'>
      <View className='page-header'><Text className='page-title'>订单</Text></View>

      {/* 状态筛选横向滚动 */}
      <ScrollView className='status-tabs' scrollX enhanced showScrollbar={false}>
        {STATUS_TABS.map((t) => (
          <View key={t.key}
            className={`status-tab ${activeStatus === t.key ? 'status-tab--active' : ''}`}
            onClick={() => handleStatusChange(t.key)}>
            <Text>{t.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {list.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-icon'>📦</Text><Text className='empty-text'>暂无订单</Text></View>
        )}
        {list.map((o) => (
          <View key={o.id} className='order-card card'
            onClick={() => Taro.navigateTo({ url: `/pages/orders/detail/index?id=${o.id}` })}>
            <View className='flex-between'>
              <Text className='order-no'>{o.orderNo}</Text>
              <Text className='order-status'>{o.statusText}</Text>
            </View>
            <Text className='order-customer'>{o.customerName}</Text>
            <View className='flex-between' style={{ marginTop: '8px' }}>
              <Text className='order-date'>{o.createdAt}</Text>
              <Text className='order-amount'>¥{o.totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {loading && <View className='loading flex-center'><Text>加载中...</Text></View>}
      </ScrollView>
    </View>
  )
}
