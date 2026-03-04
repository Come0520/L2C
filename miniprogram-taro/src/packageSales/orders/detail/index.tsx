/**
 * 订单详情页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

interface OrderItem { id: string; productName: string; roomName: string; quantity: number; unitPrice: number; totalPrice: number }
interface OrderDetail {
  id: string; orderNo: string; customerName: string; customerPhone: string; address: string
  status: string; statusText: string; totalAmount: number; paidAmount: number
  createdAt: string; items: OrderItem[]; assigneeName: string
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/orders/${id}`)
      if (res.success) setOrder(res.data)
    } finally {
      setLoading(false)
    }
  })

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!order) return <View className='page flex-center'><Text>订单不存在</Text></View>

  return (
    <View className='detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        {/* 订单头部 */}
        <View className='info-card card'>
          <View className='flex-between'>
            <Text className='order-no'>{order.orderNo}</Text>
            <Text className='order-status'>{order.statusText}</Text>
          </View>
          <Text className='customer-name'>{order.customerName}</Text>
          <Text className='customer-phone'>{order.customerPhone}</Text>
          {order.address && <Text className='order-address'>{order.address}</Text>}
          {order.assigneeName && <View className='info-row'><Text className='info-label'>负责人</Text><Text className='info-value'>{order.assigneeName}</Text></View>}
          <Text className='order-date'>{order.createdAt}</Text>
        </View>

        {/* 商品明细 */}
        <View className='items-section'>
          <Text className='section-title'>商品明细</Text>
          {order.items?.map((item) => (
            <View key={item.id} className='item-row card'>
              <Text className='item-name'>{item.productName}</Text>
              <Text className='item-room'>{item.roomName}</Text>
              <View className='flex-between'>
                <Text className='item-qty'>× {item.quantity}</Text>
                <Text className='item-total'>¥{item.totalPrice.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 金额 */}
        <View className='total-bar card'>
          <View className='flex-between'><Text>订单总额</Text><Text className='total-amount'>¥{order.totalAmount?.toLocaleString()}</Text></View>
          <View className='flex-between'><Text>已付金额</Text><Text className='paid-amount'>¥{order.paidAmount?.toLocaleString()}</Text></View>
        </View>
      </ScrollView>
    </View>
  )
}
