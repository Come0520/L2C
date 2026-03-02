/**
 * 邀请页 — 生成邀请链接/二维码
 */
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

export default function InvitePage() {
  const { userInfo } = useAuthStore()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const generateCode = async () => {
    setLoading(true)
    try {
      const res = await api.post('/invite/generate')
      if (res.success) setInviteCode(res.data.code || res.data.url || '')
    } finally { setLoading(false) }
  }

  const copyCode = async () => {
    if (!inviteCode) return
    await Taro.setClipboardData({ data: inviteCode })
    Taro.showToast({ title: '已复制', icon: 'success' })
  }

  return (
    <View className='invite-page'>
      <View className='invite-hero'>
        <Text className='hero-icon'>🎉</Text>
        <Text className='hero-title'>邀请同事加入</Text>
        <Text className='hero-desc'>邀请 Sales 或工程师加入您的团队</Text>
      </View>
      {!inviteCode ? (
        <Button className='btn-submit' loading={loading} onClick={generateCode}>生成邀请码</Button>
      ) : (
        <View className='code-section card'>
          <Text className='code-label'>邀请码</Text>
          <Text className='code-value'>{inviteCode}</Text>
          <Button className='btn-copy' onClick={copyCode}>复制邀请码</Button>
        </View>
      )}
    </View>
  )
}
