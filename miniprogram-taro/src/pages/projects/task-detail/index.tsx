/**
 * 项目任务详情页
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

interface ProjectTask {
  id: string; title: string; description: string; status: string; statusText: string
  assigneeName: string; dueDate: string; createdAt: string
  subtasks: Array<{ id: string; title: string; completed: boolean }>
}

export default function ProjectTaskDetailPage() {
  const [task, setTask] = useState<ProjectTask | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(async (params) => {
    const { id } = params
    if (!id) return
    try {
      const res = await api.get(`/projects/tasks/${id}`)
      if (res.success) setTask(res.data)
    } finally { setLoading(false) }
  })

  if (loading) return <View className='page flex-center'><Text>加载中...</Text></View>
  if (!task) return <View className='page flex-center'><Text>任务不存在</Text></View>

  return (
    <View className='detail-page'>
      <ScrollView className='detail-scroll' scrollY enhanced showScrollbar={false}>
        <View className='info-card card'>
          <View className='flex-between'>
            <Text className='task-title'>{task.title}</Text>
            <Text className='task-status'>{task.statusText}</Text>
          </View>
          <Text className='task-desc'>{task.description}</Text>
          {task.assigneeName && <View className='info-row'><Text className='info-label'>负责人</Text><Text className='info-value'>{task.assigneeName}</Text></View>}
          {task.dueDate && <View className='info-row'><Text className='info-label'>截止日期</Text><Text className='info-value'>{task.dueDate}</Text></View>}
        </View>
        {task.subtasks?.length > 0 && (
          <View className='subtasks-section'>
            <Text className='section-title'>子任务</Text>
            {task.subtasks.map((st) => (
              <View key={st.id} className='subtask-item card'>
                <Text className={`subtask-check ${st.completed ? 'completed' : ''}`}>{st.completed ? '☑' : '☐'}</Text>
                <Text className={`subtask-title ${st.completed ? 'completed' : ''}`}>{st.title}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
