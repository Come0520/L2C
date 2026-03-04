import { View, Text, Canvas, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/services/api'
import { quoteService } from '@/services/quote-service'
import './index.scss'

export default function QuoteSign() {
    const canvasId = 'signCanvas'
    const [quoteId, setQuoteId] = useState<string>('')

    // 画布与绘制相关上下文
    const ctxRef = useRef<any>(null)
    const canvasNodeRef = useRef<any>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    // Dpr for HiDPI screens
    const dpr = Taro.getSystemInfoSync().pixelRatio || 1

    useLoad((params) => {
        setQuoteId(params.id || '')
    })

    useEffect(() => {
        initCanvas()
    }, [])

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

    // --- 签名绘制事件 ---
    const handleTouchStart = (e: any) => {
        if (!ctxRef.current) return
        const touch = e.touches[0]
        ctxRef.current.beginPath()
        ctxRef.current.moveTo(touch.x, touch.y)
        setIsDrawing(true)
    }

    const handleTouchMove = (e: any) => {
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
        ctxRef.current.beginPath() // Reset path
        setHasSignature(false)
    }

    const handleSubmit = () => {
        if (!hasSignature) {
            Taro.showToast({
                title: '请先完成签字',
                icon: 'none'
            })
            return
        }
        if (!quoteId) {
            Taro.showToast({ title: '参数错误', icon: 'error' })
            return
        }
        if (!canvasNodeRef.current) return

        Taro.showLoading({ title: '提交中...', mask: true })

        // 1. 生成图片
        Taro.canvasToTempFilePath({
            canvas: canvasNodeRef.current,
            success: async (res) => {
                const tempFilePath = res.tempFilePath

                try {
                    // 2. 上传图片到服务器
                    const uploadRes = await api.upload('/upload', tempFilePath, 'file')
                    if (!uploadRes.success || !uploadRes.data?.url) {
                        throw new Error(uploadRes.error || '上传签名失败')
                    }

                    const signatureUrl = uploadRes.data.url

                    // 3. 提交报价确认
                    const confirmRes = await quoteService.confirmQuote(quoteId, signatureUrl)

                    Taro.hideLoading()
                    Taro.showToast({
                        title: '签署成功',
                        icon: 'success',
                        duration: 2000
                    })

                    setTimeout(() => {
                        // 返回上一页刷新状态
                        Taro.navigateBack()
                    }, 2000)

                } catch (error: any) {
                    Taro.hideLoading()
                    Taro.showToast({
                        title: error.message || '确认失败，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: (err) => {
                Taro.hideLoading()
                console.error('Failed to export signature image:', err)
                Taro.showToast({
                    title: '生成截取图片失败',
                    icon: 'error'
                })
            }
        })
    }

    return (
        <View className="quote-sign-page">
            <View className="header-info">
                <Text className="title">请在下方空白处签名</Text>
                <Text className="subtitle">单号：{quoteId}</Text>
            </View>

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

            <View className="agreements">
                <Text className="text">签署即表示您已经阅读并同意</Text>
                <Text className="link">《施工报价协议条约》</Text>
                <Text className="text">，本报价仅作为预估参考，最终以实际测量确认为准。</Text>
            </View>

            <View className="action-bar">
                <Button className="btn btn-outline" onClick={handleClear}>重签</Button>
                <Button
                    className={`btn btn-primary ${!hasSignature ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                >
                    确认提交
                </Button>
            </View>
        </View>
    )
}
