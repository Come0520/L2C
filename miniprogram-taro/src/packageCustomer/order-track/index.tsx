import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { orderService } from '@/services/order-service'
import type { Order } from '@/types/business'
import './index.scss'

export default function OrderTrack() {
    const [orderId, setOrderId] = useState<string>('')
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeline, setTimeline] = useState<any[]>([])

    useLoad(async (params) => {
        const id = params.id || ''
        if (!id) {
            Taro.showToast({ title: '订单号为空', icon: 'error' })
            setLoading(false)
            return
        }
        setOrderId(id)
        await fetchTimeline(id)
    })

    const fetchTimeline = async (id: string) => {
        setLoading(true)
        try {
            const data = await orderService.getOrderDetail(id)
            setOrder(data)
            buildTimelineUI(data)
        } catch (error) {
            Taro.showToast({ title: '获取订单失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const buildTimelineUI = (orderData: Order) => {
        const steps = [
            { key: 'SIGNED', title: '订单已确认', desc: '您的订单已正式生效', type: 'confirm' },
            { key: 'MEASURED', title: '上门量尺完成', desc: '现场测量尺寸完成', type: 'measure' },
            { key: 'PENDING_DELIVERY', title: '定制生产完成', desc: '产品生产完毕，等待外发发货', type: 'factory' },
            { key: 'PENDING_INSTALL', title: '待上门安装', desc: '正在为您安排安装师傅', type: 'shipping' },
            { key: 'INSTALLATION_COMPLETED', title: '安装完成', desc: '现场安装已完工并交验', type: 'install' },
            { key: 'COMPLETED', title: '已签收', desc: '期待再次为您服务', type: 'finish' }
        ]

        const statusWeights: Record<string, number> = {
            'DRAFT': 0, 'PENDING_MEASURE': 0, 'QUOTED': 0,
            'SIGNED': 1, 'PAID': 1, 'PENDING_PO': 1, 'PENDING_PRODUCTION': 1, 'IN_PRODUCTION': 1,
            'MEASURED': 2,
            'PENDING_DELIVERY': 3,
            'PENDING_INSTALL': 4,
            'INSTALLATION_COMPLETED': 5, 'PENDING_CONFIRMATION': 5,
            'COMPLETED': 6
        }

        const currentWeight = statusWeights[orderData.status] ?? 0

        const generated = steps.map((s, idx) => {
            const stepWeight = idx + 1
            let timelineStatus = 'pending'
            if (currentWeight >= stepWeight) timelineStatus = 'completed'
            if (currentWeight === stepWeight) timelineStatus = 'active'

            // 使用更新时间或创建时间作为参考
            const baseDate = new Date(orderData.updatedAt || orderData.createdAt)
            const dateStr = baseDate.toISOString().split('T')[0]
            const timeStr = baseDate.toTimeString().split(' ')[0]

            return {
                id: idx,
                title: s.title,
                description: currentWeight >= stepWeight ? s.desc : '等待进行中...',
                date: currentWeight >= stepWeight ? dateStr : '--',
                time: currentWeight >= stepWeight ? timeStr : '--',
                status: timelineStatus,
                type: s.type
            }
        }).reverse() // 最近在最上

        setTimeline(generated)
    }

    const handleCopy = () => {
        Taro.setClipboardData({
            data: orderId,
            success: () => {
                Taro.showToast({ title: '复制成功', icon: 'success' })
            }
        })
    }

    const getStatusText = (status?: string) => {
        if (!status) return '未知'
        const map: Record<string, string> = {
            'DRAFT': '草稿',
            'SIGNED': '已签订',
            'PAID': '已付款',
            'MEASURED': '已量尺',
            'PENDING_DELIVERY': '待发货',
            'PENDING_INSTALL': '待安装',
            'INSTALLATION_COMPLETED': '已安装',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        }
        return map[status] || status
    }

    if (loading) {
        return (
            <View className="order-track-page">
                <View className="loading">加载进度中...</View>
            </View>
        )
    }

    if (!order) {
        return (
            <View className="order-track-page flex-center">
                <Text>查无此订单</Text>
            </View>
        )
    }

    return (
        <View className="order-track-page">
            <ScrollView scrollY className="content-scroll">
                {/* 顶部订单简述 */}
                <View className="header-card">
                    <View className="order-no-row">
                        <Text className="label">订单编号</Text>
                        <View className="right" onClick={handleCopy}>
                            <Text className="value">{order.orderNo}</Text>
                            <Text className="copy-btn">复制</Text>
                        </View>
                    </View>
                    <View className="status-row">
                        <Text className="label">当前状态</Text>
                        <Text className="status-text active">{getStatusText(order.status)}</Text>
                    </View>
                </View>

                {/* 时间线 */}
                <View className="timeline-card">
                    <Text className="section-title">跟进轨迹</Text>

                    <View className="timeline-container">
                        {timeline.map((item, index) => {
                            const isFirst = index === 0
                            const isLast = index === timeline.length - 1

                            return (
                                <View key={item.id} className={`timeline-item ${isFirst ? 'is-first' : ''}`}>
                                    {/* 左侧时间与轨道 */}
                                    <View className="time-col">
                                        <Text className="date">{item.date !== '--' ? item.date.slice(5) : '--'}</Text>
                                        <Text className="time">{item.time !== '--' ? item.time.slice(0, 5) : '--'}</Text>
                                    </View>

                                    <View className="track-col">
                                        <View className={`dot ${item.status}`} />
                                        {!isLast && <View className="line" />}
                                    </View>

                                    {/* 右侧内容 */}
                                    <View className="content-col">
                                        <Text className="title">{item.title}</Text>
                                        <Text className="desc">{item.description}</Text>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </View>

                <View className="safe-area-bottom" />
            </ScrollView>
        </View>
    )
}
