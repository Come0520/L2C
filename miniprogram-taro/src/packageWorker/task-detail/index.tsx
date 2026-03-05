import { View, Text, ScrollView, Image, Button, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { taskService } from '@/services/task-service'
import type { MeasureTask, InstallTask } from '@/types/business'
import './index.scss'

interface TaskDetailUI {
  id: string; taskNo: string; type: string; typeText: string
  status: string; statusText: string; customerName: string; customerPhone: string
  address: string; scheduledDate: string; remark: string; createdAt: string
  images: string[]
}

export default function TaskDetailPage() {
  const [task, setTask] = useState<TaskDetailUI | null>(null)
  const [loading, setLoading] = useState(true)

  // 沟通记录 Mock
  const [logs] = useState([
    { time: '2026-03-04 09:12', content: '客户提醒：小区下午2点后不让电钻施工', type: 'system' }
  ])

  // 关联报价单 Mock
  const [quotes] = useState<any[]>([])

  useLoad(async (params) => {
    const { id, type } = params
    if (!id || !type) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      setLoading(false)
      return
    }
    try {
      const res = await taskService.getTaskDetail(id, type as 'measure' | 'install')

      const isMeasure = type === 'measure'
      const mTask = isMeasure ? (res as MeasureTask) : null
      const iTask = !isMeasure ? (res as InstallTask) : null

      setTask({
        id: res.id,
        taskNo: mTask?.measureNo || iTask?.taskNo || '',
        type: type,
        typeText: isMeasure ? '上门测量' : '上门安装',
        status: res.status,
        statusText: getStatusText(res.status),
        customerName: mTask?.customerName || mTask?.customer?.name || iTask?.customerName || '未知客户',
        customerPhone: mTask?.customerPhone || mTask?.customer?.phone || iTask?.customerPhone || '',
        address: iTask?.address || mTask?.customer?.address || '无详细地址',
        scheduledDate: mTask?.scheduledAt || (iTask?.scheduledDate ? `${iTask.scheduledDate} ${iTask.scheduledTimeSlot || ''}` : '待安排'),
        remark: res.remark || '',
        createdAt: res.createdAt,
        images: [] // 暂未接入附件
      })

      if (isMeasure && mTask?.quoteSummary) {
        // TODO: 填充关联报价单
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  })

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'PENDING': '待确认',
      'PENDING_VISIT': '待上门',
      'IN_PROGRESS': '进行中',
      'PENDING_CONFIRM': '待验收',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
      'PENDING_DISPATCH': '待派单',
      'ACCEPTED': '已接单'
    }
    return map[status] || status
  }

  const handleAction = async (action: string) => {
    if (!task) return
    Taro.showLoading({ title: '处理中...' })
    try {
      console.log('Action:', action)
      // TODO: 接单 API
      Taro.hideLoading()
      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (err) {
      Taro.hideLoading()
    }
  }

  const navigateToMeasure = () => {
    Taro.navigateTo({ url: `/packageWorker/measure/index?taskId=${task?.id}` })
  }

  const navigateToSign = () => {
    // 客户确认签字页
    Taro.navigateTo({ url: `/packageWorker/customer-confirm/index?taskId=${task?.id}` })
  }

  if (loading) return <View className='page flex-center'><View className="loading">加载中...</View></View>
  if (!task) return <View className='page flex-center'><Text>任务不存在或无权限</Text></View>

  return (
    <View className='worker-task-detail'>
      <ScrollView className='detail-scroll' scrollY showScrollbar={false}>
        <View className="status-header">
          <Text className="title">{task.statusText}</Text>
          <Text className="subtitle">单号：{task.taskNo}</Text>
        </View>

        {/* 基础信息卡片 */}
        <View className='info-card'>
          <View className='card-header'>
            <Text className={`tag ${task.type}`}>{task.typeText}</Text>
            <Text className='date'>预约：{task.scheduledDate}</Text>
          </View>

          <View className="customer-info">
            <View className="left">
              <Text className="name">{task.customerName}</Text>
              <Text className="phone">{task.customerPhone}</Text>
            </View>
            <View className="call-btn" onClick={() => Taro.makePhoneCall({ phoneNumber: task.customerPhone })}>
              📞 拨打
            </View>
          </View>

          <View className="address-row">
            <Text className="icon">📍</Text>
            <Text className="text">{task.address}</Text>
          </View>

          {task.remark && (
            <View className="remark-row">
              <Text className="icon">📝</Text>
              <Text className="text">{task.remark}</Text>
            </View>
          )}
        </View>

        {/* 沟通记录 */}
        <View className="log-section">
          <Text className="section-title">沟通日志</Text>
          <View className="log-list">
            {logs.map((log, i) => (
              <View key={i} className={`log-item ${log.type}`}>
                <View className="dot"></View>
                <View className="content">
                  <Text className="time">{log.time}</Text>
                  <Text className="text">{log.content}</Text>
                </View>
              </View>
            ))}
            <View className="add-log">
              <Input className="log-input" placeholder="添加沟通记录..." />
              <Button className="send-btn">发送</Button>
            </View>
          </View>
        </View>

        {/* 关联报价单 */}
        <View className="quote-section">
          <Text className="section-title">关联报价单</Text>
          {quotes.map(q => (
            <View key={q.id} className="quote-card">
              <View className="left">
                <Text className="q-id">{q.id}</Text>
                <Text className="q-status">{q.status}</Text>
              </View>
              <Text className="q-amount">￥{q.amount}</Text>
            </View>
          ))}
        </View>

        {/* 现场图片 */}
        {task.images?.length > 0 && (
          <View className='images-section'>
            <Text className='section-title'>客户上传的现场环境</Text>
            <View className='images-grid'>
              {task.images.map((img, i) => (
                <Image key={i} className='task-img' src={img} mode='aspectFill'
                  onClick={() => Taro.previewImage({ urls: task.images!, current: img })} />
              ))}
            </View>
          </View>
        )}

        <View className="safe-bottom-space"></View>
      </ScrollView>

      {/* 底部操作区 */}
      <View className='bottom-action-bar'>
        {task.status === 'pending' && (
          <Button className='btn-main' onClick={() => handleAction('accept')}>接受派单</Button>
        )}
        {task.status === 'accepted' && (
          <>
            {task.type === 'measure' && (
              <Button className='btn-main measure' onClick={navigateToMeasure}>
                前往量尺录入
              </Button>
            )}
            <Button className='btn-main sign' onClick={navigateToSign}>要求客户确认</Button>
          </>
        )}
      </View>
    </View>
  )
}
