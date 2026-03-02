/**
 * 租户收款设置页
 */
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function PaymentSettingsPage() {
  const [form, setForm] = useState({
    bankName: '', accountName: '', accountNo: '', wechatPayId: '',
  })
  const [loading, setLoading] = useState(false)

  useDidShow(async () => {
    try {
      const res = await api.get('/tenant/payment-settings')
      if (res.success && res.data) setForm(res.data)
    } catch (_) { }
  })

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await api.put('/tenant/payment-settings', { data: form })
      if (res.success) Taro.showToast({ title: '保存成功', icon: 'success' })
      else Taro.showToast({ title: res.error || '保存失败', icon: 'none' })
    } finally { setLoading(false) }
  }

  return (
    <View className='create-page'>
      <Text className='page-hint'>配置门店的收款信息，用于订单收款</Text>
      <View className='form-section'><Text className='form-label'>开户银行</Text>
        <Input className='form-input' placeholder='如：中国银行' value={form.bankName} onInput={update('bankName')} /></View>
      <View className='form-section'><Text className='form-label'>户名</Text>
        <Input className='form-input' placeholder='收款人姓名' value={form.accountName} onInput={update('accountName')} /></View>
      <View className='form-section'><Text className='form-label'>银行账号</Text>
        <Input className='form-input' type='number' placeholder='银行卡号' value={form.accountNo} onInput={update('accountNo')} /></View>
      <View className='form-section'><Text className='form-label'>微信支付商户号（可选）</Text>
        <Input className='form-input' placeholder='微信商户号' value={form.wechatPayId} onInput={update('wechatPayId')} /></View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSave}>保存设置</Button>
      </View>
    </View>
  )
}
