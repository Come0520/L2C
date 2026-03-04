import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function LiabilityPage() {
    const [liability] = useState({
        id: 'L-2026-001',
        taskNo: 'TSK-2026-0302-05',
        type: '安装问题',
        reason: '客户反馈窗帘轨道安装不水平，导致滑动卡顿。经现场核实，测量偏差超过5mm。',
        amount: 50.00,
        status: 'pending', // pending, accepted, appealed
        createdAt: '2026-03-04 10:00:00'
    })

    const handleAccept = () => {
        Taro.showModal({
            title: '确认判责',
            content: `是否确认接受此判责结果？将从您的结算款中扣除 ¥${liability.amount.toFixed(2)}。`,
            success: (res) => {
                if (res.confirm) {
                    Taro.showToast({ title: '已确认判责', icon: 'success' })
                    setTimeout(() => Taro.navigateBack(), 1500)
                }
            }
        })
    }

    const handleAppeal = () => {
        Taro.showModal({
            title: '发起申诉',
            content: '如对判责结果有异议，请联系平台客服提供申诉材料（现场照片/验收录音等）。',
            confirmText: '联系客服',
            cancelText: '取消',
            success: (res) => {
                if (res.confirm) {
                    Taro.makePhoneCall({ phoneNumber: '400-123-4567' })
                }
            }
        })
    }

    return (
        <View className="liability-page">
            <ScrollView scrollY className="content-scroll">
                <View className="warning-banner">
                    <Text className="icon">⚠️</Text>
                    <Text className="text">您收到一条新的售后判责通知，请注意查收并及时处理。超时未处理将默认同意。</Text>
                </View>

                <View className="liability-card card">
                    <View className="card-header">
                        <Text className="title">判责详情</Text>
                        <Text className="date">{liability.createdAt}</Text>
                    </View>

                    <View className="info-list">
                        <View className="info-row">
                            <Text className="label">关联任务</Text>
                            <Text className="value">{liability.taskNo}</Text>
                        </View>
                        <View className="info-row">
                            <Text className="label">责任类型</Text>
                            <Text className="value">{liability.type}</Text>
                        </View>
                        <View className="info-row penalty">
                            <Text className="label">扣罚金额</Text>
                            <Text className="value amount">- ¥{liability.amount.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View className="reason-section">
                        <Text className="reason-label">具体事由：</Text>
                        <Text className="reason-text">{liability.reason}</Text>
                    </View>
                </View>

                <View className="tips-card card">
                    <Text className="title">处理须知</Text>
                    <Text className="desc">1. 如您认可该判责，请点击下方"确认"，系统将自动从结算款中扣除对应金额。</Text>
                    <Text className="desc">2. 如您有异议，请在收到通知后 48 小时内点击"申诉"联系客服，逾期将视为接受。</Text>
                </View>
            </ScrollView>

            <View className="bottom-bar">
                <Button className="btn btn-appeal" onClick={handleAppeal}>对此有异议，申诉</Button>
                <Button className="btn btn-accept" onClick={handleAccept}>确认判责</Button>
                <View className="safe-bottom-space"></View>
            </View>
        </View>
    )
}
