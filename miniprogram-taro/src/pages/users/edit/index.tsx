/**
 * 编辑个人资料页
 */
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

export default function UserEditPage() {
  const { userInfo, setUserInfo } = useAuthStore()
  const [form, setForm] = useState({
    name: userInfo?.name || '',
    phone: userInfo?.phone || '',
    avatar: userInfo?.avatar || '',
  })
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => setForm((p) => ({ ...p, avatar: res.tempFilePaths[0] })),
    })
  }

  const handleSubmit = async () => {
    if (!form.name) { Taro.showToast({ title: '请填写姓名', icon: 'none' }); return }
    setLoading(true)
    try {
      const res = await api.put('/users/profile', { data: form })
      if (res.success) {
        setUserInfo({ ...userInfo, ...form })
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.error || '保存失败', icon: 'none' })
      }
    } finally { setLoading(false) }
  }

  return (
    <View className='edit-page'>
      <View className='avatar-section' onClick={handleChooseAvatar}>
        {form.avatar ? (
          <Image className='avatar-img' src={form.avatar} mode='aspectFill' />
        ) : (
          <View className='avatar-placeholder'><Text>📷</Text></View>
        )}
        <Text className='avatar-hint'>点击更换头像</Text>
      </View>
      <View className='form-section'><Text className='form-label'>姓名</Text>
        <Input className='form-input' placeholder='请输入' value={form.name} onInput={update('name')} /></View>
      <View className='form-section'><Text className='form-label'>手机号</Text>
        <Input className='form-input' type='number' maxlength={11} placeholder='请输入' value={form.phone} onInput={update('phone')} /></View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>保存</Button>
      </View>
    </View>
  )
}
