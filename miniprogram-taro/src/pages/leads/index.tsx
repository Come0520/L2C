/**
 * 线索列表页（Sales 核心页，TabBar 槽位1）
 *
 * @description 从原生 leads/index.ts 迁移重写为 React 函数组件。
 * 两个 Tab：我的线索 / 公共线索池
 */
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom, useLoad } from '@tarojs/taro'
import { useState, useCallback, useRef } from 'react'
import { api } from '@/services/api'
import { requireRole } from '@/utils/route-guard'
import TabBar from '@/components/TabBar/index'
import { Skeleton } from '@/components/Skeleton/index'
import './index.scss'

type LeadTab = 'mine' | 'pool'

interface Lead {
  id: string
  customerName: string
  phone: string
  source: string
  status: string
  statusText: string
  createdAt: string
  lastFollowUp?: string
}

const STATUS_COLOR: Record<string, string> = {
  new: '#E6B450',
  following: '#409EFF',
  quoted: '#67C23A',
  lost: '#909399',
}

export default function LeadsPage() {
  useLoad(() => {
    requireRole(['sales', 'manager', 'admin'])
  })

  const [activeTab, setActiveTab] = useState<LeadTab>('mine')
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState<Lead[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)
  const PAGE_SIZE = 20

  /** 获取列表 */
  const fetchList = useCallback(async (reset = false, kw = keyword, tab = activeTab) => {
    if (loading) return
    const currentPage = reset ? 1 : pageRef.current
    setLoading(true)
    try {
      const res = await api.get('/leads', {
        data: { type: tab, page: currentPage, pageSize: PAGE_SIZE, keyword: kw },
      })
      if (res.success) {
        const { items, pagination } = res.data
        const newList = reset ? items : [...list, ...items]
        setList(newList)
        pageRef.current = currentPage + 1
        setHasMore(newList.length < pagination.total)
      }
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [loading, list, keyword, activeTab])

  useDidShow(() => { fetchList(true) })
  usePullDownRefresh(() => { fetchList(true).then(() => Taro.stopPullDownRefresh()) })
  useReachBottom(() => { if (hasMore && !loading) fetchList() })

  const handleTabChange = (tab: LeadTab) => {
    setActiveTab(tab)
    setList([])
    setHasMore(true)
    pageRef.current = 1
    fetchList(true, keyword, tab)
  }

  const handleSearch = () => { fetchList(true) }

  return (
    <View className='leads-page'>
      {/* 顶部搜索栏 */}
      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索客户姓名/手机号'
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={handleSearch}
        />
        <View className='search-btn' onClick={handleSearch}>
          <Text>搜索</Text>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className='leads-tabs'>
        {(['mine', 'pool'] as LeadTab[]).map((tab) => (
          <View
            key={tab}
            className={`leads-tab ${activeTab === tab ? 'leads-tab--active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <Text>{tab === 'mine' ? '我的线索' : '线索池'}</Text>
          </View>
        ))}
      </View>

      {/* 新增按钮 */}
      <View className='fab' onClick={() => Taro.navigateTo({ url: '/pages/leads-sub/create/index' })}>
        <Text>+</Text>
      </View>

      {/* 列表 */}
      <ScrollView className='leads-list' scrollY enhanced showScrollbar={false}>
        {list.length === 0 && !loading && (
          <View className='empty flex-center'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>暂无线索</Text>
          </View>
        )}
        <Skeleton loading={loading && list.length === 0} type="list" rows={5} avatar>
          {list.map((lead) => (
            <View
              key={lead.id}
              className='lead-card card'
              onClick={() => Taro.navigateTo({ url: `/pages/leads-sub/detail/index?id=${lead.id}` })}
            >
              <View className='card-row card-row--between'>
                <Text className='lead-name'>{lead.customerName}</Text>
                <Text
                  className='lead-status'
                  style={{ color: STATUS_COLOR[lead.status] || '#909399' }}
                >
                  {lead.statusText}
                </Text>
              </View>
              <Text className='lead-phone'>{lead.phone}</Text>
              <View className='card-row card-row--between' style={{ marginTop: '8px' }}>
                <Text className='lead-source'>{lead.source}</Text>
                <Text className='lead-time'>{lead.createdAt}</Text>
              </View>
              {lead.lastFollowUp && (
                <Text className='lead-followup'>最近跟进：{lead.lastFollowUp}</Text>
              )}
            </View>
          ))}
        </Skeleton>
        {loading && list.length > 0 && <View className='loading flex-center'><Text>加载中...</Text></View>}
        {!hasMore && list.length > 0 && (
          <View className='no-more flex-center'><Text>— 已显示全部 —</Text></View>
        )}
      </ScrollView>

      <TabBar selected='/pages/leads/index' />
    </View>
  )
}
