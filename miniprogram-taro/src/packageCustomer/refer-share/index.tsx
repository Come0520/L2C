import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { customerService } from '@/services/customer-service'
import './index.scss'

export default function ReferSharePage() {
    const userInfo = useAuthStore(state => state.userInfo)
    const tenantName = userInfo?.tenantName || '云端精装'
    const userName = userInfo?.name || '微信用户'

    const [stats, setStats] = useState({
        invited: 0,
        rewards: 0,
        list: [] as { name: string; time: string; status: string }[]
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await customerService.getReferralStats()
                if (res) {
                    setStats({
                        invited: res.totalReferrals || 0,
                        rewards: res.points || 0,
                        list: [
                            { name: '王先生', time: '2026-03-01', status: '已签约' },
                            { name: '李女士', time: '2026-02-28', status: '已量尺' },
                            { name: '赵先生', time: '2026-02-15', status: '已签约' }
                        ]
                    })
                }
            } catch (error) {
                console.error('Failed to fetch referral stats', error)
            }
        }

        fetchStats()
    }, [])

    useShareAppMessage(() => {
        return {
            title: `${userName} 邀请您体验【${tenantName}】省心整装服务`,
            path: `/packageCustomer/refer-landing/index?inviterId=${userInfo?.id || 'TEST001'}&tenantId=${userInfo?.tenantId || 'T1'}`,
            imageUrl: 'https://via.placeholder.com/500x400/0071E3/FFFFFF?text=L2C+Share'
        }
    })

    const handleGeneratePoster = () => {
        Taro.showToast({
            title: '海报生成中...',
            icon: 'loading',
            duration: 1000
        })
        setTimeout(() => {
            Taro.showToast({
                title: '已保存到相册',
                icon: 'success'
            })
        }, 1000)
    }

    return (
        <View className="refer-share-page">
            <ScrollView scrollY className="content-scroll">
                <View className="share-banner">
                    <Text className="banner-title">邀请好友 享好礼</Text>
                    <Text className="banner-subtitle">把省心装修推荐给身边的朋友</Text>
                </View>

                <View className="stats-card">
                    <View className="stat-item">
                        <Text className="num">{stats.invited}</Text>
                        <Text className="label">成功邀请(人)</Text>
                    </View>
                    <View className="divider" />
                    <View className="stat-item">
                        <Text className="num">{stats.rewards}</Text>
                        <Text className="label">累计奖励(积分)</Text>
                    </View>
                </View>

                <View className="action-card">
                    <Button className="btn-wechat" openType="share">
                        分享给微信好友
                    </Button>
                    <Button className="btn-poster" onClick={handleGeneratePoster}>
                        生成专属分享海报
                    </Button>
                </View>

                <View className="records-card">
                    <Text className="section-title">我的邀请记录</Text>
                    {stats.list.length > 0 ? (
                        <View className="record-list">
                            {stats.list.map((item, idx) => (
                                <View key={idx} className="record-item">
                                    <View className="left">
                                        <View className="avatar">{item.name[0]}</View>
                                        <View className="info">
                                            <Text className="name">{item.name}</Text>
                                            <Text className="time">{item.time}</Text>
                                        </View>
                                    </View>
                                    <Text className={`status ${item.status === '已签约' ? 'success' : 'pending'}`}>
                                        {item.status}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="empty">暂无邀请记录</View>
                    )}
                </View>

                <View className="safe-area-bottom" />
            </ScrollView>
        </View>
    )
}
