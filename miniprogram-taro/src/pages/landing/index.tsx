/**
 * 引导/落地页 — 「两张脸」动态模式
 *
 * @description 根据启动参数自动切换：
 * - 无 tenantCode → L2C 官方推广页（吸引行业内注册）
 * - 有 tenantCode → 租户品牌专属落地页（商家获客工具，L2C 隐形）
 *
 * 参数传递：
 * - 分享卡片：path 携带 ?tc=CODE
 * - 小程序码：scene 携带 tc=CODE
 */
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useTenantLandingStore } from '@/stores/tenant-landing'
import './index.scss'

export default function LandingPage() {
  const { isLoggedIn, currentRole } = useAuthStore()
  const { profile, loading, fetchProfile, tenantCode } = useTenantLandingStore()
  /** 是否为租户模式（有有效的租户公开信息） */
  const isTenantMode = !!profile && !!tenantCode

  /**
   * 解析启动参数，提取 tenantCode
   * - 分享卡片：options.tc
   * - 小程序码扫码：options.scene（需 decodeURIComponent 解析）
   */
  useLoad((options) => {
    let code = options?.tc || ''

    // 小程序码的 scene 参数解析（格式：tc=CODE）
    if (!code && options?.scene) {
      const decoded = decodeURIComponent(options.scene)
      const match = decoded.match(/tc=([^&]+)/)
      if (match) {
        code = match[1]
      }
    }

    if (code) {
      fetchProfile(code)
    }
  })

  // 配置分享功能（仅租户模式下生效）
  useShareAppMessage(() => {
    if (isTenantMode && profile) {
      return {
        title: `${profile.name}${profile.slogan ? ' — ' + profile.slogan : ''}`,
        path: `/pages/landing/index?tc=${tenantCode}`,
        imageUrl: profile.landingCoverUrl || profile.logoUrl || '',
      }
    }
    return {
      title: 'L2C 窗帘全流程管理大师',
      path: '/pages/landing/index',
    }
  })

  // ========== 导航方法 ==========
  const goLogin = () => {
    console.log('[Landing] 点击登录')
    Taro.navigateTo({ url: '/pages/login/index' })
  }
  const goRegister = () => {
    console.log('[Landing] 点击申请入驻')
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  /** 复制 Web 管理端链接 */
  const openWebAdmin = () => {
    const ADMIN_URL = process.env.TARO_APP_WEB_URL || 'https://l2c.example.com'
    Taro.setClipboardData({ data: ADMIN_URL }).then(() => {
      Taro.showToast({ title: 'Web 端链接已复制', icon: 'success' })
    })
  }

  /** 一键拨打电话 */
  const callPhone = useCallback(() => {
    if (profile?.phone) {
      Taro.makePhoneCall({ phoneNumber: profile.phone })
    }
  }, [profile?.phone])

  /** 预约上门 — 跳转到预约表单页 */
  const goBooking = useCallback(() => {
    Taro.navigateTo({
      url: `/pages/landing/booking/index?tc=${tenantCode}`
    })
  }, [tenantCode])

  // ========== 加载中骨架屏 ==========
  if (loading) {
    return (
      <View className='landing-page landing-loading'>
        <View className='skeleton-circle' />
        <View className='skeleton-line skeleton-title' />
        <View className='skeleton-line skeleton-subtitle' />
      </View>
    )
  }

  // ========== 租户品牌落地页 ==========
  if (isTenantMode && profile) {
    return (
      <View className='landing-page tenant-landing'>
        {/* Hero 区域 */}
        <View
          className='tenant-hero'
          style={profile.landingCoverUrl
            ? { backgroundImage: `url(${profile.landingCoverUrl})` }
            : undefined
          }
        >
          {profile.logoUrl && (
            <Image
              className='tenant-logo'
              src={profile.logoUrl}
              mode='aspectFit'
            />
          )}
          <Text className='tenant-name'>{profile.name}</Text>
          {profile.slogan && (
            <Text className='tenant-slogan'>{profile.slogan}</Text>
          )}
        </View>

        {/* 信息卡片 */}
        {(profile.detailAddress || profile.region || profile.phone) && (
          <View className='tenant-info card'>
            {(profile.detailAddress || profile.region) && (
              <View className='info-row'>
                <Text className='info-icon'>📍</Text>
                <Text className='info-text'>
                  {profile.region}{profile.detailAddress ? ` ${profile.detailAddress}` : ''}
                </Text>
              </View>
            )}
            {profile.phone && (
              <View className='info-row' onClick={callPhone}>
                <Text className='info-icon'>📞</Text>
                <Text className='info-text info-phone'>{profile.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* CTA 按钮区域 */}
        <View className='tenant-actions'>
          <Button className='btn-primary' onClick={goBooking}>
            📐 预约上门量窗
          </Button>
          {profile.phone && (
            <Button className='btn-call' onClick={callPhone}>
              📞 立即拨打
            </Button>
          )}
          {profile.contactWechat && (
            <Button className='btn-wechat' openType='contact'>
              💬 微信联系销售
            </Button>
          )}
        </View>
      </View>
    )
  }

  // ========== L2C 官方推广页（默认） ==========
  return (
    <View className='landing-page'>
      <View className='landing-hero'>
        <Text className='hero-logo'>L2C</Text>
        <Text className='hero-title'>窗帘全流程管理大师</Text>
        <Text className='hero-desc'>从线索到安装，全链路数字化管理</Text>
      </View>

      <View className='landing-actions'>
        {!isLoggedIn ? (
          <View>
            <Button className='apple-btn-primary' onClick={goLogin}>立即登录</Button>
            <View style={{ height: 16 }} />
            <Button className='apple-btn-secondary' onClick={goRegister}>申请入驻</Button>
          </View>
        ) : (
          <View>
            <Text className='already-login'>已登录为 {currentRole}</Text>
            <Button className='apple-btn-secondary' onClick={openWebAdmin}>
              💻 复制 Web 管理端链接
            </Button>
          </View>
        )}
      </View>

      <View className='features'>
        {[
          { icon: '📋', title: '线索管理', desc: '录入、分配、跟进全流程' },
          { icon: '📄', title: '快速报价', desc: '按房间和产品自动计算' },
          { icon: '📐', title: '量尺调度', desc: '工人接单，客户实时确认' },
          { icon: '🏠', title: '云展厅', desc: '一键分享产品给客户浏览' },
        ].map((f) => (
          <View key={f.title} className='feature-item'>
            <View className='feature-icon-wrap'>
              <Text className='feature-icon'>{f.icon}</Text>
            </View>
            <Text className='feature-title'>{f.title}</Text>
            <Text className='feature-desc'>{f.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
