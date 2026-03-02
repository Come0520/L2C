/**
 * 报价单列表页
 */
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { useState, useRef } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface Quote {
  id: string
  quoteNo: string
  customerName: string
  totalAmount: number
  status: string
  statusText: string
  createdAt: string
  roomCount: number
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#909399',
  sent: '#409EFF',
  confirmed: '#67C23A',
  expired: '#F56C6C',
}

export default function QuotesPage() {
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<Quote[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)

  const fetchList = async (reset = false, kw = keyword) => {
    if (loading) return
    const currentPage = reset ? 1 : pageRef.current
    setLoading(true)
    try {
      const res = await api.get('/quotes', {
        data: { page: currentPage, pageSize: 20, keyword: kw },
      })
      if (res.success) {
        const { items, pagination } = res.data
        const newList = reset ? items : [...list, ...items]
        setList(newList)
        pageRef.current = currentPage + 1
        setHasMore(newList.length < pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { fetchList(true) })
  usePullDownRefresh(() => { fetchList(true).then(() => Taro.stopPullDownRefresh()) })
  useReachBottom(() => { if (hasMore && !loading) fetchList() })

  return (
    <View className='quotes-page'>
      <View className='page-header'>
        <Text className='page-title'>报价单</Text>
        <View className='header-actions'>
          <View
            className='btn-create'
            onClick={() => Taro.navigateTo({ url: '/pages/quotes/create/index' })}
          >
            <Text>+ 新建</Text>
          </View>
        </View>
      </View>

      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索客户名/报价单号'
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={() => fetchList(true)}
        />
      </View>

      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {list.length === 0 && !loading && (
          <View className='empty flex-center'>
            <Text className='empty-icon'>📄</Text>
            <Text className='empty-text'>暂无报价单</Text>
          </View>
        )}
        {list.map((q) => (
          <View
            key={q.id}
            className='quote-card card'
            onClick={() => Taro.navigateTo({ url: `/pages/quotes/detail/index?id=${q.id}` })}
          >
            <View className='card-row card-row--between'>
              <Text className='quote-no'>{q.quoteNo}</Text>
              <Text style={{ color: STATUS_COLOR[q.status] || '#909399', fontSize: '24px' }}>
                {q.statusText}
              </Text>
            </View>
            <Text className='quote-customer'>{q.customerName}</Text>
            <View className='card-row card-row--between' style={{ marginTop: '8px' }}>
              <Text className='quote-rooms'>{q.roomCount} 个房间</Text>
              <Text className='quote-amount'>¥{q.totalAmount.toLocaleString()}</Text>
            </View>
            <Text className='quote-date'>{q.createdAt}</Text>
          </View>
        ))}
        {loading && <View className='loading flex-center'><Text>加载中...</Text></View>}
        {!hasMore && list.length > 0 && (
          <View className='no-more flex-center'><Text>— 已显示全部 —</Text></View>
        )}
      </ScrollView>
    </View>
  )
}
