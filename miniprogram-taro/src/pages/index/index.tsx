/**
 * 首页/智慧工作台
 *
 * @description 融合了登录、审核状态、工作台、客户首页的所有逻辑。
 * 从原生 miniprogram/pages/index/index.ts 迁移重写为 React 函数组件。
 */
import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import './index.scss'

/** 工作台统计数据 */
interface DashboardData {
    targetCompletion: number
    stats: { leads: number; quotes: number; orders: number; cash: number }
    todos: Array<{
        id: string
        title: string
        desc: string
        status: string
        statusText: string
        time: string
    }>
}

export default function IndexPage() {
    const { isLoggedIn, userInfo, currentRole } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)

    const today = new Date().toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    })

    useDidShow(() => {
        if (isLoggedIn && userInfo?.tenantStatus === 'active') {
            fetchDashboard()
        }
    })

    /** 获取工作台数据 */
    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const res = await api.get('/dashboard')
            if (res.success) {
                const s = res.data.stats || {}
                const t = res.data.target || { percentage: 0 }
                setDashboard({
                    targetCompletion: t.percentage || 0,
                    stats: {
                        leads: s.leads || 0,
                        quotes: s.quotes || 0,
                        orders: s.orders || 0,
                        cash: s.cash || 0,
                    },
                    todos: res.data.todos || [],
                })
            }
        } catch (err) {
            console.error('获取工作台数据失败', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className='index-page'>
            <View className='header'>
                <Text className='date'>{today}</Text>
                <Text className='title'>
                    {isLoggedIn ? `你好, ${userInfo?.name || '用户'}` : 'L2C 窗帘管理大师'}
                </Text>
            </View>

            {!isLoggedIn && (
                <View className='login-prompt card'>
                    <Text>请登录以使用完整功能</Text>
                </View>
            )}

            {isLoggedIn && dashboard && (
                <View className='dashboard'>
                    <View className='stats-grid'>
                        <View className='stat-item card'>
                            <Text className='stat-value'>{dashboard.stats.leads}</Text>
                            <Text className='stat-label'>线索</Text>
                        </View>
                        <View className='stat-item card'>
                            <Text className='stat-value'>{dashboard.stats.quotes}</Text>
                            <Text className='stat-label'>报价</Text>
                        </View>
                        <View className='stat-item card'>
                            <Text className='stat-value'>{dashboard.stats.orders}</Text>
                            <Text className='stat-label'>订单</Text>
                        </View>
                        <View className='stat-item card'>
                            <Text className='stat-value'>{dashboard.stats.cash}</Text>
                            <Text className='stat-label'>收款</Text>
                        </View>
                    </View>
                </View>
            )}

            {loading && (
                <View className='loading-container flex-center'>
                    <Text>加载中...</Text>
                </View>
            )}
        </View>
    )
}
