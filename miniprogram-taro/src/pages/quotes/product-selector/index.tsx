/**
 * 商品选择器页（报价创建流程中使用）
 */
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface Product { id: string; name: string; category: string; price: number; unit: string; image: string }

export default function ProductSelectorPage() {
  const [quoteId, setQuoteId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useLoad(async (params) => {
    setQuoteId(params.quoteId || '')
    try {
      const res = await api.get('/products', { data: { pageSize: 100 } })
      if (res.success) setProducts(res.data.items || [])
    } finally { setLoading(false) }
  })

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const confirmSelection = async () => {
    if (selected.size === 0) {
      Taro.showToast({ title: '请至少选择一个商品', icon: 'none' }); return
    }
    Taro.showLoading({ title: '添加中...' })
    try {
      const res = await api.post(`/quotes/${quoteId}/items`, {
        data: { productIds: Array.from(selected) },
      })
      if (res.success) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } finally { Taro.hideLoading() }
  }

  const filtered = keyword
    ? products.filter((p) => p.name.includes(keyword) || p.category.includes(keyword))
    : products

  return (
    <View className='selector-page'>
      <View className='search-bar'>
        <Input className='search-input' placeholder='搜索商品' value={keyword}
          onInput={(e) => setKeyword(e.detail.value)} />
      </View>
      <ScrollView className='product-list' scrollY enhanced showScrollbar={false}>
        {filtered.map((p) => (
          <View key={p.id} className={`product-card card ${selected.has(p.id) ? 'product-card--selected' : ''}`}
            onClick={() => toggleProduct(p.id)}>
            {p.image && <Image className='product-img' src={p.image} mode='aspectFill' />}
            <View className='product-info'>
              <Text className='product-name'>{p.name}</Text>
              <Text className='product-category'>{p.category}</Text>
              <Text className='product-price'>¥{p.price}/{p.unit}</Text>
            </View>
            <View className='check-mark'>{selected.has(p.id) ? '✅' : '⬜'}</View>
          </View>
        ))}
      </ScrollView>
      {selected.size > 0 && (
        <View className='confirm-bar'>
          <Text className='selected-count'>已选 {selected.size} 件</Text>
          <View className='btn-confirm' onClick={confirmSelection}><Text>确认添加</Text></View>
        </View>
      )}
    </View>
  )
}
