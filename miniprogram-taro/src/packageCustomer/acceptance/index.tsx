import { View, Text, Canvas, Button, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/services/api'
import { customerService } from '@/services/customer-service'
import './index.scss'

export default function Acceptance() {
    const [orderId, setOrderId] = useState<string>('')
    const [photos, setPhotos] = useState<string[]>([])

    // 画布与绘制相关上下文
    const canvasId = 'acceptanceCanvas'
    const ctxRef = useRef<any>(null)
    const canvasNodeRef = useRef<any>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    // Dpr for HiDPI screens
    const dpr = Taro.getSystemInfoSync().pixelRatio || 1

    useLoad((params) => {
        setOrderId(params.id || 'OD-20260304-001')
    })

    useEffect(() => {
        const initCanvas = () => {
            Taro.nextTick(() => {
                Taro.createSelectorQuery()
                    .select(`#${canvasId}`)
                    .fields({ node: true, size: true })
                    .exec((res) => {
                        if (res && res[0] && res[0].node) {
                            const canvas = res[0].node
                            const ctx = canvas.getContext('2d')

                            // Set true size
                            canvas.width = res[0].width * dpr
                            canvas.height = res[0].height * dpr

                            ctx.scale(dpr, dpr)
                            ctx.lineCap = 'round'
                            ctx.lineJoin = 'round'
                            ctx.lineWidth = 4
                            ctx.strokeStyle = '#1D1D1F' // $text-title

                            ctxRef.current = ctx
                            canvasNodeRef.current = canvas
                        }
                    })
            })
        }

        initCanvas()
    }, [dpr])

    // --- 照片上传 ---
    const handleChooseImage = () => {
        Taro.chooseMedia({
            count: 4 - photos.length,
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

    // --- 签名绘制事件 ---
    const handleTouchStart = (e: any) => {
        if (!ctxRef.current) return
        const touch = e.touches[0]
        ctxRef.current.beginPath()
        ctxRef.current.moveTo(touch.x, touch.y)
        setIsDrawing(true)
    }

    const handleTouchMove = (e: any) => {
        // 阻止外层滚动导致无法顺畅签字
        e.stopPropagation()
        e.preventDefault()

        if (!ctxRef.current || !isDrawing) return
        const touch = e.touches[0]
        ctxRef.current.lineTo(touch.x, touch.y)
        ctxRef.current.stroke()
        setHasSignature(true)
    }

    const handleTouchEnd = () => {
        setIsDrawing(false)
    }

    // --- 操作按钮 ---
    const handleClear = () => {
        if (!ctxRef.current || !canvasNodeRef.current) return
        ctxRef.current.clearRect(0, 0, canvasNodeRef.current.width, canvasNodeRef.current.height)
        ctxRef.current.beginPath()
        setHasSignature(false)
    }

    const handleSubmit = () => {
        if (photos.length === 0) {
            Taro.showToast({ title: '请至少上传一张验收现场照片', icon: 'none' })
            return
        }
        if (!hasSignature) {
            Taro.showToast({ title: '请完成电子签字', icon: 'none' })
            return
        }

        if (!canvasNodeRef.current) return

        Taro.showLoading({ title: '提交验收中...' })

        // 1. 生成签名图片
        Taro.canvasToTempFilePath({
            canvas: canvasNodeRef.current,
            success: async (res) => {
                const signTempPath = res.tempFilePath
                try {
                    // 2. 并发上传图片和签名
                    const photoUploadTasks = photos.map(p => api.upload(p, 'acceptance'))
                    const signUploadTask = api.upload(signTempPath, 'signature')

                    const [photoResList, signRes] = await Promise.all([
                        Promise.all(photoUploadTasks),
                        signUploadTask
                    ])

                    const uploadedPhotos = photoResList.map(r => r.data)
                    const uploadedSign = signRes.data

                    // 3. 调用业务 API
                    await customerService.acceptInstallation(orderId, {
                        signatureUrl: uploadedSign,
                        photoUrls: uploadedPhotos
                    })

                    Taro.hideLoading()
                    Taro.showToast({
                        title: '验收成功',
                        icon: 'success',
                        duration: 2000
                    })
                    setTimeout(() => {
                        Taro.navigateBack()
                    }, 2000)
                } catch (err: any) {
                    Taro.hideLoading()
                    Taro.showToast({ title: err.message || '验收提交失败', icon: 'none' })
                }
            },
            fail: (err) => {
                Taro.hideLoading()
                console.error('Failed to export signature image:', err)
                Taro.showToast({ title: '生成签字失败', icon: 'error' })
            }
        })
    }

    return (
        <View className="acceptance-page">
            <ScrollView scrollY className="content-scroll">
                <View className="page-header">
                    <Text className="title">安装验收确认单</Text>
                    <Text className="subtitle">订单：{orderId}</Text>
                </View>

                {/* 照片回传区 */}
                <View className="section-card">
                    <Text className="section-title">现场照片归档 ({photos.length}/4)</Text>
                    <View className="photo-grid">
                        {photos.map((src, idx) => (
                            <View key={idx} className="photo-item">
                                <Image src={src} mode="aspectFill" className="img" />
                                <View className="remove-btn" onClick={() => handleRemovePhoto(idx)}>✕</View>
                            </View>
                        ))}
                        {photos.length < 4 && (
                            <View className="upload-btn" onClick={handleChooseImage}>
                                <Text className="plus">+</Text>
                                <Text className="tip">添加照片</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 签字区 */}
                <View className="section-card">
                    <Text className="section-title">客户电子签字</Text>
                    <View className="canvas-container">
                        <Canvas
                            type="2d"
                            id={canvasId}
                            className="sign-canvas"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            disableScroll
                        />
                        {!hasSignature && (
                            <View className="canvas-placeholder">
                                <Text>在此区域手写签名</Text>
                            </View>
                        )}
                    </View>
                    <View className="clear-row">
                        <Text className="clear-text" onClick={handleClear}>[重新签名]</Text>
                    </View>
                </View>

                <View className="agreements">
                    <Text className="text">签署即代表您确认现场安装数量、尺寸、工艺符合要求，无任何破损及缺陷。</Text>
                </View>

                <View className="safe-area-bottom" />
            </ScrollView>

            {/* 底部按钮 */}
            <View className="bottom-action-bar">
                <Button
                    className={`btn-primary ${(!hasSignature || photos.length === 0) ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                >
                    确认并完成验收
                </Button>
            </View>
        </View>
    )
}
