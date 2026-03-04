import { View, Text, ScrollView, Image, Swiper, SwiperItem, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

/** 施工案例详情模型 */
interface CaseItem {
    id: string
    title: string
    description: string
    coverUrl: string
    images: string[] // 轮播图
    typeText: string // 例如：现代极简
    layout: string   // 房型，例如：三室两厅 120平
    cost: string     // 花费，例如：25万
    duration: string // 工期，例如：90天
    beforeAfter: { before: string; after: string; desc: string }[] // 前后对比
    customerReview: { text: string; rating: number; date: string } // 业主评价
}

export default function CaseDetailPage() {
    const { currentRole } = useAuthStore()
    const [item, setItem] = useState<CaseItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFavorite, setIsFavorite] = useState(false)
    const isSales = currentRole === 'sales'

    useLoad(async (params) => {
        const { id } = params
        if (!id) return
        try {
            // 模拟获取数据
            const res = await api.get(`/showroom/cases/${id}`).catch(() => ({ success: true, data: {} }))
            if (res.success) {
                setItem({
                    id,
                    title: res.data.title || '春晓雅筑现代极简全屋整装',
                    description: res.data.description || '本案以黑白灰为主色调，引入智能化家居系统，打造极简且富有科技感的生活空间。',
                    coverUrl: '',
                    images: res.data.images || [
                        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                    ],
                    typeText: res.data.typeText || '现代极简',
                    layout: res.data.layout || '三室两厅 / 120㎡',
                    cost: res.data.cost || '约 25 万元',
                    duration: res.data.duration || '90 天',
                    beforeAfter: res.data.beforeAfter || [
                        {
                            before: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
                            after: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80',
                            desc: '客厅改造前后：毛坯状态到极简智能客厅的华丽转身'
                        }
                    ],
                    customerReview: res.data.customerReview || {
                        text: '非常满意这次的装修服务，师傅很专业，销售一直跟进，整体效果远超预期。',
                        rating: 5,
                        date: '2025-10-12'
                    }
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
        Taro.navigateTo({ url: `/packageShowroom/capsule/index?id=${item.id}&mode=share&type=case` })
    }

    if (loading) return <View className='page flex-center'><Text>正在加载案例...</Text></View>
    if (!item) return <View className='page empty-state flex-center'><Text>案例不存在或已被删除</Text></View>

    return (
        <View className='case-detail-page'>
            <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>

                {/* 头图轮播 */}
                {item.images && item.images.length > 0 && (
                    <Swiper className='image-swiper' indicatorDots autoplay circular>
                        {item.images.map((img, i) => (
                            <SwiperItem key={i}>
                                <Image className='swiper-img' src={img} mode='aspectFill' onClick={() => Taro.previewImage({ urls: item.images, current: img })} />
                            </SwiperItem>
                        ))}
                    </Swiper>
                )}

                {/* 基本信息 */}
                <View className='info-section section-block'>
                    <Text className='case-title'>{item.title}</Text>
                    <View className='case-tags'>
                        <Text className='tag'>{item.typeText}</Text>
                    </View>
                    <Text className='case-desc'>{item.description}</Text>

                    <View className='case-meta'>
                        <View className='meta-item'>
                            <Text className='meta-label'>房屋房型</Text>
                            <Text className='meta-value'>{item.layout}</Text>
                        </View>
                        <View className='meta-item'>
                            <Text className='meta-label'>施工花费</Text>
                            <Text className='meta-value'>{item.cost}</Text>
                        </View>
                        <View className='meta-item'>
                            <Text className='meta-label'>施工周期</Text>
                            <Text className='meta-value'>{item.duration}</Text>
                        </View>
                    </View>
                </View>

                {/* 前后对比图 */}
                {item.beforeAfter && item.beforeAfter.length > 0 && (
                    <View className='section-block'>
                        <Text className='section-title'>前后对比</Text>
                        <View className='compare-list'>
                            {item.beforeAfter.map((comp, idx) => (
                                <View key={idx} className='compare-item'>
                                    <View className='compare-images'>
                                        <View className='image-box'>
                                            <Text className='badge before-badge'>施工前</Text>
                                            <Image className='img' src={comp.before} mode='aspectFill' lazyLoad onClick={() => Taro.previewImage({ urls: [comp.before, comp.after] })} />
                                        </View>
                                        <View className='image-box'>
                                            <Text className='badge after-badge'>施工后</Text>
                                            <Image className='img' src={comp.after} mode='aspectFill' lazyLoad onClick={() => Taro.previewImage({ urls: [comp.before, comp.after] })} />
                                        </View>
                                    </View>
                                    {comp.desc && <Text className='compare-desc'>{comp.desc}</Text>}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 业主评价 */}
                {item.customerReview && (
                    <View className='section-block'>
                        <Text className='section-title'>业主评价</Text>
                        <View className='review-card'>
                            <View className='review-header'>
                                <View className='stars'>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Text key={i} className={`star ${i < item.customerReview.rating ? 'active' : ''}`}>★</Text>
                                    ))}
                                </View>
                                <Text className='review-date'>{item.customerReview.date}</Text>
                            </View>
                            <Text className='review-text'>{item.customerReview.text}</Text>
                        </View>
                    </View>
                )}

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
