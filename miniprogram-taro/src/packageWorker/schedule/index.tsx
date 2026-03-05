import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { engineerService } from '@/services/engineer-service'
import './index.scss'

export default function WorkerSchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [scheduleMap, setScheduleMap] = useState<Record<string, any[]>>({})
    const [loading, setLoading] = useState(false)

    // 生成当前周的日期数据 (简化版日历)
    const generateWeekDays = () => {
        const today = new Date(selectedDate)
        const days: any[] = []
        // 获取当前日期是周几 (0-6, 周日-周六)
        const currentDayIndex = today.getDay()
        // 获取本周一的日期
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - (currentDayIndex === 0 ? 6 : currentDayIndex - 1))

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            days.push({
                day: ['一', '二', '三', '四', '五', '六', '日'][i],
                date: dateStr,
                num: date.getDate(),
                isToday: dateStr === new Date().toISOString().split('T')[0],
                hasTask: !!(scheduleMap[dateStr] && scheduleMap[dateStr].length > 0)
            })
        }
        return days
    }

    const weekDays = generateWeekDays()

    // 选中日期下的任务
    const currentTasks = useMemo(() => {
        return scheduleMap[selectedDate] || []
    }, [scheduleMap, selectedDate])

    // 请求当月排期
    const fetchSchedule = async () => {
        try {
            setLoading(true)
            const d = new Date(selectedDate)
            const year = d.getFullYear()
            const month = d.getMonth() + 1
            // 简单取当月
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`

            const res = await engineerService.getSchedule(startDate, endDate)
            if (res && res.tasks) {
                // 根据日期进行 grouping
                const newMap: Record<string, any[]> = {}
                res.tasks.forEach(task => {
                    const dKey = task.date
                    if (!newMap[dKey]) newMap[dKey] = []
                    newMap[dKey].push(task)
                })
                setScheduleMap(newMap)
            }
        } catch (err) {
            Taro.showToast({ title: '加载日程失败', icon: 'none' })
        } finally {
            setLoading(false)
            Taro.stopPullDownRefresh()
        }
    }

    useLoad(() => {
        fetchSchedule()
    })

    useDidShow(() => {
        if (!loading && Object.keys(scheduleMap).length === 0) {
            fetchSchedule()
        }
    })

    usePullDownRefresh(() => {
        fetchSchedule()
    })

    const handleConfirmChange = (_id: string) => {
        Taro.showModal({
            title: '确认时间变更',
            content: '客户申请将上门时间更改为 14:00 - 16:00，是否同意？',
            success: (res) => {
                if (res.confirm) {
                    Taro.showToast({ title: '已确认', icon: 'success' })
                    fetchSchedule()
                }
            }
        })
    }

    const handleNavTask = (id: string, type: string) => {
        // 跳转到全局的任务详情页
        Taro.navigateTo({ url: `/pages/task-detail/index?id=${id}&type=${type}` })
    }

    return (
        <View className="worker-schedule-page">
            {/* 顶部日期选择条 */}
            <View className="calendar-bar">
                <View className="month-header">
                    <Text className="month-text">{selectedDate.split('-')[0]}年{selectedDate.split('-')[1]}月</Text>
                    <Text className="btn-today" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>回到今天</Text>
                </View>
                <ScrollView scrollX className="date-scroll" showScrollbar={false}>
                    <View className="date-list">
                        {weekDays.map((item, idx) => (
                            <View key={idx} className={`date-item ${item.date === selectedDate ? 'active' : ''}`} onClick={() => setSelectedDate(item.date)}>
                                <Text className="day">{item.day}</Text>
                                <View className="date">{item.num}</View>
                                {item.hasTask && <View className="dot" />}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* 任务流 */}
            <ScrollView scrollY className="task-list">
                {loading ? (
                    <View className="empty-tips">加载中...</View>
                ) : currentTasks.length > 0 ? (
                    currentTasks.map((task) => (
                        <View key={task.id} className="timeline-item" onClick={() => handleNavTask(task.id, task.type)}>
                            <View className="time-col">
                                <Text className="time-text">{task.time.split(' - ')[0] || task.time}</Text>
                                <View className={`status-line ${task.status === 'COMPLETED' ? 'gray' : 'active'}`}></View>
                            </View>

                            <View className="content-col">
                                {task.changeNote && (
                                    <View className="change-alert" onClick={(e) => e.stopPropagation()}>
                                        <View className="alert-header">
                                            <Text className="icon">⚠️</Text>
                                            <Text className="title">变更提醒</Text>
                                        </View>
                                        <Text className="note">{task.changeNote}</Text>
                                        <Button className="confirm-btn" onClick={() => handleConfirmChange(task.id)}>已知晓并确认</Button>
                                    </View>
                                )}

                                <View className="task-card">
                                    <View className="card-header">
                                        <Text className={`tag ${task.type.toLowerCase()}`}>{task.title.split(' - ')[0]}</Text>
                                        <Text className={`status ${task.status}`}>{task.status === 'COMPLETED' ? '已完成' : '待服务'}</Text>
                                    </View>
                                    <Text className="address">{task.address}</Text>
                                    <Text className="time-range">预计耗时：{task.time}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View className="end-tips">当日无排期任务</View>
                )}
            </ScrollView>
        </View>
    )
}
