import { View, Text, ScrollView, Button, RichText } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

/** 文章详情模型 */
interface ArticleItem {
    id: string
    title: string
    coverUrl: string
    author: string
    publishTime: string
    viewCount: number
    content: string // 富文本内容 HTML
}

export default function ArticleDetailPage() {
    const { currentRole } = useAuthStore()
    const [item, setItem] = useState<ArticleItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFavorite, setIsFavorite] = useState(false)
    const isSales = currentRole === 'sales'

    useLoad(async (params) => {
        const { id } = params
        if (!id) return
        try {
            // 模拟获取数据
            const res = await api.get(`/showroom/articles/${id}`).catch(() => ({ success: true, data: {} }))
            if (res.success) {
                setItem({
                    id,
                    title: res.data.title || '春季装修避坑指南：这些地方千万别乱省钱！',
                    coverUrl: res.data.coverUrl || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop',
                    author: res.data.author || 'L2C 装修研究所',
                    publishTime: res.data.publishTime || '2025-03-01 10:00',
                    viewCount: res.data.viewCount || 1284,
                    content: res.data.content || `
            <div style="font-size: 14px; color: #333; line-height: 1.8;">
              <p>装修是一件费劲心力的事情，很多人为了省钱，在一些隐蔽工程或者五金配件上抠门，结果住进去没多久就苦不堪言。今天我们就来盘点一下，装修中哪些地方是<strong>坚决不能省钱</strong>的。</p>
              <h3 style="color: #000; font-size: 16px; margin: 20px 0 10px;">1. 水电材料</h3>
              <p>水电是隐蔽工程，一旦封在墙里，一旦出问题，维修成本成倍增加。电线、水管、穿线管必须用大牌，不要贪图便宜。</p>
              <h3 style="color: #000; font-size: 16px; margin: 20px 0 10px;">2. 卫生间防水</h3>
              <p>防水做不好，楼下邻居天天找。防水涂料要买好的，涂刷工艺要按标准执行，并且一定要做<strong>闭水试验</strong>。</p>
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />
              <p>总而言之，装修可以省，但该花的地方一分也不能少。</p>
            </div>
          `
                })
            }
        } finally {
            setLoading(false)
        }
    })

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite)
        Taro.showToast({ title: !isFavorite ? '已收藏' : '已取消收藏', icon: 'success' })
    }

    const handleShare = () => {
        if (!item) return
        Taro.navigateTo({ url: `/packageShowroom/capsule/index?id=${item.id}&mode=share&type=article` })
    }

    if (loading) return <View className='page flex-center'><Text>正在加载文章...</Text></View>
    if (!item) return <View className='page empty-state flex-center'><Text>文章不存在或已被删除</Text></View>

    return (
        <View className='article-detail-page'>
            <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>

                {/* 文章头部 */}
                <View className='article-header'>
                    <Text className='article-title'>{item.title}</Text>
                    <View className='article-meta'>
                        <Text className='meta-item'>{item.author}</Text>
                        <Text className='meta-item'>{item.publishTime}</Text>
                        <Text className='meta-item'>{item.viewCount} 阅读</Text>
                    </View>
                </View>

                {/* 文章主体（富文本） */}
                <View className='article-body'>
                    <RichText nodes={item.content} />
                </View>

            </ScrollView>

            {/* 底部悬浮操作栏 */}
            <View className='bottom-action-bar'>
                <View className='action-left'>
                    <View className='action-icon-btn' onClick={toggleFavorite}>
                        <Text className={`icon ${isFavorite ? 'favorite-active' : ''}`}>{isFavorite ? '★' : '☆'}</Text>
                        <Text className='label'>{isFavorite ? '已收藏' : '收藏'}</Text>
                    </View>
                </View>

                <View className='action-right'>
                    {isSales && (
                        <Button className='btn btn-share' onClick={handleShare}>配置权限并分享</Button>
                    )}
                </View>
            </View>

        </View>
    )
}
