/**
 * 报价创建向导页（简化入口）
 *
 * @description 先选客户，再进入商品选择器组成报价。
 * 完整创建建议导流至 Web 端，此处为移动端快速报价入口。
 */
import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import CustomerSelector from './components/CustomerSelector'
import './index.scss'

export default function QuoteCreatePage() {
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)

  // 处理选择器选中的客户
  const handleCustomerSelect = (customer: any) => {
    setCustomerId(customer.id)
    setCustomerName(customer.name)
  }

  useLoad((params) => {
    // 从线索/CRM 页跳过来时携带 customerId
    if (params.customerId) {
      setCustomerId(params.customerId)
      setCustomerName(params.customerName || '关联客户')
    }
  })

  const handleCreate = async () => {
    if (!customerId) {
      Taro.showToast({ title: '请先选择客户', icon: 'none' }); return
    }
    setLoading(true)
    try {
      const res = await api.post('/quotes', {
        data: { customerId: customerId },
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
        <Text className='form-label'>客户选择 *</Text>
        <CustomerSelector
          value={customerId}
          name={customerName}
          onChange={handleCustomerSelect}
        />
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
