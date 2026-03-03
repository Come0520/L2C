/**
 * CRM 客户列表页
 */
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { requireRole } from '@/utils/route-guard'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import './index.scss'

interface Customer {
  id: string
  name: string
  phone: string
  source: string
  stage: string
  stageText: string
  lastActivity?: string
  assigneeName?: string
}

export default function CrmPage() {
  useLoad(() => {
    requireRole(['manager', 'admin', 'sales'])
  })

  const { list: customers, loading, hasMore, keyword, setKeyword, refresh } =
    usePaginatedList<Customer>({
      apiPath: '/customers',
      autoRefresh: true,
    })

  return (
    <View className='crm-page'>
      <View className='page-header'>
        <Text className='page-title'>客户</Text>
        <View className='btn-create' onClick={() => Taro.navigateTo({ url: '/pages/crm/create/index' })}>
          <Text>+ 新建</Text>
        </View>
      </View>
      <View className='search-bar'>
        <Input className='search-input' placeholder='搜索客户姓名/手机号' value={keyword}
          onInput={(e) => setKeyword(e.detail.value)} onConfirm={() => refresh()} />
      </View>
      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {customers.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-icon'>👥</Text><Text className='empty-text'>暂无客户</Text></View>
        )}
        {customers.map((c) => (
          <View key={c.id} className='customer-card card'
            onClick={() => Taro.navigateTo({ url: `/pages/crm/detail/index?id=${c.id}` })}>
            <View className='flex-between'>
              <Text className='customer-name'>{c.name}</Text>
              <Text className='customer-stage'>{c.stageText}</Text>
            </View>
            <Text className='customer-phone'>{c.phone}</Text>
            <View className='flex-between' style={{ marginTop: '8px' }}>
              <Text className='customer-source'>{c.source}</Text>
              {c.lastActivity && <Text className='customer-activity'>{c.lastActivity}</Text>}
            </View>
          </View>
        ))}
        {loading && <View className='loading flex-center'><Text>加载中...</Text></View>}
      </ScrollView>
    </View>
  )
}
