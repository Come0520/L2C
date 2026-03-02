/**
 * CRM 客户列表页
 */
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { useState, useRef } from 'react'
import { api } from '@/services/api'
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
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<Customer[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)

  const fetchList = async (reset = false, kw = keyword) => {
    if (loading) return
    const p = reset ? 1 : pageRef.current
    setLoading(true)
    try {
      const res = await api.get('/customers', { data: { page: p, pageSize: 20, keyword: kw } })
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
          onInput={(e) => setKeyword(e.detail.value)} onConfirm={() => fetchList(true)} />
      </View>
      <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
        {list.length === 0 && !loading && (
          <View className='empty flex-center'><Text className='empty-icon'>👥</Text><Text className='empty-text'>暂无客户</Text></View>
        )}
        {list.map((c) => (
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
