import { View, Text, Button, ScrollView, Checkbox, CheckboxGroup, Canvas, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

export default function WorkerOnboardingPage() {
    const userInfo = useAuthStore(state => state.userInfo)
    const [currentStep, setCurrentStep] = useState(0)
    const steps = ['服务规范', '电子合同', '技能考核']

    // ============================================
    // Step 1: 服务规范
    // ============================================
    const [agreedSpecs, setAgreedSpecs] = useState(false)

    // ============================================
    // Step 2: 电子签字 (弹窗式)
    // ============================================
    const [signatureUrl, setSignatureUrl] = useState('')
    const [showSignModal, setShowSignModal] = useState(false)
    const canvasRef = useRef<any>(null)
    const ctxRef = useRef<any>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const lastPos = useRef({ x: 0, y: 0 })

    const openSignModal = () => {
        setShowSignModal(true)
        setTimeout(() => {
            Taro.createSelectorQuery()
                .select('#workerSignCanvas')
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (res && res[0] && res[0].node) {
                        const canvas = res[0].node
                        const ctx = canvas.getContext('2d')
                        const dpr = Taro.getSystemInfoSync().pixelRatio
                        canvas.width = res[0].width * dpr
                        canvas.height = res[0].height * dpr
                        ctx.scale(dpr, dpr)
                        ctx.strokeStyle = '#000000'
                        ctx.lineWidth = 4
                        ctx.lineCap = 'round'
                        ctx.lineJoin = 'round'
                        ctxRef.current = ctx
                        canvasRef.current = canvas
                    }
                })
        }, 500)
    }

    const handleTouchStart = (e: any) => {
        if (!ctxRef.current) return
        setIsDrawing(true)
        const { x, y } = e.touches[0]
        lastPos.current = { x, y }
        ctxRef.current.beginPath()
        ctxRef.current.moveTo(x, y)
    }

    const handleTouchMove = (e: any) => {
        if (!isDrawing || !ctxRef.current) return
        const { x, y } = e.touches[0]
        ctxRef.current.lineTo(x, y)
        ctxRef.current.stroke()
        lastPos.current = { x, y }
    }

    const handleTouchEnd = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        if (!ctxRef.current || !canvasRef.current) return
        const canvas = canvasRef.current
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
    }

    const confirmSignature = () => {
        if (!canvasRef.current) return
        Taro.canvasToTempFilePath({
            canvas: canvasRef.current,
            success: (res) => {
                setSignatureUrl(res.tempFilePath)
                setShowSignModal(false)
            },
            fail: () => {
                Taro.showToast({ title: '保存签名失败', icon: 'none' })
            }
        })
    }

    // ============================================
    // Step 3: 技能考核
    // ============================================
    const examData = [
        {
            id: 1,
            title: '到达客户现场后，第一步应该做什么？',
            options: ['直接开始施工', '主动出示工牌并穿戴鞋套', '向客户推销其他服务']
        },
        {
            id: 2,
            title: '遇到量尺数据与现场不符时如何处理？',
            options: ['自行修改数据继续安装', '强行安装并向客户解释', '标记异常并联系设计师或销售确认']
        }
    ]
    const [answers, setAnswers] = useState<Record<number, number>>({})

    const handleSelectAnswer = (qId: number, oIdx: number) => {
        setAnswers(prev => ({ ...prev, [qId]: oIdx }))
    }

    const submitOnboarding = () => {
        if (Object.keys(answers).length < examData.length) {
            Taro.showToast({ title: '请回答所有题目', icon: 'none' })
            return
        }
        // 检查答案 (简单 mock)
        const passed = answers[1] === 1 && answers[2] === 2
        if (!passed) {
            Taro.showModal({
                title: '考核未通过',
                content: '答题有误，请重新检查《服务规范》',
                showCancel: false
            })
            return
        }

        Taro.showLoading({ title: '提交入驻信息...' })
        setTimeout(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '入驻成功！', icon: 'success' })
            setTimeout(() => {
                Taro.switchTab({ url: '/pages/workbench/index' })
            }, 1500)
        }, 1500)
    }

    // ============================================
    // Rendering
    // ============================================
    return (
        <View className="onboarding-page">
            {/* 顶部进度条 */}
            <View className="step-header">
                {steps.map((step, idx) => (
                    <View key={idx} className={`step-item ${currentStep === idx ? 'active' : ''} ${currentStep > idx ? 'completed' : ''}`}>
                        <View className="circle">{currentStep > idx ? '✓' : idx + 1}</View>
                        <Text className="label">{step}</Text>
                    </View>
                ))}
                <View className="progress-line" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></View>
            </View>

            <ScrollView scrollY className="content-scroll">
                {/* Step 1: 服务规范 */}
                {currentStep === 0 && (
                    <View className="step-content">
                        <View className="card">
                            <Text className="title">L2C平台师傅服务行为规范</Text>
                            <View className="rich-text">
                                <Text className="para">第一条 本规范适用于所有平台入驻安装、量尺师傅。</Text>
                                <Text className="para">第二条 接单后需在1小时内联系客户确认上门时间。</Text>
                                <Text className="para">第三条 入户必须穿戴绝缘鞋套，并铺设施工保护垫。</Text>
                                <Text className="para">第四条 严禁在客户家中吸烟、大声喧哗、索要额外小费。</Text>
                                <Text className="para">第五条 施工完毕后必须清理现场，邀约客户进行线上验收。</Text>
                            </View>
                        </View>
                        <View className="action-area">
                            <CheckboxGroup onChange={(e) => setAgreedSpecs(e.detail.value.length > 0)}>
                                <Checkbox value="agree" checked={agreedSpecs} color="#007AFF">
                                    <Text className="checkbox-label">我已仔细阅读并承诺遵守上述服务规范</Text>
                                </Checkbox>
                            </CheckboxGroup>
                            <Button
                                className={`next-btn ${agreedSpecs ? 'active' : ''}`}
                                disabled={!agreedSpecs}
                                onClick={() => setCurrentStep(1)}
                            >
                                下一步
                            </Button>
                        </View>
                    </View>
                )}

                {/* Step 2: 电子合同 */}
                {currentStep === 1 && (
                    <View className="step-content">
                        <View className="card">
                            <Text className="title">承揽合作协议</Text>
                            <View className="rich-text">
                                <Text className="para">甲方：L2C系统平台服务商</Text>
                                <Text className="para">乙方：{userInfo?.name || '王师傅'} (身份证号：***)</Text>
                                <Text className="para">经甲乙双方友好协商，就平台接单承揽服务达成如下协议...</Text>
                                <Text className="para">1. 乙方作为独立承揽人承担相关责任。</Text>
                                <Text className="para">2. 结算金额按平台订单展示为准，按月结算。</Text>
                            </View>
                        </View>

                        <View className="signature-area">
                            <Text className="label">乙方落款签字：</Text>
                            {signatureUrl ? (
                                <View className="signed-preview" onClick={openSignModal}>
                                    <Image src={signatureUrl} mode="aspectFit" className="sign-img" />
                                    <Text className="re-sign">重新签字</Text>
                                </View>
                            ) : (
                                <View className="unsign-box" onClick={openSignModal}>
                                    <Text>点击此处进行手写签字</Text>
                                </View>
                            )}
                        </View>

                        <View className="action-area double">
                            <Button className="prev-btn" onClick={() => setCurrentStep(0)}>上一步</Button>
                            <Button
                                className={`next-btn ${signatureUrl ? 'active' : ''}`}
                                disabled={!signatureUrl}
                                onClick={() => setCurrentStep(2)}
                            >
                                下一步
                            </Button>
                        </View>
                    </View>
                )}

                {/* Step 3: 技能考核 */}
                {currentStep === 2 && (
                    <View className="step-content">
                        <View className="exam-card">
                            <Text className="title">入驻技能考核</Text>
                            <Text className="subtitle">完成以下问答，全部正确即可入驻接单</Text>

                            {examData.map((q, qIndex) => (
                                <View key={q.id} className="question-item">
                                    <Text className="question-title">{qIndex + 1}. {q.title}</Text>
                                    <View className="options">
                                        {q.options.map((opt, oIdx) => (
                                            <View
                                                key={oIdx}
                                                className={`option ${answers[q.id] === oIdx ? 'selected' : ''}`}
                                                onClick={() => handleSelectAnswer(q.id, oIdx)}
                                            >
                                                <Text className="radio-circle">{(answers[q.id] === oIdx) && <View className="inner" />}</Text>
                                                <Text className="opt-text">{opt}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View className="action-area double">
                            <Button className="prev-btn" onClick={() => setCurrentStep(1)}>上一步</Button>
                            <Button
                                className={`next-btn ${Object.keys(answers).length === examData.length ? 'active' : ''}`}
                                disabled={Object.keys(answers).length < examData.length}
                                onClick={submitOnboarding}
                            >
                                马上提交
                            </Button>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* 签字弹窗 */}
            {showSignModal && (
                <View className="sign-modal">
                    <View className="modal-content">
                        <View className="modal-header">
                            <Text className="modal-title">请在下方空白处手写签字</Text>
                            <Text className="close-btn" onClick={() => setShowSignModal(false)}>×</Text>
                        </View>
                        <View className="canvas-container">
                            <Canvas
                                type="2d"
                                id="workerSignCanvas"
                                className="sign-canvas"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            />
                        </View>
                        <View className="modal-footer">
                            <Button className="clear-btn" onClick={clearCanvas}>清除重写</Button>
                            <Button className="confirm-btn" onClick={confirmSignature}>确认签名</Button>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
}
