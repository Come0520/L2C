import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { taskService } from '@/services/task-service'
import './index.scss'

export default function SalesMeasureReviewPage() {
    const [taskId, setTaskId] = useState('')
    const [taskData, setTaskData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useLoad(async (options) => {
        const id = options.id
        if (id) {
            setTaskId(id)
            try {
                const res = await taskService.getTaskDetail(id, 'measure')
                setTaskData(res)
            } catch (e: any) {
                Taro.showToast({ title: e.message || '加载详情失败', icon: 'none' })
            } finally {
                setLoading(false)
            }
        } else {
            setLoading(false)
            Taro.showToast({ title: '参数缺失', icon: 'none' })
        }
    })

    const handleApprove = () => {
        Taro.showModal({
            title: '确认复核',
            content: '复核通过后数据将不可更改，是否确认？',
            success: async (res) => {
                if (res.confirm) {
                    Taro.showLoading({ title: '提交中...' })
                    try {
                        await taskService.verifyMeasureData(taskId, 'APPROVE')
                        Taro.hideLoading()
                        Taro.showToast({ title: '已复核', icon: 'success' })
                        setTimeout(() => Taro.navigateBack(), 1500)
                    } catch (e: any) {
                        Taro.hideLoading()
                        Taro.showToast({ title: e.message || '复核失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const handleDispute = () => {
        Taro.showModal({
            title: '申诉打回',
            content: '确认为数据异常/照片不清晰需打回？',
            editable: true,
            placeholderText: '请输入打回理由',
            success: async (res) => {
                if (res.confirm && res.content) {
                    Taro.showLoading({ title: '提交中...' })
                    try {
                        await taskService.verifyMeasureData(taskId, 'DISPUTE', res.content)
                        Taro.hideLoading()
                        Taro.showToast({ title: '已打回重测', icon: 'none' })
                        setTimeout(() => Taro.navigateBack(), 1500)
                    } catch (e: any) {
                        Taro.hideLoading()
                        Taro.showToast({ title: e.message || '申诉失败', icon: 'none' })
                    }
                } else if (res.confirm && !res.content) {
                    Taro.showToast({ title: '请填写打回理由', icon: 'none' })
                }
            }
        })
    }

    if (loading) {
        return <View className="sales-measure-review-page"><View className="empty-tips">加载中...</View></View>
    }

    if (!taskData) {
        return <View className="sales-measure-review-page"><View className="empty-tips">无任务数据</View></View>
    }

    // 后续从实际字段中读取 measure data 和图片
    const mockImages = [
        '/assets/images/placeholder.png',
        '/assets/images/placeholder.png'
    ]
    const mockDataList = [
        { room: '客厅', shape: 'L型飘窗', width: '2.40m', height: '1.80m', note: '做满墙，需预留电动轨道电源' },
        { room: '主卧', shape: '一字落地窗', width: '1.50m', height: '2.20m', note: '罗马杆' },
    ]

    return (
        <View className="sales-measure-review-page">
            <View className="page-header">
                <Text className="title">量尺数据审核</Text>
                <Text className="subtitle">审核工人上传的最终测量数据与现场图</Text>
            </View>

            <ScrollView scrollY className="content-scroll">
                <View className="info-card">
                    <View className="card-header">
                        <Text className="label">关联量尺单：</Text>
                        <Text className="value highlight">{taskData?.measureNo || taskId}</Text>
                    </View>
                    <View className="data-row">
                        <Text className="label">师傅姓名：</Text>
                        <Text className="value">{taskData?.assignedWorkerId ? '已指派(缺名字段)' : '待分配'}</Text>
                    </View>
                    <View className="data-row">
                        <Text className="label">提交时间：</Text>
                        <Text className="value">{taskData?.createdAt?.substring(0, 10)}</Text>
                    </View>
                </View>

                {/* 图片展示区 */}
                <View className="preview-section">
                    <View className="section-title">现场照片 / 图纸草图</View>
                    <View className="image-grid">
                        {mockImages.map((url, idx) => (
                            <Image key={idx} src={url} className="image-item" mode="aspectFill" />
                        ))}
                    </View>
                </View>

                {/* 数据表格区 */}
                <View className="preview-section data-section">
                    <View className="section-title">窗型数据汇总</View>

                    <View className="data-list-wrap">
                        {mockDataList.map((item, idx) => (
                            <View key={idx} className="data-item">
                                <View className="item-head">
                                    <Text className="room">{item.room}</Text>
                                    <Text className="shape">{item.shape}</Text>
                                </View>
                                <View className="item-body">
                                    <View className="dim"><Text>宽：</Text>{item.width}</View>
                                    <View className="dim"><Text>高：</Text>{item.height}</View>
                                </View>
                                <View className="item-foot">
                                    <Text className="note">备注：{item.note}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* 操作底栏 */}
            <View className="action-bar">
                <Button className="btn dispute" onClick={handleDispute}>提出申诉</Button>
                <Button className="btn approve" onClick={handleApprove}>核对无误确认</Button>
            </View>
        </View>
    )
}
