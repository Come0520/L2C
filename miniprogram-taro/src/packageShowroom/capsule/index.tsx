/**
 * 展厅分享设置页（Sales 专属）/ 生成品牌分享图
 */
import { View, Text, Image, Switch } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

export default function CapsulePage() {
  const { userInfo } = useAuthStore()
  const [itemIds, setItemIds] = useState<string[]>([])
  const [shareTitle, setShareTitle] = useState('')
  const [shareDesc, setShareDesc] = useState('')
  const [shareImage, setShareImage] = useState('')
  const [allowCustomerShare, setAllowCustomerShare] = useState(false)
  const [loading, setLoading] = useState(false)

  // 模拟租户信息
  const tenantName = userInfo?.tenantName || 'L2C 装修旗舰店'
  const tenantLogo = userInfo?.avatarUrl || 'https://images.unsplash.com/photo-1542382257-80da354bf52c?w=100&q=80'

  useLoad(async (params) => {
    const ids = params.ids ? params.ids.split(',') : (params.id ? [params.id] : [])
    setItemIds(ids)

    if (ids.length > 1) {
      setShareTitle('精选展厅合集')
      setShareDesc(`为您精选了 ${ids.length} 项优质展示内容，欢迎随邀品鉴`)
      setShareImage(tenantLogo) // Fallback for collection
    } else if (ids.length === 1) {
      const type = params.type || 'product' // product | case | article
      try {
        // 模拟根据类型获取分享数据
        const res = await api.get(`/showroom/${type}/${ids[0]}`).catch(() => ({ success: true, data: {} }))
        if (res.success) {
          // Mock 兜底数据
          setShareTitle(res.data.title || '春晓雅筑现代极简全屋整装')
          setShareDesc(res.data.description?.substring(0, 50) || '为你提供最专业的全屋定制与装修服务')
          setShareImage(res.data.images?.[0] || res.data.coverUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')
        }
      } catch (_) { }
    }
  })

  // 模拟保存海报到相册
  const handleSavePoster = async () => {
    setLoading(true)
    Taro.showLoading({ title: '生成中...' })
    setTimeout(() => {
      Taro.hideLoading()
      setLoading(false)
      Taro.showToast({ title: '海报已保存到相册', icon: 'success' })
    }, 1500)
  }

  // 微信转发（模拟）
  const handleShareWx = () => {
    // 真实业务中，此处应调用 API 生成 ShareLink，并附带 allowCustomerShare
    Taro.showToast({ title: '参数已保存，请点击右上角转发', icon: 'none' })
  }

  const handleCopyLink = async () => {
    // 真实业务中，此处应调用 API 生成 ShareLink 拿到 shareId
    const shareId = itemIds.join('-')
    await Taro.setClipboardData({ data: `https://l2c.asia/share/${shareId}?allowReshare=${allowCustomerShare}` })
    Taro.showToast({ title: '链接已复制', icon: 'success' })
  }

  return (
    <View className='capsule-page'>

      <View className='poster-container'>
        {/* 海报预览卡片 */}
        <View className='poster-card' id='poster-node'>
          {/* 海报头部：租户品牌 */}
          <View className='poster-header'>
            <Image className='tenant-logo' src={tenantLogo} mode='aspectFill' />
            <Text className='tenant-name'>{tenantName}</Text>
          </View>

          {/* 海报主体内容 */}
          <View className='poster-body'>
            <Image className='content-image' src={shareImage} mode='aspectFill' />
            <Text className='content-title'>{shareTitle}</Text>
            <Text className='content-desc'>{shareDesc}</Text>
          </View>

          {/* 海报底部：包含扫码提示和二维码 */}
          <View className='poster-footer'>
            <View className='footer-text'>
              <Text className='slogan'>长按识别小程序码</Text>
              <Text className='slogan-sub'>查看更多精选好物与案例</Text>
            </View>
            <View className='qr-code'>
              {/* 这里放小程序太阳码，暂时用占位图 */}
              <Image className='qr-img' src='https://images.unsplash.com/photo-1607519961633-1cebc784b069?w=150&q=80' mode='aspectFill' />
            </View>
          </View>
        </View>
      </View>

      <View className='action-panel'>
        <View className='config-panel'>
          <View className='config-item'>
            <View className='config-info'>
              <Text className='config-title'>允许客户二次分享</Text>
              <Text className='config-desc'>开启后，客户可以将此链接转发给其他好友</Text>
            </View>
            <Switch
              checked={allowCustomerShare}
              onChange={(e) => setAllowCustomerShare(e.detail.value)}
              color='#10a37f'
            />
          </View>
        </View>

        <Text className='panel-title'>分享给客户</Text>

        <View className='action-grid'>
          <View className='action-item' onClick={handleShareWx}>
            <View className='icon-circle wx-icon'>
              <Text className='icon-text'>W</Text>
            </View>
            <Text className='action-label'>发给微信好友</Text>
          </View>

          <View className='action-item' onClick={handleSavePoster}>
            <View className='icon-circle save-icon'>
              <Text className='icon-text'>↓</Text>
            </View>
            <Text className='action-label'>{loading ? '生成中...' : '保存分享海报'}</Text>
          </View>

          <View className='action-item' onClick={handleCopyLink}>
            <View className='icon-circle link-icon'>
              <Text className='icon-text'>🔗</Text>
            </View>
            <Text className='action-label'>复制专属链接</Text>
          </View>
        </View>
      </View>

    </View>
  )
}
