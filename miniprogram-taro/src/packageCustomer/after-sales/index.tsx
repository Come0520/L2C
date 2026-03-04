import { View, Text, Input, Textarea, Button, Image, Picker, ScrollView } from '@tarojs/components'
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

export default function AfterSalesPage() {
  const [form, setForm] = useState({ orderId: '', description: '', phone: '', type: '' })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleTypeChange = (e: any) => {
    setForm((prev) => ({ ...prev, type: SERVICE_TYPES[e.detail.value].value }))
  }

  const addImage = () => {
    Taro.chooseMedia({
      count: 9 - images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPaths = res.tempFiles.map(f => f.tempFilePath)
        setImages((prev) => [...prev, ...tempPaths].slice(0, 9))
      }
    })
  }

  const handleRemovePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.type) { Taro.showToast({ title: '请选择售后类型', icon: 'none' }); return }
    if (!form.orderId.trim()) { Taro.showToast({ title: '请输入关联订单号', icon: 'none' }); return }
    if (!isNotEmpty(form.description)) { Taro.showToast({ title: '请填写完善的问题描述', icon: 'none' }); return }
    if (form.phone && !isValidPhone(form.phone)) {
      Taro.showToast({ title: '电话格式不正确', icon: 'none' }); return
    }

    setLoading(true)
    try {
      let uploadedUrls: string[] = []
      // 1. 上传图片附件
      if (images.length > 0) {
        Taro.showLoading({ title: '上传图片...', mask: true })
        const uploadTasks = images.map(path => api.upload('/upload', path, 'file'))
        const results = await Promise.all(uploadTasks)
        uploadedUrls = results.map(res => res.data?.url).filter(Boolean) as string[]
      }

      Taro.showLoading({ title: '提交申请...', mask: true })
      // 2. 提交工单
      const res = await api.post('/service/tickets', {
        data: {
          orderId: form.orderId,
          type: form.type,
          description: form.description + (form.phone ? `\n\n联系电话: ${form.phone}` : ''),
          photos: uploadedUrls
        }
      })

      Taro.hideLoading()
      if (res.success || typeof res.success === 'undefined') {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.error || '提交失败', icon: 'none' })
      }
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err.message || '网络请求失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const currentTypeLabel = SERVICE_TYPES.find(t => t.value === form.type)?.label || '请选择问题类型'

  return (
    <View className="after-sales-page">
      <ScrollView scrollY className="content-scroll">
        <View className="page-header">
          <Text className="title">申请售后服务</Text>
          <Text className="subtitle">我们将尽快为您解决问题</Text>
        </View>

        <View className="section-card">
          <View className="form-item">
            <Text className="label">服务类型<Text className="required">*</Text></Text>
            <Picker mode="selector" range={SERVICE_TYPES} rangeKey="label" onChange={handleTypeChange}>
              <View className={`picker-value ${!form.type ? 'placeholder' : ''}`}>
                <Text>{currentTypeLabel}</Text>
                <Text className="arrow">{'>'}</Text>
              </View>
            </Picker>
          </View>

          <View className="form-item">
            <Text className="label">关联订单<Text className="required">*</Text></Text>
            <Input
              className="input-field"
              placeholder="请输入相关订单号"
              value={form.orderId}
              onInput={(e) => update('orderId')(e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="label">联系电话</Text>
            <Input
              className="input-field"
              type="number"
              maxlength={11}
              placeholder="请输入您的手机号"
              value={form.phone}
              onInput={(e) => update('phone')(e.detail.value)}
            />
          </View>
        </View>

        <View className="section-card">
          <Text className="section-title">问题描述<Text className="required">*</Text></Text>
          <View className="textarea-wrapper">
            <Textarea
              className="desc-textarea"
              placeholder="请详细描述您遇到的问题，以便我们更好地为您服务..."
              value={form.description}
              onInput={(e) => update('description')(e.detail.value)}
              maxlength={500}
            />
            <Text className="word-count">{form.description.length}/500</Text>
          </View>
        </View>

        <View className="section-card photo-section">
          <Text className="section-title">上传照片 ({images.length}/9)</Text>
          <View className="photo-grid">
            {images.map((img, idx) => (
              <View key={idx} className="photo-item">
                <Image className="img" src={img} mode="aspectFill" />
                <View className="remove-btn" onClick={() => handleRemovePhoto(idx)}>✕</View>
              </View>
            ))}
            {images.length < 9 && (
              <View className="upload-btn" onClick={addImage}>
                <Text className="plus">+</Text>
                <Text className="tip">添加照片</Text>
              </View>
            )}
          </View>
        </View>

        <View className="safe-area-bottom" />
      </ScrollView>

      <View className="bottom-action-bar">
        <Button
          className="btn-primary"
          loading={loading}
          disabled={loading || !form.type || form.description.length === 0 || !form.orderId.trim()}
          onClick={handleSubmit}
        >
          提交申请
        </Button>
      </View>
    </View>
  )
}
