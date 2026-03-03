import { View, Text, Input, Textarea, Button, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { isNotEmpty, isValidPhone } from '@/utils/validate'
import './index.scss'

const SERVICE_TYPES = [
  { label: '维修', value: 'REPAIR' },
  { label: '退货', value: 'RETURN' },
  { label: '换货', value: 'EXCHANGE' },
  { label: '投诉', value: 'COMPLAINT' },
  { label: '咨询', value: 'CONSULTATION' }
]

export default function ServiceApplyPage() {
  const [form, setForm] = useState({ orderId: '', description: '', phone: '', type: '' })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const handleTypeChange = (e: any) => {
    setForm((prev) => ({ ...prev, type: SERVICE_TYPES[e.detail.value].value }))
  }

  const addImage = () => {
    Taro.chooseImage({
      count: 9 - images.length, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => setImages((prev) => [...prev, ...res.tempFilePaths].slice(0, 9)),
    })
  }

  const handleSubmit = async () => {
    if (!form.type) { Taro.showToast({ title: '请选择售后类型', icon: 'none' }); return }
    if (!isNotEmpty(form.description)) { Taro.showToast({ title: '请填写完善的问题描述', icon: 'none' }); return }
    if (form.phone && !isValidPhone(form.phone)) {
      Taro.showToast({ title: '电话格式不正确', icon: 'none' }); return
    }
    // TODO: 目前 orderId 为手动输入，后续版本应提供关联订单选择器
    setLoading(true)
    try {
      // 修复 S-01 (orderNo -> orderId) 和 S-02 (补充 type)
      const res = await api.post('/service/apply', { data: { ...form, images } })
      if (res.success) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else { Taro.showToast({ title: res.error || '提交失败', icon: 'none' }) }
    } finally { setLoading(false) }
  }

  const currentTypeLabel = SERVICE_TYPES.find(t => t.value === form.type)?.label || '请选择'

  return (
    <View className='create-page'>
      <View className='form-section'>
        <Text className='form-label'>售后类型 *</Text>
        <Picker mode='selector' range={SERVICE_TYPES} rangeKey='label' onChange={handleTypeChange}>
          <View className={`picker-value ${!form.type ? 'placeholder' : ''}`}>
            {currentTypeLabel}
          </View>
        </Picker>
      </View>
      <View className='form-section'><Text className='form-label'>关联原单 ID（内部关联）</Text>
        <Input className='form-input' placeholder='订单号UUID(测试期手填)' value={form.orderId} onInput={update('orderId')} /></View>
      <View className='form-section'><Text className='form-label'>联系电话</Text>
        <Input className='form-input' type='number' maxlength={11} placeholder='请输入' value={form.phone} onInput={update('phone')} /></View>
      <View className='form-section'><Text className='form-label'>问题描述 *</Text>
        <Textarea className='form-textarea' placeholder='请详细描述问题...' value={form.description} onInput={update('description')} maxlength={500} /></View>
      <View className='photo-section'>
        <Text className='form-label'>附图</Text>
        <View className='images-grid'>
          {images.map((img, i) => (<Image key={i} className='photo-thumb' src={img} mode='aspectFill' />))}
          {images.length < 9 && <View className='photo-add' onClick={addImage}><Text>📷</Text></View>}
        </View>
      </View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleSubmit}>提交报修</Button>
      </View>
    </View>
  )
}
