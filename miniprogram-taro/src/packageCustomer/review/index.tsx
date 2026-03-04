import { View, Text, Textarea, Button, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function Review() {
    const [orderId, setOrderId] = useState<string>('')
    const [rating, setRating] = useState<number>(0)
    const [content, setContent] = useState<string>('')
    const [photos, setPhotos] = useState<string[]>([])

    useLoad((params) => {
        setOrderId(params.id || 'OD-20260304-001')
    })

    // --- 照片上传 ---
    const handleChooseImage = () => {
        Taro.chooseMedia({
            count: 9 - photos.length,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempPaths = res.tempFiles.map(f => f.tempFilePath)
                setPhotos(prev => [...prev, ...tempPaths])
            }
        })
    }

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleStarClick = (index: number) => {
        setRating(index + 1)
    }

    const handleSubmit = () => {
        if (rating === 0) {
            Taro.showToast({ title: '请对服务进行评分', icon: 'none' })
            return
        }

        // 内容可以为空，但如果有其他业务要求可加上验证
        // if (!content.trim()) { ... }

        Taro.showLoading({ title: '提交中...' })

        // 模拟提交 API
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({
                title: '评价成功',
                icon: 'success',
                duration: 2000
            })
            setTimeout(() => {
                Taro.navigateBack()
            }, 2000)
        }, 1500)
    }

    return (
        <View className="review-page">
            <View className="page-header">
                <Text className="title">评价本次服务</Text>
                <Text className="subtitle">订单：{orderId}</Text>
            </View>

            {/* 评分区 */}
            <View className="section-card rating-section">
                <Text className="section-title">总体服务评分</Text>
                <View className="stars-container">
                    {[0, 1, 2, 3, 4].map(idx => (
                        <Text
                            key={idx}
                            className={`star ${idx < rating ? 'active' : ''}`}
                            onClick={() => handleStarClick(idx)}
                        >
                            ★
                        </Text>
                    ))}
                </View>
                <Text className="rating-desc">
                    {rating === 0 && '请点击星星进行评分'}
                    {rating === 1 && '非常不满意'}
                    {rating === 2 && '不满意'}
                    {rating === 3 && '一般'}
                    {rating === 4 && '满意'}
                    {rating === 5 && '非常满意'}
                </Text>
            </View>

            {/* 文本评价区 */}
            <View className="section-card content-section">
                <Text className="section-title">分享您的体验</Text>
                <View className="textarea-wrapper">
                    <Textarea
                        className="review-textarea"
                        placeholder="说说您的使用体验，师傅的服务态度，以及对产品的感受等..."
                        placeholderClass="textarea-placeholder"
                        maxlength={500}
                        value={content}
                        onInput={(e) => setContent(e.detail.value)}
                    />
                    <Text className="word-count">{content.length}/500</Text>
                </View>
            </View>

            {/* 图片上传区 */}
            <View className="section-card photo-section">
                <Text className="section-title">上传图片 (可选，{photos.length}/9)</Text>
                <View className="photo-grid">
                    {photos.map((src, idx) => (
                        <View key={idx} className="photo-item">
                            <Image src={src} mode="aspectFill" className="img" />
                            <View className="remove-btn" onClick={() => handleRemovePhoto(idx)}>✕</View>
                        </View>
                    ))}
                    {photos.length < 9 && (
                        <View className="upload-btn" onClick={handleChooseImage}>
                            <Text className="plus">+</Text>
                            <Text className="tip">添加照片</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* 底部按钮 */}
            <View className="bottom-action-bar">
                <Button
                    className={`btn-primary ${rating === 0 ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                >
                    提交评价
                </Button>
            </View>
        </View>
    )
}
