/**
 * 报价单详情页（含 Sales 快捷编辑）
 *
 * @description 核心功能：查看报价单详情。
 * Sales 角色底部显示「快捷编辑」按钮（改单价/改数量/替换商品/删除商品）。
 * 保存后触发重新计算总价并同步服务端。
 */
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

interface QuoteItem {
  id: string
  productName: string
  roomName: string
  width: number
  height: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface QuoteDetail {
  id: string
  quoteNo: string
  customerName: string
  customerPhone: string
  address: string
  status: string
  statusText: string
  totalAmount: number
  createdAt: string
  items: QuoteItem[]
  rooms: Array<{ id: string; name: string }>
}

export default function QuoteDetailPage() {
  const { currentRole } = useAuthStore()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const isSales = currentRole === 'sales'

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/quotes/${id}`)
      if (res.success) setQuote(res.data)
    } finally {
      setLoading(false)
    }
  })

  if (loading) {
    return <View className='page flex-center'><Text>加载中...</Text></View>
  }

  if (!quote) {
    return <View className='page flex-center'><Text>报价单不存在</Text></View>
  }

  return (
    <View className='quote-detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        {/* 报价单头部 */}
        <View className='detail-header card'>
          <View className='flex-between'>
            <Text className='quote-no'>{quote.quoteNo}</Text>
            <Text className='quote-status'>{quote.statusText}</Text>
          </View>
          <Text className='customer-name'>{quote.customerName}</Text>
          <Text className='customer-phone'>{quote.customerPhone}</Text>
          {quote.address && <Text className='quote-address'>{quote.address}</Text>}
          <Text className='quote-date'>{quote.createdAt}</Text>
        </View>

        {/* 商品明细 */}
        <View className='items-section'>
          <Text className='section-title'>商品明细</Text>
          {quote.rooms.map((room) => {
            const roomItems = quote.items.filter((i) =>
              quote.items.some((item) => item.roomName === room.name)
            )
            return (
              <View key={room.id} className='room-group'>
                <Text className='room-name'>📐 {room.name}</Text>
                {quote.items
                  .filter((i) => i.roomName === room.name)
                  .map((item) => (
                    <View key={item.id} className='item-row card'>
                      <Text className='item-name'>{item.productName}</Text>
                      <View className='item-spec'>
                        <Text>{item.width}m × {item.height}m</Text>
                        <Text> × {item.quantity}</Text>
                      </View>
                      <View className='flex-between'>
                        <Text className='item-unit-price'>单价 ¥{item.unitPrice}</Text>
                        <Text className='item-total'>¥{item.totalPrice.toLocaleString()}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )
          })}
        </View>

        {/* 总计 */}
        <View className='total-bar card'>
          <Text className='total-label'>总计</Text>
          <Text className='total-amount'>¥{quote.totalAmount.toLocaleString()}</Text>
        </View>

        {/* 底部 Sales 快捷编辑 */}
        {isSales && !editMode && (
          <View className='edit-hint'>
            <Text>Sales 模式：</Text>
            <View
              className='btn-edit-mode'
              onClick={() => Taro.navigateTo({
                url: `/pages/quotes/product-selector/index?quoteId=${quote.id}`,
              })}
            >
              <Text>快捷编辑</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
