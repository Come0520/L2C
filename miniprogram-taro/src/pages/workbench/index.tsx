/**
 * 工作台页
 *
 * @description 按角色区分视图：
 * - Manager：审批待办卡片 + 关键指标（待审批数、本月营收、新增线索）
 * - Sales：日常提醒、任务待办、快捷操作入口
 *
 * 复杂报表/财务数据不在此承接，引导至 Web 端。
 */
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { requireRole } from '@/utils/route-guard'
import TabBar from '@/components/TabBar/index'
import { Skeleton } from '@/components/Skeleton/index'
import { ErrorState } from '@/components/ErrorState/index'
import './index.scss'

/** Manager 视图所需数据 */
interface ManagerDashboard {
    pendingApprovals: number   // 待审批数
    monthRevenue: number       // 本月营收（元）
    newLeads: number           // 本期新增线索
    notifications: string[]   // 消息通知
}

/** Sales 视图所需数据 */
interface SalesDashboard {
    todayTodos: Array<{ id: string; title: string; type: string }>
    stats: { leads: number; quotes: number }
    reminders: string[]
}

export default function WorkbenchPage() {
    useLoad(() => {
        requireRole(['manager', 'admin', 'sales'])
    })

    const { currentRole, userInfo } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [managerData, setManagerData] = useState<ManagerDashboard | null>(null)
    const [salesData, setSalesData] = useState<SalesDashboard | null>(null)

    const isManager = currentRole === 'manager' || currentRole === 'admin'
    const isSales = currentRole === 'sales'

    useDidShow(() => {
        fetchData()
    })

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/dashboard')
            if (res.success) {
                const d = res.data
                if (isManager) {
                    setManagerData({
                        pendingApprovals: d.pendingApprovals || 0,
                        monthRevenue: d.monthRevenue || 0,
                        newLeads: d.newLeads || 0,
                        notifications: d.notifications || [],
                    })
                } else if (isSales) {
                    setSalesData({
                        todayTodos: d.todos || [],
                        stats: { leads: d.stats?.leads || 0, quotes: d.stats?.quotes || 0 },
                        reminders: d.reminders || [],
                    })
                }
            } else {
                setError(res.message || '加载工作台数据失败')
            }
        } catch (err: any) {
            setError(err.message || '网络或服务器错误')
        } finally {
            setLoading(false)
        }
    }

    const today = new Date().toLocaleDateString('zh-CN', {
        month: 'long', day: 'numeric', weekday: 'short',
    })

    return (
        <View className='workbench-page'>
            {/* 顶部问候 */}
            <View className='workbench-header'>
                <Text className='header-date'>{today}</Text>
                <Text className='header-greeting'>
                    你好，{userInfo?.name || '用户'} 👋
                </Text>
                <Text className='header-role'>
                    {isManager ? '管理员' : isSales ? '销售顾问' : ''}
                </Text>
            </View>

            {error ? (
                <ErrorState
                    title="加载失败"
                    message={error}
                    onRetry={() => fetchData()}
                />
            ) : (
                <Skeleton loading={loading} type="card" rows={4}>
                    {/* Manager 视图 */}
                    {isManager && (
                        <View className='manager-view'>
                            {/* 关键指标 */}
                            <View className='metrics-row'>
                                <View
                                    className='metric-card metric-card--highlight'
                                    onClick={() => Taro.showToast({ title: '请前往 Web 端查看', icon: 'none' })}
                                >
                                    <Text className='metric-value'>
                                        {managerData?.pendingApprovals ?? '-'}
                                    </Text>
                                    <Text className='metric-label'>待审批</Text>
                                </View>
                                <View className='metric-card'>
                                    <Text className='metric-value'>
                                        ¥{((managerData?.monthRevenue ?? 0) / 10000).toFixed(1)}万
                                    </Text>
                                    <Text className='metric-label'>本月营收</Text>
                                </View>
                                <View className='metric-card'>
                                    <Text className='metric-value'>
                                        {managerData?.newLeads ?? '-'}
                                    </Text>
                                    <Text className='metric-label'>本期线索</Text>
                                </View>
                            </View>

                            {/* Web 端引导卡 */}
                            <View
                                className='web-guide-card card'
                                onClick={() => Taro.navigateTo({ url: '/pages/landing/index' })}
                            >
                                <Text className='web-guide-icon'>💻</Text>
                                <View>
                                    <Text className='web-guide-title'>财务报表 / 深度分析</Text>
                                    <Text className='web-guide-desc'>前往 Web 端查看完整数据</Text>
                                </View>
                                <Text className='web-guide-arrow'>›</Text>
                            </View>
                        </View>
                    )}

                    {/* Sales 视图 */}
                    {isSales && (
                        <View className='sales-view'>
                            {/* 快捷入口 */}
                            <View className='quick-actions'>
                                <View
                                    className='quick-action card'
                                    onClick={() => Taro.navigateTo({ url: '/pages/leads/index' })}
                                >
                                    <Text className='quick-action-icon'>📋</Text>
                                    <Text className='quick-action-text'>线索</Text>
                                    <Text className='quick-action-count'>{salesData?.stats.leads ?? 0}</Text>
                                </View>
                                <View
                                    className='quick-action card'
                                    onClick={() => Taro.showToast({ title: '报价功能请前往 Web 端', icon: 'none' })}
                                >
                                    <Text className='quick-action-icon'>📄</Text>
                                    <Text className='quick-action-text'>报价</Text>
                                    <Text className='quick-action-count'>{salesData?.stats.quotes ?? 0}</Text>
                                </View>
                                <View
                                    className='quick-action card'
                                    onClick={() => Taro.showToast({ title: '客户管理请前往 Web 端', icon: 'none' })}
                                >
                                    <Text className='quick-action-icon'>👥</Text>
                                    <Text className='quick-action-text'>客户</Text>
                                </View>
                            </View>

                            {/* 今日待办 */}
                            {salesData?.todayTodos && salesData.todayTodos.length > 0 && (
                                <View className='todos-section'>
                                    <Text className='section-title'>今日待办</Text>
                                    {salesData.todayTodos.map((todo) => (
                                        <View key={todo.id} className='todo-item card'>
                                            <Text className='todo-title'>{todo.title}</Text>
                                            <Text className='todo-type'>{todo.type}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </Skeleton>
            )}

            {/* TabBar */}
            <TabBar selected='/pages/workbench/index' />
        </View>
    )
}
