/**
 * 报修申请页
 */
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function ServiceApplyPage() {
  const [form, setForm] = useState({ orderNo: '', description: '', phone: '' })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [field]: e.detail.value }))

  const addImage = () => {
    Taro.chooseImage({
      count: 9 - images.length, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => setImages((prev) => [...prev, ...res.tempFilePaths].slice(0, 9)),
    })
  }

  const handleSubmit = async () => {
    if (!form.description) { Taro.showToast({ title: '请描述问题', icon: 'none' }); return }
    setLoading(true)
    try {
      const res = await api.post('/service/apply', { data: { ...form, images } })
      if (res.success) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else { Taro.showToast({ title: res.error || '提交失败', icon: 'none' }) }
    } finally { setLoading(false) }
  }

  return (
    <View className='create-page'>
      <View className='form-section'><Text className='form-label'>订单编号（可选）</Text>
        <Input className='form-input' placeholder='关联的订单编号' value={form.orderNo} onInput={update('orderNo')} /></View>
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
