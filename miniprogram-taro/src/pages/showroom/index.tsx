/**
 * 云展厅页（Sales + Customer 共享 TabBar 页面）
 *
 * @description 按角色区分视图：
 * - Sales：浏览展厅内容 + 配置分享权限 + 生成分享链接
 * - Customer：浏览 Sales 分享的内容或全部展厅（依授权范围）
 */
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { requireRole } from '@/utils/route-guard'
import TabBar from '@/components/TabBar/index'
import './index.scss'

/** 展厅内容项 */
interface ShowroomItem {
  id: string
  title: string
  coverUrl: string
  type: 'article' | 'case' | 'product'
  description?: string
  viewCount?: number
}

/** 展厅分类 Tab */
type ShowroomTab = 'all' | 'article' | 'case' | 'product'

const CATEGORY_TABS: { key: ShowroomTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'article', label: '文章' },
  { key: 'case', label: '案例' },
  { key: 'product', label: '商品' },
]

export default function ShowroomPage() {
  useLoad(() => {
    requireRole(['sales', 'customer'])
  })

  const { currentRole } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ShowroomTab>('all')
  const [items, setItems] = useState<ShowroomItem[]>([])
  const [selectedItems, setSelectedItems] = useState<ShowroomItem[]>([])
  const [loading, setLoading] = useState(false)

  const isSales = currentRole === 'sales'

  /** 获取展厅内容 */
  const fetchItems = async (category: ShowroomTab) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (category !== 'all') params.type = category

      const res = await api.get('/showroom/items', { data: params })
      if (res.success) {
        setItems(res.data?.items || res.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    fetchItems(activeTab)
  })

  usePullDownRefresh(() => {
    fetchItems(activeTab).then(() => Taro.stopPullDownRefresh())
  })

  /** 切换分类 */
  const handleTabChange = (tab: ShowroomTab) => {
    setActiveTab(tab)
    fetchItems(tab)
  }

  /** 跳转详情 */
  const goDetail = (item: ShowroomItem) => {
    Taro.navigateTo({ url: `/packageShowroom/product-detail/index?id=${item.id}` })
  }

  /** Sales：直接分享单项 */
  const handleShare = (item: ShowroomItem) => {
    Taro.navigateTo({
      url: `/packageShowroom/capsule/index?id=${item.id}&mode=share`,
    })
  }

  /** Sales：加入/移出选品包 (多选) */
  const toggleSelect = (item: ShowroomItem) => {
    const isSelected = selectedItems.some((i) => i.id === item.id)
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  /** Sales：打包分享 */
  const handleShareMultiple = () => {
    if (selectedItems.length === 0) return
    const ids = selectedItems.map((i) => i.id).join(',')
    Taro.navigateTo({
      url: `/packageShowroom/capsule/index?ids=${ids}&mode=share`,
    })
  }

  return (
    <View className='showroom-page'>
      {/* 顶部标题 */}
      <View className='showroom-header'>
        <Text className='header-title'>
          {isSales ? '云展厅' : '展厅'}
        </Text>
        {isSales && (
          <Text className='header-subtitle'>选内容 → 配置权限 → 分享给客户</Text>
        )}
      </View>

      {/* 分类 Tab */}
      <View className='category-tabs'>
        {CATEGORY_TABS.map((tab) => (
          <View
            key={tab.key}
            className={`category-tab ${activeTab === tab.key ? 'category-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 内容列表 */}
      <ScrollView className='content-list' scrollY enhanced showScrollbar={false}>
        {items.length === 0 && !loading && (
          <View className='empty-state flex-center'>
            <Text className='empty-icon'>🏠</Text>
            <Text className='empty-text'>暂无展厅内容</Text>
          </View>
        )}

        {items.length > 0 && (
          <View className='card-grid'>
            {items.map((item) => (
              <View
                key={item.id}
                className='showroom-card card'
                onClick={() => goDetail(item)}
              >
                {item.coverUrl && (
                  <Image
                    className='card-cover'
                    src={item.coverUrl}
                    mode='aspectFill'
                    lazyLoad
                  />
                )}
                <View className='card-body'>
                  <View className='card-meta'>
                    <Text className={`type-badge type-badge--${item.type}`}>
                      {item.type === 'article' ? '文章' : item.type === 'case' ? '案例' : '商品'}
                    </Text>
                    {item.viewCount !== undefined && (
                      <Text className='view-count'>{item.viewCount} 次浏览</Text>
                    )}
                  </View>
                  <Text className='card-title text-ellipsis'>{item.title}</Text>
                  {item.description && (
                    <Text className='card-desc text-ellipsis'>{item.description}</Text>
                  )}

                  {/* Sales 操作区 */}
                  {isSales && (
                    <View className='sales-actions'>
                      <View
                        className={`btn-select ${selectedItems.some(i => i.id === item.id) ? 'btn-select--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(item)
                        }}
                      >
                        <Text>{selectedItems.some(i => i.id === item.id) ? '不选' : '加入展包'}</Text>
                      </View>
                      <View
                        className='btn-share'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShare(item)
                        }}
                      >
                        <Text>分享</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View className='loading flex-center'>
            <Text>加载中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部悬浮分享购物车（Sales） */}
      {isSales && selectedItems.length > 0 && (
        <View className='share-cart-bar'>
          <View className='cart-info'>
            <Text className='cart-count'>已选 {selectedItems.length} 项</Text>
            <Text className='cart-clear' onClick={() => setSelectedItems([])}>清空</Text>
          </View>
          <View className='cart-btn' onClick={handleShareMultiple}>
            <Text>打包分享</Text>
          </View>
        </View>
      )}

      <TabBar selected='/pages/showroom/index' />
    </View>
  )
}
