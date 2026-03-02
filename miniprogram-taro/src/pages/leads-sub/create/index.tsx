/**
 * 线索创建页
 */
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function LeadsCreatePage() {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    source: '',
    address: '',
    remark: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.customerName || !form.phone) {
      Taro.showToast({ title: '请填写客户姓名和手机号', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/leads', { data: form })
      if (res.success) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.error || '创建失败', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  return (
    <View className='create-page'>
      <View className='form-section'>
        <Text className='form-label'>客户姓名 *</Text>
        <Input className='form-input' placeholder='请输入' value={form.customerName} onInput={update('customerName')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>手机号 *</Text>
        <Input className='form-input' type='number' maxlength={11} placeholder='请输入' value={form.phone} onInput={update('phone')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>来源渠道</Text>
        <Input className='form-input' placeholder='如：门店到访、朋友介绍' value={form.source} onInput={update('source')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>地址</Text>
        <Input className='form-input' placeholder='客户地址' value={form.address} onInput={update('address')} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>备注</Text>
        <Textarea className='form-textarea' placeholder='备注信息' value={form.remark} onInput={update('remark')} />
      </View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>
          提交线索
        </Button>
      </View>
    </View>
  )
}
