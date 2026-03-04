import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function ShareHubPage() {
    const [materials] = useState([
        { id: 1, type: 'article', title: '2026 窗帘流行趋势大盘点', views: 1205, shares: 45, cover: 'https://via.placeholder.com/300x200' },
        { id: 2, type: 'case', title: '星河湾 180平极简原木风全案', views: 890, shares: 32, cover: 'https://via.placeholder.com/300x200' },
        { id: 3, type: 'poster', title: '国庆大促限量海报', views: 500, shares: 120, cover: 'https://via.placeholder.com/300x400' }
    ])

    const handleShare = (_item) => {
        Taro.showActionSheet({
            itemList: ['发送给朋友 (追踪线索)', '生成专属海报'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    Taro.showToast({ title: '请点击右上角转发', icon: 'none' })
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
        <View className="share-hub-page">
            <View className="header-stats">
                <View className="stat-box">
                    <Text className="val">128</Text>
                    <Text className="lbl">今日引流</Text>
                </View>
                <View className="stat-box">
                    <Text className="val">1,509</Text>
                    <Text className="lbl">累计引流</Text>
                </View>
                <View className="stat-box">
                    <Text className="val">42</Text>
                    <Text className="lbl">收获线索</Text>
                </View>
            </View>

            <ScrollView scrollY className="material-list">
                {materials.map(item => (
                    <View key={item.id} className="material-card card">
                        <Image src={item.cover} mode="aspectFill" className="cover-img" />
                        <View className="info-area">
                            <View>
                                <Text className="title">{item.title}</Text>
                                <View className="metrics">
                                    <Text className="tag">{item.type === 'article' ? '文章' : item.type === 'case' ? '案例' : '海报'}</Text>
                                    <Text className="num">{item.views} 浏览 · {item.shares} 转发</Text>
                                </View>
                            </View>
                            <Button className="btn-share" onClick={() => handleShare(item)}>分享拓客</Button>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    )
}
