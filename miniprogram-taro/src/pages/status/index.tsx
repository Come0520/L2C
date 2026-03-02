/**
 * 审核状态页
 */
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

export default function StatusPage() {
  const { userInfo, logout } = useAuthStore()
  const status = userInfo?.tenantStatus || 'pending'

  const statusConfig: Record<string, { icon: string; title: string; desc: string; color: string }> = {
    pending: { icon: '⏳', title: '等待审核', desc: '您的申请已提交，请等待管理员审核。审核通过后您将收到通知。', color: '#E6A23C' },
    approved: { icon: '✅', title: '审核通过', desc: '您的账号已激活，请返回登录。', color: '#67C23A' },
    rejected: { icon: '❌', title: '审核未通过', desc: '申请未通过，请联系管理员了解详情。', color: '#F56C6C' },
  }

  const cfg = statusConfig[status] || statusConfig.pending

  return (
    <View className='status-page'>
      <View className='status-card'>
        <Text className='status-icon'>{cfg.icon}</Text>
        <Text className='status-title' style={{ color: cfg.color }}>{cfg.title}</Text>
        <Text className='status-desc'>{cfg.desc}</Text>
        {userInfo?.tenantName && <Text className='tenant-name'>门店：{userInfo.tenantName}</Text>}
      </View>
      <View className='status-actions'>
        {status === 'approved' ? (
          <Button className='btn-primary' onClick={() => Taro.reLaunch({ url: '/pages/login/index' })}>去登录</Button>
        ) : (
          <Button className='btn-secondary' onClick={() => { logout(); Taro.reLaunch({ url: '/pages/login/index' }) }}>返回登录</Button>
        )}
      </View>
    </View>
  )
}
