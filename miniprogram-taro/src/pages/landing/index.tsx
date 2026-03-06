/**
 * 引导/落地页 — 「两张脸」动态模式
 *
 * @description 根据启动参数和登录状态自动切换：
 *
 * 情况 1：有 tc 参数 + 租户为 Pro/Enterprise
 *   → 租户品牌专属落地页（商家获客工具，L2C 隐形）
 *
 * 情况 2：有 tc 参数 + 租户为 Base（或已过期/查不到）
 *   → 降级为 L2C 官方推广页
 *
 * 情况 3：无 tc 参数 + 用户已登录（Token 有效）
 *   → 自动静默跳转到角色对应首页，用户无感知
 *
 * 情况 4：无 tc 参数 + 用户未登录
 *   → L2C 官方推广页（含登录、申请入驻入口）
 *
 * 参数传递：
 * - 分享卡片：path 携带 ?tc=CODE
 * - 小程序码：scene 携带 tc=CODE
 */
import { View, Text, Image, Button, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useCallback } from 'react'
import { useAuthStore, ROLE_HOME, UserRole } from '@/stores/auth'
import { useTenantLandingStore } from '@/stores/tenant-landing'
import { danmakuItems, trustStats, testimonialItems, pricingPlans } from '@/constants/landing-data'
import './index.scss'

/**
 * ⚠️ 开发调试开关 — 上线前改为 false 即可隐藏角色切换面板
 */
const __DEV_ROLE_SWITCHER__ = false

/** 调试用：四大角色快速入口配置 */
const DEV_ROLES: { role: UserRole; label: string; icon: string; desc: string; color: string }[] = [
  { role: 'manager', label: '管理员', icon: '👔', desc: '审批 · 报表 · 全局管控', color: '#007AFF' },
  { role: 'sales', label: '销售顾问', icon: '💼', desc: '线索 · 报价 · 展厅 · 客户', color: '#34C759' },
  { role: 'worker', label: '安装工人', icon: '🔧', desc: '任务 · 量尺 · 进度反馈', color: '#FF9500' },
  { role: 'customer', label: '终端客户', icon: '🏠', desc: '展厅浏览 · 方案确认', color: '#AF52DE' },
]

export default function LandingPage() {
  const { profile, loading, fetchProfile, tenantCode } = useTenantLandingStore()

  /**
   * 是否显示租户品牌页：
   * 必须同时满足：有 tc 参数 + 有租户数据 + 套餐为 pro 或 enterprise
   */
  const isBrandMode =
    !!profile && !!tenantCode && (profile.planType === 'pro' || profile.planType === 'enterprise')

  /**
   * 解析启动参数，提取 tenantCode
   * 同时处理已登录用户的自动跳转
   */
  useLoad(async (options) => {
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
      // 有租户码：拉取租户信息，根据 planType 决定显示模式
      fetchProfile(code)
      return
    }

    // 无租户码：检查登录状态，已登录则自动跳转到角色首页
    // 注意：restoreAndVerify() 在 app.ts 中已发起，此处等待 store 状态完成
    // ⚠️ 开启角色切换面板时不自动跳转，方便调试
    if (__DEV_ROLE_SWITCHER__) return

    const authState = useAuthStore.getState()
    if (authState.isLoggedIn && authState.currentRole !== 'guest') {
      const roleKey = (authState.currentRole?.toLowerCase() as UserRole) || 'guest'
      const home = ROLE_HOME[roleKey] || '/pages/workbench/index'
      try {
        await Taro.switchTab({ url: home })
      } catch {
        // switchTab 失败时（如目标页不在 tabBar）改用 reLaunch
        await Taro.reLaunch({ url: home })
      }
    }
    // 未登录：正常渲染 L2C 推广页
  })

  // 配置分享功能（仅租户品牌模式下生效）
  useShareAppMessage(() => {
    if (isBrandMode && profile) {
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
    Taro.navigateTo({ url: '/pages/login/index' })
  }
  const goRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  /** 一键拨打电话 */
  const callPhone = useCallback(() => {
    if (profile?.phone) {
      Taro.makePhoneCall({ phoneNumber: profile.phone })
    }
  }, [profile])

  /** 预约上门 — 跳转到预约表单页 */
  const goBooking = useCallback(() => {
    Taro.navigateTo({
      url: `/pages/landing/booking/index?tc=${tenantCode}`
    })
  }, [tenantCode])

  /**
   * 调试用：切换角色并跳转到该角色首页
   * 已登录时保留真实 token，只切换角色，API 调用不会 401
   * 未登录时提示先登录
   */
  const switchToRole = useCallback((role: UserRole) => {
    const store = useAuthStore.getState()
    if (!store.isLoggedIn) {
      Taro.showToast({ title: '请先登录再切换角色', icon: 'none', duration: 2000 })
      return
    }

    // 保留真实 token，只切换角色
    store.updateRole(role)

    const home = ROLE_HOME[role] || '/pages/workbench/index'
    try {
      Taro.switchTab({ url: home })
    } catch {
      Taro.reLaunch({ url: home })
    }
  }, [])

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

  // ========== 租户品牌落地页（Pro/Enterprise 专属） ==========
  if (isBrandMode && profile) {
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

  // 获取当前登录状态（用于调试面板提示）
  const authState = useAuthStore.getState()

  // ========== L2C 官方推广页（默认/降级） ==========
  return (
    <View className='landing-page default-landing-page'>
      <View className='landing-hero'>
        <Text className='hero-logo'>让窗帘生意</Text>
        <Text className='hero-title-gradient'>回归简单</Text>
        <Text className='hero-desc'>从线索到收款，一站式管理</Text>
        <View className='landing-actions'>
          <Button className='btn-primary' onClick={goRegister}>免费开始</Button>
          <Button className='btn-secondary' onClick={goLogin}>老用户登录</Button>
        </View>
      </View>

      <View className='section pain-points'>
        <View className='section-header'>
          <Text className='section-title'>为什么选择 L2C？</Text>
          <Text className='section-desc'>告别传统手工账，数字化管理</Text>
        </View>
        <Swiper className='pain-swiper' vertical autoplay circular interval={2500} displayMultipleItems={3}>
          {danmakuItems.map(item => (
            <SwiperItem key={item.id}>
              <View className='pain-card'>
                <View className='pain-tag'>{item.category}</View>
                <Text className='pain-text'>"{item.pain}"</Text>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      <View className='section stats-wrapper'>
        <View className='stats-grid'>
          {trustStats.map(stat => (
            <View key={stat.label} className='stat-item'>
              <Text className='stat-value'>{stat.value}{stat.suffix}</Text>
              <Text className='stat-label'>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='section testimonials'>
        <View className='section-header'>
          <Text className='section-title'>同行都在用</Text>
          <Text className='section-desc'>听听大家的真实反馈</Text>
        </View>
        <ScrollView className='testimonials-scroll' scrollX>
          <View className='testimonials-list'>
            {testimonialItems.map(t => (
              <View key={t.id} className='testimonial-card'>
                <Text className='t-content'>"{t.content}"</Text>
                <View className='t-author'>
                  <View className='t-avatar' style={{ backgroundColor: t.avatarColor }}>
                    <Text>{t.author[0]}</Text>
                  </View>
                  <View className='t-info'>
                    <Text className='t-name'>{t.author}</Text>
                    <Text className='t-role'>{t.company} · {t.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className='section pricing'>
        <View className='section-header'>
          <Text className='section-title'>基础版永久免费</Text>
          <Text className='section-desc'>无隐藏费用，随时升级</Text>
        </View>
        <View className='pricing-cards'>
          {pricingPlans.map(plan => (
            <View key={plan.id} className={`pricing-card ${plan.highlighted ? 'highlight' : ''}`}>
              {plan.highlighted && <View className='p-badge'>推荐</View>}
              <Text className='p-name'>{plan.name}</Text>
              <Text className='p-price'>{plan.price}<Text className='p-period'>{plan.period}</Text></Text>
              <Text className='p-desc'>{plan.description}</Text>
              <View className='p-features'>
                {plan.features.slice(0, 4).map(f => (
                  <View key={f.text} className={`p-feature ${f.included ? 'included' : 'excluded'}`}>
                    <Text className={`f-icon ${f.included ? 'included' : 'excluded'}`}>{f.included ? '✓' : '○'}</Text>
                    <Text className='f-text'>{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ========== 🔧 调试面板：角色快速切换 ========== */}
      {__DEV_ROLE_SWITCHER__ && (
        <View className='dev-role-switcher'>
          <View className='dev-header'>
            <Text className='dev-badge'>🔧 DEV</Text>
            <Text className='dev-title'>角色体验入口</Text>
            {authState.isLoggedIn ? (
              <Text className='dev-hint dev-hint--ok'>
                ✅ 已登录：{authState.userInfo?.name} — 点击切换角色
              </Text>
            ) : (
              <Text className='dev-hint dev-hint--warn'>
                ⚠️ 请先点击上方「立即登录」，再回来切换角色
              </Text>
            )}
          </View>
          <View className='dev-roles'>
            {DEV_ROLES.map((item) => (
              <View
                key={item.role}
                className={`dev-role-card ${!authState.isLoggedIn ? 'dev-role-card--disabled' : ''}`}
                style={{ borderLeftColor: item.color }}
                onClick={() => switchToRole(item.role)}
              >
                <Text className='dev-role-icon'>{item.icon}</Text>
                <View className='dev-role-info'>
                  <Text className='dev-role-label'>{item.label}</Text>
                  <Text className='dev-role-desc'>{item.desc}</Text>
                </View>
                <Text className='dev-role-arrow'>›</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
