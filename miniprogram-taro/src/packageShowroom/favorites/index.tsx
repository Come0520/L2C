import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

/** 收藏项类型 */
type FavoriteType = 'product' | 'case' | 'article'

interface FavoriteItem {
    id: string
    type: FavoriteType
    title: string
    coverUrl: string
    desc?: string // 商品价格或案例房型或文章作者
    date: string
}

export default function FavoritesPage() {
    const [activeTab, setActiveTab] = useState<FavoriteType>('product')
    const [items, setItems] = useState<FavoriteItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFavorites = async (type: FavoriteType) => {
        setLoading(true)
        try {
            // 模拟请求
            const res = await api.get(`/showroom/favorites?type=${type}`).catch(() => ({ success: true, data: [] }))
            if (res.success) {
                // Mock 数据
                const mockData: Record<FavoriteType, FavoriteItem[]> = {
                    product: [
                        { id: 'p1', type: 'product', title: '智能全自动马桶 Pro Max', coverUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', desc: '¥ 3999', date: '2025-03-01' },
                        { id: 'p2', type: 'product', title: '极简无主灯悬浮吊顶套餐', coverUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400', desc: '¥ 12800', date: '2025-02-28' }
                    ],
                    case: [
                        { id: 'c1', type: 'case', title: '春晓雅筑现代极简全屋整装', coverUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', desc: '三室两厅 120㎡', date: '2025-02-20' }
                    ],
                    article: [
                        { id: 'a1', type: 'article', title: '春季装修避坑指南：这些地方千万别乱省钱！', coverUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', desc: 'L2C 装修研究所', date: '2025-03-03' }
                    ]
                }
                setItems(mockData[type] || [])
            }
        } finally {
            setLoading(false)
        }
    }

    useLoad(() => {
        fetchFavorites(activeTab)
    })

    const handleTabChange = (type: FavoriteType) => {
        if (type === activeTab) return
        setActiveTab(type)
        fetchFavorites(type)
    }

    const handleItemClick = (item: FavoriteItem) => {
        let url = ''
        if (item.type === 'product') url = `/packageShowroom/product-detail/index?id=${item.id}`
        else if (item.type === 'case') url = `/packageShowroom/case-detail/index?id=${item.id}`
        else if (item.type === 'article') url = `/packageShowroom/article-detail/index?id=${item.id}`

        if (url) Taro.navigateTo({ url })
    }

    const tabs: { key: FavoriteType; label: string }[] = [
        { key: 'product', label: '商品' },
        { key: 'case', label: '案例' },
        { key: 'article', label: '文章' }
    ]

    return (
        <View className='favorites-page'>
            {/* 顶部 Tab */}
            <View className='tabs-header'>
                {tabs.map((tab) => (
                    <View
                        key={tab.key}
                        className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.key)}
                    >
                        <Text className='tab-text'>{tab.label}</Text>
                        {activeTab === tab.key && <View className='tab-line' />}
                    </View>
                ))}
            </View>

            {/* 列表区域 */}
            <ScrollView className='list-scroll' scrollY enhanced showScrollbar={false}>
                {loading ? (
                    <View className='loading-state flex-center'><Text>加载中...</Text></View>
                ) : items.length === 0 ? (
                    <View className='empty-state flex-center'>
                        <Text>暂无收藏</Text>
                    </View>
                ) : (
                    <View className='favorites-list'>
                        {items.map((item) => (
                            <View key={item.id} className='favorite-item' onClick={() => handleItemClick(item)}>
                                <Image className='item-cover' src={item.coverUrl} mode='aspectFill' lazyLoad />
                                <View className='item-info'>
                                    <Text className='item-title'>{item.title}</Text>
                                    <View className='item-bottom'>
                                        <Text className='item-desc'>{item.desc}</Text>
                                        <Text className='item-date'>{item.date}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
