import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function MeasureDisputePage() {
    const [taskId, setTaskId] = useState('')
    const [replyMsg, setReplyMsg] = useState('')

    // Mock
    const [disputeInfo] = useState({
        id: 'D-2026-001',
        taskNo: 'TSK-2026-0304-01',
        salesName: '张销售',
        createdAt: '2026-03-04 15:30',
        reason: '主卧的高度数据与客户自行测量的存在较大偏差，客户说有结构梁阻挡。麻烦核实一下是否有窗帘盒留缝。',
        status: 'pending' // pending, resolved
    })

    const [communications, setCommunications] = useState([
        {
            role: 'sales',
            name: '张销售',
            time: '2026-03-04 15:30',
            content: '主卧的层高数据偏低，麻烦再确认下照片'
        }
    ])

    useLoad((params) => {
        if (params.taskId) setTaskId(params.taskId)
    })

    const handleSendReply = () => {
        if (!replyMsg.trim()) return
        Taro.showLoading({ title: '发送中...' })
        setTimeout(() => {
            Taro.hideLoading()
            setCommunications(prev => [
                ...prev,
                { role: 'worker', name: '我(师傅)', time: '2026-03-04 16:00', content: replyMsg }
            ])
            setReplyMsg('')
        }, 600)
    }

    const handleRevisit = () => {
        Taro.showModal({
            title: '重新上门量尺',
            content: '是否确认重新生成量尺任务？销售将与客户确认时间。',
            success: function (res) {
                if (res.confirm) {
                    Taro.showToast({ title: '已通知销售', icon: 'success' })
                    setTimeout(() => Taro.navigateBack(), 1500)
                }
            }
        })
    }

    const handleResolve = () => {
        Taro.showModal({
            title: '解除异议',
            content: '确认为误报或已在线沟通解决？',
            success: function (res) {
                if (res.confirm) {
                    Taro.showToast({ title: '异议已解除', icon: 'success' })
                    setTimeout(() => Taro.navigateBack(), 1500)
                }
            }
        })
    }

    return (
        <View className="measure-dispute-page">
            <ScrollView scrollY className="content-scroll">
                <View className="warning-banner">
                    <Text className="icon">⚠️</Text>
                    <Text className="text">收到来自渠道销售的量尺数据异议，请及时核查并回复。</Text>
                </View>

                {/* 异议详情卡片 */}
                <View className="dispute-card card">
                    <View className="card-header">
                        <Text className="title">数据异议说明</Text>
                        <Text className="date">{disputeInfo.createdAt}</Text>
                    </View>
                    <View className="info-row">
                        <Text className="label">关联任务：</Text>
                        <Text className="value">{disputeInfo.taskNo}</Text>
                    </View>
                    <View className="info-row">
                        <Text className="label">发起人：</Text>
                        <Text className="value">{disputeInfo.salesName} (销售)</Text>
                    </View>
                    <View className="reason-box">
                        <Text className="reason-text">{disputeInfo.reason}</Text>
                    </View>
                </View>

                {/* 沟通记录 */}
                <View className="communication-box">
                    <Text className="section-title">沟通协商记录</Text>
                    <View className="msg-list">
                        {communications.map((msg, idx) => (
                            <View key={idx} className={`msg-item ${msg.role}`}>
                                <View className="avatar">{msg.name[0]}</View>
                                <View className="msg-content">
                                    <View className="msg-header">
                                        <Text className="name">{msg.name}</Text>
                                        <Text className="time">{msg.time}</Text>
                                    </View>
                                    <View className="bubble">
                                        <Text>{msg.content}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* 底部操作区 */}
            <View className="bottom-bar">
                <View className="reply-bar">
                    <Input
                        className="reply-input"
                        placeholder="回复销售..."
                        value={replyMsg}
                        onInput={(e) => setReplyMsg(e.detail.value)}
                        confirmType="send"
                        onConfirm={handleSendReply}
                    />
                    <Button className="btn-send" onClick={handleSendReply}>发送</Button>
                </View>
                <View className="action-buttons">
                    <Button className="btn btn-revisit" onClick={handleRevisit}>需再次上门复尺</Button>
                    <Button className="btn btn-resolve" onClick={handleResolve}>在线沟通已解决</Button>
                </View>
                <View className="safe-bottom-space"></View>
            </View>
        </View>
    )
}
