/**
 * 我的（个人中心）— 全角色共享 TabBar 页（槽位 4）
 *
 * @description 按角色显示差异化内容：
 * - Manager：个人设置、切换 Web 端入口
 * - Sales：个人业绩、设置
 * - Worker：收益结算（历史明细）、个人设置
 * - Customer：我的订单（含报修入口）、积分 & VIP、收货地址
 */
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore, ROLE_HOME } from '@/stores/auth'
import TabBar from '@/components/TabBar/index'
import './index.scss'

/** 菜单项定义 */
interface MenuItem {
  icon: string
  label: string
  path: string
  /** 仅指定角色可见 */
  roles?: string[]
}

/** 全部菜单项 */
const MENU_ITEMS: MenuItem[] = [
  // Worker 专属
  { icon: '💰', label: '收益结算', path: '/pages/workbench-sub/engineer/index', roles: ['worker'] },
  // Customer 专属
  { icon: '📦', label: '我的订单', path: '/pages/orders/index', roles: ['customer'] },
  { icon: '🔧', label: '报修服务', path: '/pages/service/list/index', roles: ['customer'] },
  // Sales 专属
  { icon: '🏆', label: '个人业绩', path: '/pages/reports/index', roles: ['sales'] },
  // Manager 专属
  { icon: '💻', label: '前往 Web 管理端', path: '/pages/landing/index', roles: ['manager', 'admin'] },
  { icon: '🎯', label: '销售目标', path: '/pages/manager/targets/index', roles: ['manager', 'admin'] },
  // 全角色
  { icon: '✏️', label: '编辑资料', path: '/pages/users/edit/index' },
  { icon: '👥', label: '邀请同事', path: '/pages/invite/index', roles: ['manager', 'admin', 'sales'] },
  { icon: '⚙️', label: '租户设置', path: '/pages/tenant/payment-settings/index', roles: ['manager', 'admin'] },
]

export default function ProfilePage() {
  const { userInfo, currentRole, logout } = useAuthStore()

  /** 过滤出当前角色可见的菜单 */
  const visibleMenus = MENU_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  )

  const roleLabel: Record<string, string> = {
    manager: '管理员',
    admin: '超级管理员',
    sales: '销售顾问',
    worker: '安装工/测量师',
    customer: '客户',
    guest: '游客',
  }

  /** 退出登录 */
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      confirmText: '退出',
      confirmColor: '#F56C6C',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  return (
    <View className='profile-page'>
      {/* 个人信息卡片 */}
      <View className='profile-card'>
        <View className='avatar-wrap'>
          {userInfo?.avatarUrl ? (
            <Image className='avatar' src={userInfo.avatarUrl} mode='aspectFill' />
          ) : (
            <View className='avatar avatar--default'>
              <Text>{(userInfo?.name || '?')[0]}</Text>
            </View>
          )}
        </View>
        <View className='profile-info'>
          <Text className='profile-name'>{userInfo?.name || '未登录'}</Text>
          <Text className='profile-role'>{roleLabel[currentRole] || currentRole}</Text>
          {userInfo?.tenantName && (
            <Text className='profile-tenant'>{userInfo.tenantName}</Text>
          )}
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        {visibleMenus.map((item) => (
          <View
            key={item.path}
            className='menu-item'
            onClick={() => Taro.navigateTo({ url: item.path })}
          >
            <Text className='menu-icon'>{item.icon}</Text>
            <Text className='menu-label'>{item.label}</Text>
            <Text className='menu-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      <View className='logout-section'>
        <View className='logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>

      <TabBar selected='/pages/users/profile/index' />
    </View>
  )
}
