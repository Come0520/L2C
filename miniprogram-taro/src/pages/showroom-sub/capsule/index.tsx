/**
 * 展厅分享设置页（Sales 专属）
 */
import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function CapsulePage() {
  const [itemId, setItemId] = useState('')
  const [shareTitle, setShareTitle] = useState('')
  const [shareDesc, setShareDesc] = useState('')
  const [shareImage, setShareImage] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad(async (params) => {
    setItemId(params.id || '')
    try {
      const res = await api.get(`/showroom/${params.id}`)
      if (res.success) {
        setShareTitle(res.data.title || '')
        setShareDesc(res.data.description?.substring(0, 50) || '')
        setShareImage(res.data.images?.[0] || '')
      }
    } catch (_) { }
  })

  const handleShare = async () => {
    setLoading(true)
    try {
      const res = await api.post('/showroom/share', {
        data: { itemId, title: shareTitle, description: shareDesc },
      })
      if (res.success) {
        Taro.showToast({ title: '分享链接已生成', icon: 'success' })
        // 复制分享链接
        if (res.data.shareUrl) {
          await Taro.setClipboardData({ data: res.data.shareUrl })
        }
      }
    } finally { setLoading(false) }
  }

  return (
    <View className='capsule-page'>
      <Text className='page-title'>分享设置</Text>
      {shareImage && <Image className='preview-image' src={shareImage} mode='aspectFill' />}
      <View className='form-section'><Text className='form-label'>分享标题</Text>
        <Input className='form-input' placeholder='自定义分享标题' value={shareTitle}
          onInput={(e) => setShareTitle(e.detail.value)} /></View>
      <View className='form-section'><Text className='form-label'>分享描述</Text>
        <Input className='form-input' placeholder='简短描述' value={shareDesc} maxlength={50}
          onInput={(e) => setShareDesc(e.detail.value)} /></View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleShare}>
          生成分享链接
        </Button>
      </View>
    </View>
  )
}
