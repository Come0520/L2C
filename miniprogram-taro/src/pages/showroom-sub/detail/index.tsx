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
  images: string[]; price: number; material: string; style: string
}

export default function ShowroomDetailPage() {
  const { currentRole } = useAuthStore()
  const [item, setItem] = useState<ShowroomItem | null>(null)
  const [loading, setLoading] = useState(true)
  const isSales = currentRole === 'sales'

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/showroom/${id}`)
      if (res.success) setItem(res.data)
    } finally { setLoading(false) }
  })

  const handleShare = () => {
    if (!item) return
    Taro.navigateTo({ url: `/pages/showroom-sub/capsule/index?id=${item.id}` })
  }

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!item) return <View className='page flex-center'><Text>内容不存在</Text></View>

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
          <Text className='item-title'>{item.title}</Text>
          <View className='item-tags'>
            <Text className='tag'>{item.typeText}</Text>
            {item.style && <Text className='tag'>{item.style}</Text>}
            {item.material && <Text className='tag'>{item.material}</Text>}
          </View>
          {item.price > 0 && <Text className='item-price'>¥{item.price.toLocaleString()}</Text>}
          <Text className='item-desc'>{item.description}</Text>
        </View>

        {isSales && (
          <View className='share-bar'>
            <Button className='btn-share' onClick={handleShare}>🔗 分享给客户</Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
