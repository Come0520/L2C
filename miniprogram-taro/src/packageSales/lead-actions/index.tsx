import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { leadService } from '@/services/lead-service'
import './index.scss'

export default function LeadActionsPage() {
    const [leadId, setLeadId] = useState('')

    useLoad((params) => {
        if (params.id) setLeadId(params.id)
    })

    const handleAbandon = () => {
        Taro.showModal({
            title: '退回公海',
            content: '确认将该线索退回公海？退回后其他销售或管理员即可再次认领或分配。',
            confirmColor: '#FF3B30',
            success: async (res) => {
                if (res.confirm) {
                    if (!leadId) return
                    Taro.showLoading({ title: '处理中...', mask: true })
                    try {
                        await leadService.releaseLead(leadId)
                        Taro.hideLoading()
                        Taro.showToast({ title: '已退回', icon: 'success' })
                        setTimeout(() => Taro.navigateBack({ delta: 2 }), 1500) // 返至线索列表
                    } catch (error) {
                        Taro.hideLoading()
                        Taro.showToast({ title: '操作失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const handleVoid = () => {
        Taro.showModal({
            title: '作废线索',
            content: '确认作废该线索？此操作不可逆。',
            confirmColor: '#FF3B30',
            success: async (res) => {
                if (res.confirm) {
                    if (!leadId) return
                    Taro.showLoading({ title: '处理中...', mask: true })
                    try {
                        await leadService.voidLead(leadId, '小程序端手动操作作废')
                        Taro.hideLoading()
                        Taro.showToast({ title: '已作废', icon: 'success' })
                        setTimeout(() => Taro.navigateBack({ delta: 2 }), 1500)
                    } catch (error) {
                        Taro.hideLoading()
                        Taro.showToast({ title: '操作失败', icon: 'none' })
                    }
                }
            }
        })
    }

    const handleTransfer = () => {
        Taro.showToast({ title: '转交功能即将上线', icon: 'none' })
    }

    return (
        <View className="lead-actions-page">
            <ScrollView scrollY className="content-scroll">
                <View className="section">
                    <Text className="section-title">高级操作</Text>

                    <View className="card action-card" onClick={handleTransfer}>
                        <View className="info">
                            <Text className="title">分配/转交线索</Text>
                            <Text className="desc">将该线索转移给其他销售人员</Text>
                        </View>
                        <Text className="arrow">{'>'}</Text>
                    </View>

                    <View className="card action-card danger" onClick={handleAbandon}>
                        <View className="info">
                            <Text className="title">退回公海 (放弃)</Text>
                            <Text className="desc">放弃该线索跟进，放入公海池供他人认领</Text>
                        </View>
                        <Text className="arrow">{'>'}</Text>
                    </View>

                    <View className="card action-card danger" onClick={handleVoid}>
                        <View className="info">
                            <Text className="title">作废线索</Text>
                            <Text className="desc">标记为无效线索，中止一切跟进并归档</Text>
                        </View>
                        <Text className="arrow">{'>'}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}
