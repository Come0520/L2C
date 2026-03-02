/**
 * 任务详情页（Worker 专属）
 */
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface TaskDetail {
  id: string; taskNo: string; type: string; typeText: string
  status: string; statusText: string; customerName: string; customerPhone: string
  address: string; scheduledDate: string; remark: string; createdAt: string
  images: string[]
}

export default function TaskDetailPage() {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/tasks/${id}`)
      if (res.success) setTask(res.data)
    } finally { setLoading(false) }
  })

  const handleAction = async (action: string) => {
    if (!task) return
    Taro.showLoading({ title: '处理中...' })
    try {
      const res = await api.post(`/tasks/${task.id}/${action}`)
      if (res.success) {
        Taro.showToast({ title: '操作成功', icon: 'success' })
        // 刷新详情
        const detail = await api.get(`/tasks/${task.id}`)
        if (detail.success) setTask(detail.data)
      }
    } finally { Taro.hideLoading() }
  }

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!task) return <View className='page flex-center'><Text>任务不存在</Text></View>

  return (
    <View className='detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        <View className='info-card card'>
          <View className='flex-between'>
            <Text className='task-no'>{task.taskNo}</Text>
            <Text className='task-status'>{task.statusText}</Text>
          </View>
          <View className='task-type-badge'><Text>{task.typeText}</Text></View>
          <Text className='customer-name'>{task.customerName}</Text>
          <Text className='customer-phone'>{task.customerPhone}</Text>
          {task.address && <Text className='task-address'>📍 {task.address}</Text>}
          {task.scheduledDate && <Text className='task-date'>📅 {task.scheduledDate}</Text>}
          {task.remark && <Text className='task-remark'>💬 {task.remark}</Text>}
        </View>

        {/* 现场图片 */}
        {task.images?.length > 0 && (
          <View className='images-section'>
            <Text className='section-title'>现场图片</Text>
            <View className='images-grid'>
              {task.images.map((img, i) => (
                <Image key={i} className='task-img' src={img} mode='aspectFill'
                  onClick={() => Taro.previewImage({ urls: task.images!, current: img })} />
              ))}
            </View>
          </View>
        )}

        {/* 操作按钮 */}
        <View className='action-bar'>
          {task.status === 'pending' && (
            <Button className='btn-submit' onClick={() => handleAction('accept')}>接受任务</Button>
          )}
          {task.status === 'accepted' && (
            <>
              {task.type === 'measure' && (
                <Button className='btn-submit' onClick={() => Taro.navigateTo({ url: `/pages/tasks-sub/measure/index?taskId=${task.id}` })}>
                  开始量尺
                </Button>
              )}
              <Button className='btn-complete' onClick={() => handleAction('complete')}>标记完成</Button>
            </>
          )}
          <Button className='btn-call' onClick={() => Taro.makePhoneCall({ phoneNumber: task.customerPhone })}>
            📞 联系客户
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
