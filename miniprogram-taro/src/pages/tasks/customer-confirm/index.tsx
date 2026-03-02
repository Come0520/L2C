/**
 * 客户确认 — 重定向到分包页面
 */
import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function RedirectPage() {
  useLoad((params) => {
    const query = Object.entries(params).map(([k, v]) => k + '=' + v).join('&')
    const url = '/pages/tasks-sub/customer-confirm/index' + (query ? '?' + query : '')
    Taro.redirectTo({ url })
  })
  return <View className='page flex-center'><Text>跳转中...</Text></View>
}
