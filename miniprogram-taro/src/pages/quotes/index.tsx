/**
 * 报价单列表页
 */
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { requireRole } from '@/utils/route-guard'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import Skeleton from '@/components/Skeleton/index'
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
  useLoad(() => {
    requireRole(['manager', 'admin', 'sales'])
  })

  const { list: quotes, loading, hasMore, keyword, setKeyword, refresh } =
    usePaginatedList<Quote>({
      apiPath: '/quotes',
      autoRefresh: true,
    })

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
          onConfirm={() => refresh()}
        />
      </View>

      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {quotes.length === 0 && !loading && (
          <View className='empty flex-center'>
            <Text className='empty-icon'>📄</Text>
            <Text className='empty-text'>暂无报价单</Text>
          </View>
        )}
        <Skeleton loading={loading && quotes.length === 0} type="list" rows={4}>
          {quotes.map((q) => (
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
        </Skeleton>
        {loading && quotes.length > 0 && <View className='loading flex-center'><Text>加载中...</Text></View>}
        {!hasMore && quotes.length > 0 && (
          <View className='no-more flex-center'><Text>— 已显示全部 —</Text></View>
        )}
      </ScrollView>
    </View>
  )
}
