/**
 * 客户确认页 — 展示量尺结果供客户确认签字
 */
import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface MeasureResult { roomName: string; width: number; height: number; note: string }

export default function CustomerConfirmPage() {
  const [taskId, setTaskId] = useState('')
  const [measures, setMeasures] = useState<MeasureResult[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)

  useLoad(async (params) => {
    setTaskId(params.taskId || params.id || '')
    try {
      const res = await api.get(`/tasks/${params.taskId || params.id}/measure-result`)
      if (res.success) setMeasures(res.data.rooms || [])
    } finally { setLoading(false) }
  })

  const handleConfirm = async () => {
    Taro.showModal({
      title: '确认量尺结果', content: '确认后将进入报价阶段，是否确认？',
      success: async (modal) => {
        if (!modal.confirm) return
        const res = await api.post(`/tasks/${taskId}/confirm`)
        if (res.success) {
          setConfirmed(true)
          Taro.showToast({ title: '确认成功', icon: 'success' })
        }
      },
    })
  }

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>

  return (
    <View className='confirm-page'>
      <Text className='page-title'>量尺结果确认</Text>
      <Text className='page-hint'>请核对以下尺寸数据，确认无误后点击「确认」</Text>
      {measures.map((m, i) => (
        <View key={i} className='room-result card'>
          <Text className='room-name'>📐 {m.roomName}</Text>
          <View className='flex-between'>
            <Text className='measure-value'>宽 {m.width}m × 高 {m.height}m</Text>
          </View>
          {m.note && <Text className='measure-note'>备注：{m.note}</Text>}
        </View>
      ))}
      {!confirmed ? (
        <View className='form-footer'>
          <Button className='btn-submit' onClick={handleConfirm}>确认量尺结果</Button>
        </View>
      ) : (
        <View className='confirmed-badge'><Text>✅ 已确认</Text></View>
      )}
    </View>
  )
}
