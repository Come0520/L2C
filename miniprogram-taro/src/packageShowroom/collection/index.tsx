import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

/** 展厅单品数据 */
interface ShowroomItem {
    id: string
    title: string
    coverUrl: string
    type: 'article' | 'case' | 'product'
    overridePrice?: number
    price?: number
    description?: string
    viewCount?: number
}

interface ShareData {
    expired: boolean
    allowCustomerShare: boolean
    sales: {
        name: string
        avatar?: string
    }
    items: ShowroomItem[]
}

export default function ShowroomCollectionPage() {
    const [shareId, setShareId] = useState('')
    const [shareData, setShareData] = useState<ShareData | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    useLoad(async (params) => {
        const id = params.shareId || params.id
        if (!id) {
            setErrorMsg('访问链接无效')
            setLoading(false)
            return
        }
        setShareId(id)

        try {
            // 模拟调用获取分享详情
            // const res = await api.get(`/showroom/shares/${id}`)
            // if (res.success && !res.data.expired) {
            //   setShareData(res.data)
            // } else {
            //   setErrorMsg('分享链接已过期或不存在')
            // }

            // MOCK DATA for rendering currently, since backend route might not be accessible directly yet
            setTimeout(() => {
                setShareData({
                    expired: false,
                    allowCustomerShare: params.allowReshare === 'true',
                    sales: { name: '张经理' },
                    items: [
                        {
                            id: '1',
                            title: '现代极简真皮沙发组合',
                            coverUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
                            type: 'product',
                            overridePrice: 5999,
                            description: '进口头层牛皮，舒适坐感，提升客厅格调。'
                        },
                        {
                            id: '2',
                            title: '春晓雅筑全屋整装案例',
                            coverUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
                            type: 'case',
                            description: '120平米现代简约风，为您打造温馨之家。'
                        }
                    ]
                })
                setLoading(false)
            }, 500)
        } catch (err: any) {
            setErrorMsg(err.message || '获取内容失败')
            setLoading(false)
        }
    })

    // 控制右上角转发和二次分享
    useShareAppMessage(() => {
        if (!shareData?.allowCustomerShare) {
            Taro.showToast({ title: '发件人未允许二次分享', icon: 'none' })
            return {
                title: 'L2C云展厅',
                path: `/pages/landing/index` // 兜底到首页如果强行分享
            }
        }
        return {
            title: `${shareData.sales.name} 为您精选的展厅合集`,
            path: `/packageShowroom/collection/index?id=${shareId}&allowReshare=true`
        }
    })

    const goDetail = (item: ShowroomItem) => {
        Taro.navigateTo({ url: `/packageShowroom/${item.type}-detail/index?id=${item.id}` })
    }

    if (loading) {
        return <View className='collection-page loading'><Text>加载中...</Text></View>
    }

    if (errorMsg) {
        return (
            <View className='collection-page error'>
                <Text className='error-text'>{errorMsg}</Text>
            </View>
        )
    }

    if (!shareData) return null

    // 如果不允许客户分享，隐藏右上角分享按钮
    if (!shareData.allowCustomerShare) {
        Taro.hideShareMenu()
    } else {
        Taro.showShareMenu({ withShareTicket: true })
    }

    return (
        <View className='collection-page'>
            <View className='header'>
                <View className='sales-info'>
                    <View className='avatar' />
                    <Text className='name'>{shareData.sales.name} 为您精选</Text>
                </View>
                <Text className='desc'>欢迎随邀品鉴以下精选内容</Text>
            </View>

            <ScrollView scrollY className='items-list' showScrollbar={false}>
                <View className='card-grid'>
                    {shareData.items.map(item => (
                        <View key={item.id} className='card' onClick={() => goDetail(item)}>
                            <Image className='cover' src={item.coverUrl} mode='aspectFill' lazyLoad />
                            <View className='card-body'>
                                <View className='meta'>
                                    <Text className={`badge badge--${item.type}`}>
                                        {item.type === 'product' ? '商品' : item.type === 'case' ? '案例' : '文章'}
                                    </Text>
                                    {item.overridePrice && <Text className='price'>¥{item.overridePrice}</Text>}
                                </View>
                                <Text className='title'>{item.title}</Text>
                                <Text className='description'>{item.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}
