import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { engineerService } from '@/services/engineer-service'
import type { EarningsRecord } from '@/types/business'
import './index.scss'

export default function SettlementPage() {
    const [loading, setLoading] = useState(true)

    const [stats, setStats] = useState({
        totalEarned: '0.00',
        pendingAmount: '0.00'
    })

    const [records, setRecords] = useState<EarningsRecord[]>([])

    useLoad(async () => {
        try {
            const data = await engineerService.getEarnings()
            setStats({
                totalEarned: data.totalEarned,
                pendingAmount: data.pendingAmount
            })
            setRecords(data.recentDetails || [])
        } catch (error) {
            Taro.showToast({ title: '获取数据失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    })

    const getFeeTypeName = (type: string | null) => {
        if (!type) return '完工账单'
        const map: Record<string, string> = {
            'MEASURE': '量尺',
            'INSTALL': '安装',
            'REPAIR': '维修',
        }
        return map[type] || type
    }

    if (loading) {
        return (
            <View className="worker-settlement-page">
                <View className="loading">加载中...</View>
            </View>
        )
    }

    return (
        <View className="worker-settlement-page">
            {/* 顶部数据看板 */}
            <View className="dashboard">
                <View className="main-stat">
                    <Text className="label">累计已结算(元)</Text>
                    <Text className="value">{stats.totalEarned}</Text>
                </View>
                <View className="sub-stats">
                    <View className="stat-item">
                        <Text className="val pending">{stats.pendingAmount}</Text>
                        <Text className="lbl">待结算(元)</Text>
                    </View>
                </View>
            </View>

            {/* 记录列表 */}
            <ScrollView scrollY className="record-list">
                <View className="list-title">最近明细</View>
                {records.length === 0 ? (
                    <View className="empty-state">暂无相关记录</View>
                ) : (
                    records.map(record => (
                        <View key={record.id} className="record-card">
                            <View className="card-top">
                                <View className="left">
                                    <Text className="tag">{getFeeTypeName(record.feeType)}</Text>
                                    <Text className="task-no">{record.installTaskNo || '无单号'}</Text>
                                </View>
                                <Text className="status settled">已出账</Text>
                            </View>
                            <View className="card-bottom">
                                <Text className="date">时间: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '--'}</Text>
                                <Text className="amount">+ {Number(record.amount || 0).toFixed(2)}</Text>
                            </View>
                            {record.description && (
                                <View className="record-desc">
                                    <Text>{record.description}</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    )
}
