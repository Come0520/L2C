/**
 * 展厅分享设置页（Sales 专属）/ 客户浏览入口
 *
 * @description 双角色视图：
 * - Sales（mode=share）：配置分享权限 + 生成品牌分享图
 * - Customer（mode=view）：通过 shareId 获取分享内容并浏览
 */
import { View, Text, Image, Switch } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

/** 分享内容中的单个素材 */
interface ShareItem {
  id: string
  title: string
  coverUrl?: string
  description?: string
  overridePrice?: number
}

export default function CapsulePage() {
  const { userInfo } = useAuthStore((s) => s)
  const [itemIds, setItemIds] = useState<string[]>([])
  const [shareTitle, setShareTitle] = useState('')
  const [shareDesc, setShareDesc] = useState('')
  const [shareImage, setShareImage] = useState('')
  const [allowCustomerShare, setAllowCustomerShare] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareItems, setShareItems] = useState<ShareItem[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [mode, setMode] = useState<'share' | 'view'>('share')

  // 租户信息
  const tenantName = userInfo?.tenantName || 'L2C 装修旗舰店'
  const tenantLogo = userInfo?.avatarUrl || 'https://images.unsplash.com/photo-1542382257-80da354bf52c?w=100&q=80'

  useLoad(async (params) => {
    const pageMode = (params.mode as 'share' | 'view') || 'share'
    setMode(pageMode)

    // ── 客户浏览模式：通过 shareId 获取分享内容 ──
    if (params.shareId && pageMode === 'view') {
      setLoading(true)
      try {
        const res = await api.post('/showroom/share/content', {
          data: {
            shareId: params.shareId,
            visitorUserId: userInfo?.id,  // 身份锁定用
          },
        })

        if (!res.success) {
          // SHARE_LOCKED / 其他错误
          if (res.error?.includes('仅限指定客户') || res.error?.includes('LOCKED')) {
            setIsLocked(true)
            Taro.showModal({
              title: '访问受限',
              content: '此链接仅限指定客户访问，您无法查看。',
              showCancel: false,
              success: () => Taro.navigateBack(),
            })
          } else {
            Taro.showToast({ title: res.error || '获取内容失败', icon: 'none' })
          }
          return
        }

        const { items, expired, allowCustomerShare: canReshare } = res.data

        if (expired) {
          setIsExpired(true)
          Taro.showModal({
            title: '链接已过期',
            content: '此分享链接已过期，无法继续查看。',
            showCancel: false,
            success: () => Taro.navigateBack(),
          })
          return
        }

        // 正常展示内容
        setShareItems(items || [])
        setAllowCustomerShare(canReshare || false)

        if (items?.length > 1) {
          setShareTitle('精选展厅合集')
          setShareDesc(`为您精选了 ${items.length} 项优质展示内容`)
          setShareImage(items[0]?.coverUrl || tenantLogo)
        } else if (items?.length === 1) {
          setShareTitle(items[0].title || '展厅分享')
          setShareDesc(items[0].description?.substring(0, 50) || '为你提供最专业的全屋定制与装修服务')
          setShareImage(items[0].coverUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Sales 设置模式：配置分享权限 ──
    const ids = params.ids ? params.ids.split(',') : (params.id ? [params.id] : [])
    setItemIds(ids)

    if (ids.length > 1) {
      setShareTitle('精选展厅合集')
      setShareDesc(`为您精选了 ${ids.length} 项优质展示内容，欢迎随邀品鉴`)
      setShareImage(tenantLogo)
    } else if (ids.length === 1) {
      try {
        const res = await api.get(`/showroom/items/${ids[0]}`).catch(() => ({ success: true, data: {} }))
        if (res.success) {
          setShareTitle(res.data?.title || '春晓雅筑现代极简全屋整装')
          setShareDesc(res.data?.description?.substring(0, 50) || '为你提供最专业的全屋定制与装修服务')
          setShareImage(res.data?.coverUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')
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

  // 微信转发
  const handleShareWx = () => {
    Taro.showToast({ title: '参数已保存，请点击右上角转发', icon: 'none' })
  }

  // 复制分享链接
  const handleCopyLink = async () => {
    const shareId = itemIds.join('-')
    await Taro.setClipboardData({ data: `https://l2c.asia/share/${shareId}?allowReshare=${allowCustomerShare}` })
    Taro.showToast({ title: '链接已复制', icon: 'success' })
  }

  // 锁定或过期状态不渲染内容
  if (isLocked || isExpired) {
    return (
      <View className='capsule-page'>
        <View className='error-state flex-center'>
          <Text className='error-icon'>{isLocked ? '🔒' : '⏰'}</Text>
          <Text className='error-text'>
            {isLocked ? '此链接仅限指定客户访问' : '此链接已过期'}
          </Text>
        </View>
      </View>
    )
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

          {/* 海报底部 */}
          <View className='poster-footer'>
            <View className='footer-text'>
              <Text className='slogan'>长按识别小程序码</Text>
              <Text className='slogan-sub'>查看更多精选好物与案例</Text>
            </View>
            <View className='qr-code'>
              <Image className='qr-img' src='https://images.unsplash.com/photo-1607519961633-1cebc784b069?w=150&q=80' mode='aspectFill' />
            </View>
          </View>
        </View>
      </View>

      {/* 客户浏览模式：素材列表 */}
      {mode === 'view' && shareItems.length > 0 && (
        <View className='share-items-list'>
          {shareItems.map((item) => (
            <View key={item.id} className='share-item-card'>
              {item.coverUrl && (
                <Image className='item-cover' src={item.coverUrl} mode='aspectFill' lazyLoad />
              )}
              <Text className='item-title'>{item.title}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sales 设置模式：分享操作区 */}
      {mode === 'share' && (
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
      )}

    </View>
  )
}
