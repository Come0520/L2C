/**
 * 报价创建向导页（简化入口）
 *
 * @description 先选客户，再进入商品选择器组成报价。
 * 完整创建建议导流至 Web 端，此处为移动端快速报价入口。
 */
import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

export default function QuoteCreatePage() {
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useLoad((params) => {
    // 从线索/CRM 页跳过来时携带 customerId
    if (params.customerId) setCustomerId(params.customerId)
  })

  const handleCreate = async () => {
    if (!customerName && !customerId) {
      Taro.showToast({ title: '请填写客户信息', icon: 'none' }); return
    }
    setLoading(true)
    try {
      const res = await api.post('/quotes', {
        data: { customerId: customerId || undefined, customerName, phone, address },
      })
      if (res.success) {
        Taro.showToast({ title: '报价单已创建', icon: 'success' })
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/quotes/product-selector/index?quoteId=${res.data.id}` })
        }, 1000)
      } else {
        Taro.showToast({ title: res.error || '创建失败', icon: 'none' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='create-page'>
      <View className='form-section'>
        <Text className='form-label'>客户姓名</Text>
        <Input className='form-input' placeholder='请输入' value={customerName}
          onInput={(e) => setCustomerName(e.detail.value)} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>联系电话</Text>
        <Input className='form-input' type='number' maxlength={11} placeholder='请输入'
          value={phone} onInput={(e) => setPhone(e.detail.value)} />
      </View>
      <View className='form-section'>
        <Text className='form-label'>安装地址</Text>
        <Input className='form-input' placeholder='小区名、门牌号' value={address}
          onInput={(e) => setAddress(e.detail.value)} />
      </View>
      <View className='hint-card card'>
        <Text className='hint-text'>💡 创建后进入商品选择，可添加多个房间和产品。复杂报价建议使用 Web 端完整版。</Text>
      </View>
      <View className='form-footer'>
        <Button className='btn-submit' loading={loading} disabled={loading} onClick={handleCreate}>
          下一步：选择商品
        </Button>
      </View>
    </View>
  )
}
