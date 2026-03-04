import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import { useState } from 'react'
import { quoteService } from '@/services/quote-service'
import type { Quote, QuoteItem } from '@/types/business'
import './index.scss'

export default function QuoteView() {
    const [quoteId, setQuoteId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [quoteData, setQuoteData] = useState<Quote | null>(null)
    const [groupedItems, setGroupedItems] = useState<Record<string, QuoteItem[]>>({})

    useLoad((params) => {
        const id = params.id || ''
        if (id) {
            setQuoteId(id)
            fetchQuoteDetail(id)
        } else {
            setLoading(false)
        }
    })

    const fetchQuoteDetail = async (id: string) => {
        setLoading(true)
        try {
            const res = await quoteService.getQuoteDetail(id)
            if (res) {
                setQuoteData(res)

                // 按 roomName (空间/房间) 分组
                const groups: Record<string, QuoteItem[]> = {}
                res.items?.forEach(item => {
                    const roomName = item.roomName || '通用'
                    if (!groups[roomName]) groups[roomName] = []
                    groups[roomName].push(item)
                })
                setGroupedItems(groups)
            }
        } catch (error) {
            console.error('获取报价详情失败', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSign = () => {
        navigateTo({
            url: `/packageCustomer/quote-sign/index?id=${quoteId}`
        })
    }

    if (loading) {
        return (
            <View className="quote-view-page flex-center">
                <View className="loading">加载中...</View>
            </View>
        )
    }

    if (!quoteData) {
        return (
            <View className="quote-view-page flex-center">
                <Text>报价单不存在或无权限查看</Text>
            </View>
        )
    }

    return (
        <View className="quote-view-page">
            <ScrollView scrollY className="content-scroll">
                {/* 头部信息 */}
                <View className="header-card">
                    <Text className="title">{quoteData.title}</Text>
                    <View className="amount-wrapper">
                        <Text className="label">总计金额 (元)</Text>
                        <Text className="amount">¥{Number(quoteData.totalAmount).toLocaleString()}</Text>
                    </View>
                    <View className="info-grid">
                        <View className="info-item">
                            <Text className="label">客户姓名</Text>
                            <Text className="value">{quoteData.customerName}</Text>
                        </View>
                        <View className="info-item">
                            <Text className="label">报价单号</Text>
                            <Text className="value">{quoteData.quoteNo || quoteData.id}</Text>
                        </View>
                        <View className="info-item">
                            <Text className="label">创建时间</Text>
                            <Text className="value">{
                                // 取当前版本的创建时间或全局最后确认时间
                                quoteData.versions?.[0]?.createdAt
                                    ? new Date(quoteData.versions[0].createdAt).toLocaleString()
                                    : quoteData.confirmedAt || '-'
                            }</Text>
                        </View>
                        <View className="info-item">
                            <Text className="label">报价状态</Text>
                            <Text className="value">{
                                quoteData.status === 'CONFIRMED' ? '已确认' :
                                    quoteData.status === 'PENDING' ? '待确认' : quoteData.status
                            }</Text>
                        </View>
                    </View>
                </View>

                {/* 报价明细列表 */}
                <View className="detail-section">
                    <Text className="section-title">明细清单</Text>

                    {Object.entries(groupedItems).map(([roomName, items], index) => (
                        <View key={index} className="category-group">
                            <View className="category-header">
                                <Text className="category-name">{roomName}</Text>
                                <Text className="category-sub">共 {items.length} 项</Text>
                            </View>

                            <View className="item-list">
                                {items.map((item, idx) => (
                                    <View key={idx} className="quote-item">
                                        <View className="item-main">
                                            <Text className="item-name">{item.productName}</Text>
                                            <Text className="item-total">¥{Number(item.subtotal).toLocaleString()}</Text>
                                        </View>
                                        <View className="item-sub">
                                            <Text className="item-spec">{item.attributes?.spec || ''}</Text>
                                            <Text className="item-calc">¥{item.unitPrice} × {item.quantity} {item.unit}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {quoteData.items?.length === 0 && (
                        <View className="empty-items"><Text>暂无明细项</Text></View>
                    )}
                </View>

                {/* 底部留白 */}
                <View className="safe-area-bottom" />
            </ScrollView>

            {/* 底部操作栏 */}
            <View className="bottom-action-bar">
                {quoteData.status === 'CONFIRMED' ? (
                    <View className="btn-signed disabled">
                        <Text>已确认签字</Text>
                    </View>
                ) : (
                    <View className="btn-primary" onClick={handleSign}>
                        <Text>确认并电子签字</Text>
                    </View>
                )}
            </View>
        </View>
    )
}
