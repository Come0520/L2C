/**
 * 任务页（Worker 专属 TabBar 页）
 *
 * @description Worker 角色的核心页面。
 * 顶部 Tab 切换：待接单 / 进行中 / 已完成
 * 涵盖量尺和安装两种任务类型。
 */
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useLoad } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { taskService } from '@/services/task-service'
import { requireRole } from '@/utils/route-guard'
import TabBar from '@/components/TabBar/index'
import './index.scss'

/** 任务状态 Tab */
type TaskTab = 'pending' | 'active' | 'completed'

/** 任务项 */
interface TaskItem {
  id: string
  type: 'measure' | 'install'
  customerName: string
  address: string
  scheduledDate: string
  scheduledTime: string
  status: string
  roomCount?: number
}

const TAB_CONFIG: { key: TaskTab; label: string }[] = [
  { key: 'pending', label: '待接单' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

export default function TasksPage() {
  useLoad(() => {
    requireRole(['worker'])
  })

  const { currentRole } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TaskTab>('pending')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(false)

  /** 获取任务列表 */
  const fetchTasks = useCallback(async (tab: TaskTab) => {
    setLoading(true)
    try {
      const statusMap: Record<TaskTab, string> = {
        pending: 'pending',
        active: 'in_progress',
        completed: 'completed',
      }
      // 此处统一弃用只返回安装任务的 `/engineer/tasks`，改用全量 `/tasks`
      const data = await taskService.getTaskList({ status: statusMap[tab] })

      let measureTasks = (data.measureTasks || []).map((t: any) => ({
        id: t.id,
        type: 'measure' as const,
        customerName: t.customerName || t.customer?.name || '未知客户',
        address: t.customer?.address || t.customer?.community || '无地址信息',
        scheduledDate: t.scheduledAt ? t.scheduledAt.split(' ')[0] : '待定',
        scheduledTime: t.scheduledAt ? t.scheduledAt.split(' ')[1] || '' : '',
        status: t.status
      }))

      let installTasks = (data.installTasks || []).map((t: any) => ({
        id: t.id,
        type: 'install' as const,
        customerName: t.customerName || '未知客户',
        address: t.address || '无地址信息',
        scheduledDate: t.scheduledDate || '待定',
        scheduledTime: t.scheduledTimeSlot || '',
        status: t.status
      }))

      const merged = [...measureTasks, ...installTasks].sort((a, b) => {
        const timeA = new Date(`${a.scheduledDate} ${a.scheduledTime}`).getTime() || 0
        const timeB = new Date(`${b.scheduledDate} ${b.scheduledTime}`).getTime() || 0
        return timeB - timeA // 倒序
      })

      setTasks(merged)
    } catch (err) {
      console.error('Fetch tasks failed:', err)
    } finally {
      setLoading(false)
    }
  }, [currentRole])

  useDidShow(() => {
    fetchTasks(activeTab)
  })

  usePullDownRefresh(() => {
    fetchTasks(activeTab).then(() => Taro.stopPullDownRefresh())
  })

  /** 切换顶部 Tab */
  const handleTabChange = (tab: TaskTab) => {
    setActiveTab(tab)
    fetchTasks(tab)
  }

  /** 跳转任务详情 (附带 type 参数) */
  const goDetail = (task: TaskItem) => {
    Taro.navigateTo({ url: `/packageWorker/task-detail/index?id=${task.id}&type=${task.type}` })
  }

  /** 接受任务（滑动/点击） */
  const acceptTask = async (taskId: string, type: 'measure' | 'install') => {
    const res = await api.post(`/tasks/${taskId}`, { data: { type, action: 'update_status', data: { status: type === 'measure' ? 'PENDING_VISIT' : 'PENDING_VISIT' } } })
    if (res.success) {
      Taro.showToast({ title: '已接单', icon: 'success' })
      fetchTasks(activeTab)
    }
  }

  return (
    <View className='tasks-page'>
      {/* 顶部 Tab 切换 */}
      <View className='tasks-tabs'>
        {TAB_CONFIG.map((tab) => (
          <View
            key={tab.key}
            className={`tasks-tab ${activeTab === tab.key ? 'tasks-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 任务列表 */}
      <ScrollView
        className='tasks-list'
        scrollY
        enhanced
        showScrollbar={false}
      >
        {tasks.length === 0 && !loading && (
          <View className='empty-state flex-center'>
            <Text className='empty-icon'>📋</Text>
            <Text className='empty-text'>
              {activeTab === 'pending' ? '暂无待接单任务' :
                activeTab === 'active' ? '暂无进行中任务' : '暂无已完成任务'}
            </Text>
          </View>
        )}

        {tasks.map((task) => (
          <View
            key={task.id}
            className='task-card card'
            onClick={() => goDetail(task)}
          >
            {/* 任务类型标签 */}
            <View className='task-card__header'>
              <View className={`task-type-badge task-type-badge--${task.type}`}>
                <Text>{task.type === 'measure' ? '量尺' : '安装'}</Text>
              </View>
              <Text className='task-date'>{task.scheduledDate} {task.scheduledTime}</Text>
            </View>

            {/* 客户信息 */}
            <Text className='task-customer'>{task.customerName}</Text>
            <Text className='task-address text-ellipsis'>{task.address}</Text>

            {task.roomCount && (
              <Text className='task-rooms'>{task.roomCount} 个房间</Text>
            )}

            {/* 待接单：接受按钮 */}
            {activeTab === 'pending' && (
              <View className='task-actions'>
                <View
                  className='btn-accept'
                  onClick={(e) => {
                    e.stopPropagation()
                    acceptTask(task.id, task.type)
                  }}
                >
                  <Text>接 单</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View className='loading flex-center'>
            <Text>加载中...</Text>
          </View>
        )}
      </ScrollView>

      <TabBar selected='/pages/tasks/index' />
    </View>
  )
}
