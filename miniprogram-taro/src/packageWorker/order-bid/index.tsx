import { View, Text, Button, ScrollView, Input } from '@tarojs/components'
import Taro, { usePullDownRefresh, useLoad, useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { engineerService } from '@/services/engineer-service'
import { taskService } from '@/services/task-service'
import './index.scss'

export default function WorkerOrderBidPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [counterModal, setCounterModal] = useState({
        visible: false,
        orderId: '',
        price: '',
        reason: ''
    })

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const res = await engineerService.getBiddableTasks()
            if (res && Array.isArray(res)) {
                setOrders(res)
            } else {
                Taro.showToast({ title: '获取抢单池失败', icon: 'none' })
            }
        } catch (err) {
            Taro.showToast({ title: '网络异常', icon: 'none' })
        } finally {
            setLoading(false)
            Taro.stopPullDownRefresh()
        }
    }

    useLoad(() => {
        fetchTasks()
    })

    useDidShow(() => {
        if (!loading && orders.length === 0) {
            fetchTasks()
        }
    })

    usePullDownRefresh(() => {
        fetchTasks()
    })

    const handleAccept = (id: string, price: number) => {
        Taro.showModal({
            title: '确认接单',
            content: `同意以 ￥${price} 的价格接下该订单？`,
            success: async (res) => {
                if (res.confirm) {
                    Taro.showLoading({ title: '处理中...' })
                    try {
                        await taskService.negotiateTask(id, 'ACCEPT')
                        Taro.hideLoading()
                        Taro.showToast({ title: '接单成功', icon: 'success' })
                        fetchTasks() // Refresh list
                    } catch (e: any) {
                        Taro.hideLoading()
                        Taro.showToast({ title: e.message || '接单失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const handleReject = (id: string) => {
        Taro.showModal({
            title: '残忍拒绝',
            content: '拒绝后将不在您的抢单池显示，确认拒绝？',
            success: async (res) => {
                if (res.confirm) {
                    Taro.showLoading({ title: '处理中...' })
                    try {
                        await taskService.negotiateTask(id, 'REJECT')
                        Taro.hideLoading()
                        Taro.showToast({ title: '已拒绝', icon: 'none' })
                        setOrders(prev => prev.filter(o => o.id !== id))
                    } catch (e: any) {
                        Taro.hideLoading()
                        Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const openCounterModal = (id: string) => {
        setCounterModal({
            visible: true,
            orderId: id,
            price: '',
            reason: ''
        })
    }

    const submitCounterOffer = async () => {
        if (!counterModal.price) {
            Taro.showToast({ title: '请输入期望价格', icon: 'none' })
            return
        }
        Taro.showLoading({ title: '提交议价...' })
        try {
            await taskService.negotiateTask(counterModal.orderId, 'COUNTER', {
                price: counterModal.price,
                reason: counterModal.reason
            })
            Taro.hideLoading()
            Taro.showToast({ title: '议价已提交', icon: 'success' })
            setCounterModal({ ...counterModal, visible: false })
            fetchTasks()
        } catch (e: any) {
            Taro.hideLoading()
            Taro.showToast({ title: e.message || '提交失败', icon: 'none' })
        }
    }

    return (
        <View className="order-bid-page">
            <View className="page-header">
                <Text className="title">待接工单</Text>
                <Text className="subtitle">共 {orders.length} 个新订单正在等待分配</Text>
            </View>

            <ScrollView scrollY className="order-list">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <View key={order.id} className="order-card">
                            <View className="card-header">
                                <View className="left">
                                    <Text className={`tag ${order.type.toLowerCase()}`}>{order.typeLabel}</Text>
                                    <Text className="order-id">{order.taskNo || order.id}</Text>
                                </View>
                                <Text className="distance">{order.distance}</Text>
                            </View>

                            <View className="card-body">
                                <View className="info-row">
                                    <Text className="label">服务时间：</Text>
                                    <Text className="value highlight">
                                        {order.scheduledDate ? order.scheduledDate.substring(0, 10) : '尽快'}
                                        {order.timeSlot ? ` ${order.timeSlot}` : ''}
                                    </Text>
                                </View>
                                <View className="info-row">
                                    <Text className="label">服务地址：</Text>
                                    <Text className="value">{order.address}</Text>
                                </View>
                                <View className="info-row">
                                    <Text className="label">客户称呼：</Text>
                                    <Text className="value">{order.customerName}</Text>
                                </View>
                            </View>

                            <View className="card-footer">
                                <View className="price-area">
                                    <Text className="label">系统报价</Text>
                                    <Text className="price">￥{order.systemPrice}</Text>
                                </View>
                                <View className="action-area">
                                    <Button className="btn reject" onClick={() => handleReject(order.id)}>拒绝</Button>
                                    <Button className="btn counter" onClick={() => openCounterModal(order.id)}>议价</Button>
                                    <Button className="btn accept" onClick={() => handleAccept(order.id, order.systemPrice)}>接单</Button>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View className="empty-state">
                        <Text className="empty-text">{loading ? '加载中...' : '暂无新派单，休息一下吧'}</Text>
                    </View>
                )}
            </ScrollView>

            {/* 议价弹窗 */}
            {counterModal.visible && (
                <View className="modal-overlay">
                    <View className="modal-content">
                        <View className="modal-header">
                            <Text className="modal-title">工单议价</Text>
                            <Text className="close-btn" onClick={() => setCounterModal({ ...counterModal, visible: false })}>×</Text>
                        </View>

                        <View className="modal-body">
                            <View className="form-item">
                                <Text className="label">期望价格 (元)</Text>
                                <Input
                                    className="input price-input"
                                    type="digit"
                                    placeholder="请输入您的心理价位"
                                    value={counterModal.price}
                                    onInput={(e) => setCounterModal({ ...counterModal, price: e.detail.value })}
                                />
                            </View>
                            <View className="form-item">
                                <Text className="label">议价理由 (选填)</Text>
                                <Input
                                    className="input"
                                    placeholder="如：路程较远、楼层较高无电梯等"
                                    value={counterModal.reason}
                                    onInput={(e) => setCounterModal({ ...counterModal, reason: e.detail.value })}
                                />
                            </View>
                        </View>

                        <View className="modal-footer">
                            <Button className="submit-btn" onClick={submitCounterOffer}>提交议价申请</Button>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
}
