/**
 * 分享拓客面板页面
 *
 * @description 销售员分享展厅内容的核心界面。
 * 功能：
 * 1. 加载我的分享链接列表（GET /showroom/share/my-links）
 * 2. 展示每条链接的浏览次数和停留时长
 * 3. 对每条链接触发"发送给朋友"或"生成海报"操作
 */
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

/** 分享链接数据结构 */
interface ShareLink {
    id: string
    title: string
    coverUrl?: string
    totalViews: number
    totalDuration: number  // 累计停留时长（秒）
    createdAt: string
}

export default function ShareHubPage() {
    const { userInfo } = useAuthStore((s) => s)
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
    const [loading, setLoading] = useState(false)

    useLoad(async (_params) => {
        await loadMyShareLinks()
    })

    /** 加载我的分享链接列表 */
    const loadMyShareLinks = async () => {
        setLoading(true)
        try {
            const res = await api.get('/showroom/share/my-links', {
                showLoading: false,
            })
            if (res.success && Array.isArray(res.data)) {
                setShareLinks(res.data)
            }
        } catch (_) {
            // 静默处理，不影响页面基础交互
        } finally {
            setLoading(false)
        }
    }

    /** 格式化停留时长 */
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}秒`
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return s > 0 ? `${m}分${s}秒` : `${m}分钟`
    }

    /** 点击分享拓客 */
    const handleShare = (item: ShareLink) => {
        Taro.showActionSheet({
            itemList: ['发送给朋友 (追踪线索)', '生成专属海报'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    // 发送给朋友——调用 shareAppMessage（需提前在页面生命周期注册）
                    const shareUrl = `/packageShowroom/capsule/index?shareId=${item.id}&salesId=${userInfo?.id}&tenantId=${userInfo?.tenantId}&mode=view`
                        ; (Taro as any).shareAppMessage({
                            title: item.title || `${userInfo?.name || '我'}邀您浏览展厅`,
                            path: shareUrl,
                            imageUrl: item.coverUrl || '',
                        })
                } else {
                    Taro.showLoading({ title: '海报生成中...' })
                    setTimeout(() => {
                        Taro.hideLoading()
                        Taro.showToast({ title: '已保存至相册', icon: 'success' })
                    }, 1000)
                }
            }
        })
    }

    return (
        <View className='share-hub-page'>
            {/* 汇总统计头部 */}
            <View className='header-stats'>
                <View className='stat-box'>
                    <Text className='val'>{shareLinks.reduce((sum, l) => sum + l.totalViews, 0)}</Text>
                    <Text className='lbl'>累计浏览</Text>
                </View>
                <View className='stat-box'>
                    <Text className='val'>{shareLinks.length}</Text>
                    <Text className='lbl'>分享总数</Text>
                </View>
                <View className='stat-box'>
                    <Text className='val'>
                        {shareLinks.length > 0
                            ? formatDuration(Math.round(shareLinks.reduce((sum, l) => sum + l.totalDuration, 0) / shareLinks.length))
                            : '0秒'
                        }
                    </Text>
                    <Text className='lbl'>平均停留</Text>
                </View>
            </View>

            {/* 分享链接列表 */}
            {loading ? (
                <View className='loading-state'>
                    <Text className='loading-text'>加载中...</Text>
                </View>
            ) : shareLinks.length === 0 ? (
                <View className='empty-state'>
                    <Text className='empty-text'>暂无分享链接</Text>
                    <Text className='empty-hint'>点击展厅素材右上角分享按钮，开始追踪客户浏览行为</Text>
                </View>
            ) : (
                <ScrollView scrollY className='material-list'>
                    {shareLinks.map(item => (
                        <View key={item.id} className='material-card card'>
                            {item.coverUrl ? (
                                <Image src={item.coverUrl} mode='aspectFill' className='cover-img' lazyLoad />
                            ) : (
                                <View className='cover-placeholder' />
                            )}
                            <View className='info-area'>
                                <View>
                                    <Text className='title'>{item.title}</Text>
                                    <View className='metrics'>
                                        <Text className='num'>{item.totalViews} 浏览 · 均留 {formatDuration(item.totalDuration)}</Text>
                                    </View>
                                </View>
                                <Button className='btn-share' onClick={() => handleShare(item)}>分享拓客</Button>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    )
}
