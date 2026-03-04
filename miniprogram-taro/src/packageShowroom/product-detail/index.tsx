/**
 * 展厅详情页
 */
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

interface ShowroomItem {
  id: string; title: string; description: string; type: string; typeText: string
  images: string[]; price: number; material?: string; style?: string
  specs?: { label: string; value: string }[]
  relatedCases?: { id: string; title: string; cover: string }[]
}

export default function ShowroomDetailPage() {
  const { currentRole } = useAuthStore()
  const [item, setItem] = useState<ShowroomItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const isSales = currentRole === 'sales'
  const isCustomer = currentRole === 'customer'

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/showroom/${id}`)
      if (res.success) {
        // Mock some data if missing to demonstrate enhancement
        const data = res.data || {}
        setItem({
          ...data,
          specs: data.specs || [
            { label: '品牌', value: 'L2C 甄选' },
            { label: '发货周期', value: '15-30天' }
          ],
          relatedCases: data.relatedCases || [
            { id: 'c1', title: '现代极简三居室全屋定制', cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
          ]
        })
      }
    } finally { setLoading(false) }
  })

  const handleShare = () => {
    if (!item) return
    Taro.navigateTo({ url: `/packageShowroom/capsule/index?id=${item.id}&mode=share` })
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    Taro.showToast({ title: !isFavorite ? '已收藏' : '已取消收藏', icon: 'success' })
  }

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!item) return <View className='page empty-state flex-center'><Text>内容不存在</Text></View>

  return (
    <View className='showroom-detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        {/* 图片轮播 */}
        {item.images?.length > 0 && (
          <Swiper className='image-swiper' indicatorDots autoplay circular>
            {item.images.map((img, i) => (
              <SwiperItem key={i}>
                <Image className='swiper-img' src={img} mode='aspectFill'
                  onClick={() => Taro.previewImage({ urls: item.images, current: img })} />
              </SwiperItem>
            ))}
          </Swiper>
        )}

        <View className='detail-content'>
          <View className='price-row'>
            {item.price > 0 && <Text className='item-price'>¥{item.price.toLocaleString()}</Text>}
          </View>

          <Text className='item-title'>{item.title}</Text>
          <Text className='item-desc'>{item.description}</Text>

          <View className='item-tags'>
            {item.typeText && <Text className='tag'>{item.typeText}</Text>}
            {item.style && <Text className='tag'>{item.style}</Text>}
            {item.material && <Text className='tag'>{item.material}</Text>}
          </View>
        </View>

        {/* 规格参数 */}
        {item.specs && item.specs.length > 0 && (
          <View className='section-block specs-block'>
            <Text className='section-title'>规格参数</Text>
            <View className='specs-list'>
              {item.specs.map((spec, i) => (
                <View key={i} className='spec-item'>
                  <Text className='spec-label'>{spec.label}</Text>
                  <Text className='spec-value'>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 关联案例 */}
        {item.relatedCases && item.relatedCases.length > 0 && (
          <View className='section-block related-cases-block'>
            <Text className='section-title'>关联案例 ({item.relatedCases.length})</Text>
            <ScrollView scrollX className='cases-scroll' showScrollbar={false}>
              <View className='cases-list'>
                {item.relatedCases.map((rc) => (
                  <View key={rc.id} className='case-card' onClick={() => Taro.navigateTo({ url: `/packageShowroom/case-detail/index?id=${rc.id}` })}>
                    <Image className='case-cover' src={rc.cover} mode='aspectFill' lazyLoad />
                    <Text className='case-title text-ellipsis'>{rc.title}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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
          {isSales ? (
            <Button className='btn btn-share' onClick={handleShare}>配置权限并分享</Button>
          ) : isCustomer ? (
            <Button className='btn btn-primary' onClick={() => Taro.navigateTo({ url: `/packageCustomer/after-sales/index` })}>申请售后</Button>
          ) : null}
        </View>
      </View>
    </View>
  )
}
