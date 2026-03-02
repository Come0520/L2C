import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

const ROLE_OPTIONS = [
  { value: 'manager', label: '店长/管理员' },
  { value: 'sales', label: '销售顾问' },
  { value: 'worker', label: '装维技师' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', role: 'sales', tenantName: '' })
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.tenantName) {
      Taro.showToast({ title: '请填写全部必填信息', icon: 'none' }); return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/apply', { data: form })
      if (res.success) {
        Taro.navigateTo({ url: '/pages/status/index' })
      } else {
        Taro.showToast({ title: res.error || '申请失败', icon: 'none' })
      }
    } finally { setLoading(false) }
  }

  return (
    <View className='register-page'>
      <View className='page-header'>
        <Text className='page-title'>商家入驻</Text>
        <Text className='page-desc'>申请后等待系统审核，通过后即可登录 L2C 管控平台</Text>
      </View>

      <View className='form-group'>
        <View className='form-row'>
          <Text className='form-label'>姓名</Text>
          <Input className='form-input' placeholder='请输入真实姓名' placeholderClass='ph-color' value={form.name} onInput={update('name')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>手机号</Text>
          <Input className='form-input' type='number' maxlength={11} placeholder='作为登录账号' placeholderClass='ph-color' value={form.phone} onInput={update('phone')} />
        </View>
        <View className='form-divider' />
        <View className='form-row'>
          <Text className='form-label'>归属组织</Text>
          <Input className='form-input' placeholder='请输入您的门店或公司名称' placeholderClass='ph-color' value={form.tenantName} onInput={update('tenantName')} />
        </View>
      </View>
      <View className='form-group-title'><Text>担任角色</Text></View>
      <View className='form-group role-group'>
        {ROLE_OPTIONS.map((r, index) => (
          <View key={r.value} className='role-row' onClick={() => setForm((p) => ({ ...p, role: r.value }))}>
            <Text className='role-label'>{r.label}</Text>
            {form.role === r.value && <Text className='role-check'>✓</Text>}
            {index < ROLE_OPTIONS.length - 1 && <View className='form-divider' />}
          </View>
        ))}
      </View>

      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>
          提交申请
        </Button>
      </View>
    </View>
  )
}
