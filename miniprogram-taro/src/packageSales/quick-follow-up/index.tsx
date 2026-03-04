import { View, Text, ScrollView, Textarea, Picker, Button, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { leadService } from '@/services/lead-service'
import { api } from '@/services/api'
import './index.scss'

export default function QuickFollowUpPage() {
    const [leadId, setLeadId] = useState('')
    const [content, setContent] = useState('')
    const [nextDate, setNextDate] = useState('')
    const [images, setImages] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    useLoad((params) => {
        if (params.id) setLeadId(params.id)
    })

    const handleDateChange = (e) => setNextDate(e.detail.value)

    const handleChooseImage = () => {
        Taro.chooseMedia({
            count: 3 - images.length,
            mediaType: ['image'],
            success: (res) => {
                const paths = res.tempFiles.map(f => f.tempFilePath)
                setImages(prev => [...prev, ...paths])
            }
        })
    }

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) {
            return Taro.showToast({ title: '内容或图片不能为空', icon: 'none' })
        }
        if (!leadId) {
            return Taro.showToast({ title: '线索ID缺失', icon: 'error' })
        }

        setSubmitting(true)
        Taro.showLoading({ title: '提交中...', mask: true })

        try {
            // 1. 上传图片 (如有)
            let finalContent = content.trim()
            if (images.length > 0) {
                Taro.showLoading({ title: '上传图片...', mask: true })
                const uploadTasks = images.map(path => api.upload('/upload', path, 'file'))
                const uploadedUrls = await Promise.all(uploadTasks)

                // 后端表结构暂无 images 字段，将图片附件以 Markdown 格式或纯文本拼接到 content 后
                const urlString = uploadedUrls.map((res: any, i) => `\n[附件${i + 1}]: ${res.data?.url || ''}`).join('')
                finalContent += `\n${urlString}`
            }

            // 2. 拼接计划跟进日期（因后端目前可能未处理 nextFollowupAt，也追加在正文作为备用记录）
            if (nextDate) {
                finalContent += `\n\n[计划下次跟进: ${nextDate}]`
            }

            // 3. 提交 API
            Taro.showLoading({ title: '保存记录...', mask: true })
            await leadService.addFollowUp(leadId, {
                content: finalContent,
                type: 'PHONE_CALL', // TODO: 可扩展跟进方式选择，当前默认电话
                nextFollowUpDate: nextDate || undefined // 传给后端备用
            })

            Taro.hideLoading()
            Taro.showToast({ title: '提交成功', icon: 'success' })
            setTimeout(() => {
                Taro.navigateBack()
            }, 1000)

        } catch (error) {
            Taro.hideLoading()
            Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <View className="quick-follow-page">
            <ScrollView scrollY className="content-scroll">
                <View className="form-card card">
                    <Textarea
                        className="content-input"
                        placeholder="记录这次跟进的详细情况、客户的顾虑或阶段性成果..."
                        value={content}
                        onInput={(e) => setContent(e.detail.value)}
                        maxlength={500}
                    />

                    <View className="image-uploader">
                        {images.map((img, idx) => (
                            <View key={idx} className="img-box">
                                <Image src={img} mode="aspectFill" className="img" />
                                <View className="rm-btn" onClick={() => handleRemoveImage(idx)}><Text className="x-icon">×</Text></View>
                            </View>
                        ))}
                        {images.length < 3 && (
                            <View className="upload-btn" onClick={handleChooseImage}>
                                <Text className="plus">+</Text>
                                <Text className="lbl">上传图片</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="form-card card settings">
                    <View className="set-row">
                        <Text className="label">📌 下次跟踪日期</Text>
                        <Picker mode="date" onChange={handleDateChange} value={nextDate}>
                            <View className="picker-val">
                                {nextDate ? <Text className="date-txt">{nextDate}</Text> : <Text className="placeholder">请选择 (选填)</Text>}
                                <Text className="arrow">{'>'}</Text>
                            </View>
                        </Picker>
                    </View>
                </View>

                <Button className="btn-submit" disabled={submitting} onClick={handleSubmit}>发布跟进</Button>
            </ScrollView>
        </View>
    )
}
