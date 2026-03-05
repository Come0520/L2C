import { View, Text, ScrollView, Button, Image, Textarea } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { engineerService } from '@/services/engineer-service'
import { chooseAndUploadImages } from '@/utils/upload-helper'
import { useCheckIn } from './use-check-in'
import './index.scss'

export default function InstallUploadPage() {
    const [_taskId, setTaskId] = useState('')
    const { isCheckedIn, handleCheckIn } = useCheckIn(_taskId)

    const [beforeImages, setBeforeImages] = useState<string[]>([])
    const [afterImages, setAfterImages] = useState<string[]>([])
    const [remark, setRemark] = useState('')

    useLoad((params) => {
        if (params.taskId) setTaskId(params.taskId)
    })

    const takePhoto = async (type: 'before' | 'after') => {
        const currentList = type === 'before' ? beforeImages : afterImages
        const { urls, failedPaths } = await chooseAndUploadImages({
            maxCount: 9 - currentList.length,
            showLoading: true,
        })
        if (failedPaths.length > 0) {
            Taro.showToast({ title: `${failedPaths.length} 张上传失败`, icon: 'none' })
        }
        if (type === 'before') {
            setBeforeImages(prev => [...prev, ...urls].slice(0, 9))
        } else {
            setAfterImages(prev => [...prev, ...urls].slice(0, 9))
        }
    }

    const handleSubmit = async () => {
        if (!isCheckedIn) {
            Taro.showToast({ title: '请先打卡', icon: 'none' })
            return
        }
        if (afterImages.length === 0) {
            Taro.showToast({ title: '请至少上传一张完工图', icon: 'none' })
            return
        }
        Taro.showLoading({ title: '提交中...' })
        try {
            await engineerService.completeTask(_taskId, {
                photos: afterImages,
                notes: remark
            })
            Taro.hideLoading()
            Taro.showToast({ title: '回传成功', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 1500)
        } catch (err: any) {
            Taro.hideLoading()
            Taro.showToast({ title: err.message || '回传失败', icon: 'none' })
        }
    }

    return (
        <View className="install-upload-page">
            {/* 顶部打卡栏 */}
            <View className={`checkin-bar ${isCheckedIn ? 'checked' : ''}`}>
                <View className="info">
                    <Text className="title">{isCheckedIn ? '已到场打卡' : '等待打卡'}</Text>
                    <Text className="time">{isCheckedIn ? '10:05:32 (距客户10米内)' : '请在客户家门口打卡'}</Text>
                </View>
                <Button className="btn" onClick={handleCheckIn} disabled={isCheckedIn}>
                    {isCheckedIn ? '已打卡' : '实地打卡'}
                </Button>
            </View>

            <ScrollView scrollY className="content-scroll">
                <View className="upload-card card">
                    <View className="card-header">
                        <Text className="title">施工前环境记录</Text>
                        <Text className="subtitle">建议拍摄拆旧前或空窗状态，明确责任</Text>
                    </View>
                    <View className="images-grid">
                        {beforeImages.map((img, i) => (
                            <Image key={i} className="photo-thumb" src={img} mode="aspectFill" />
                        ))}
                        {beforeImages.length < 9 && (
                            <View className="photo-add" onClick={() => takePhoto('before')}>
                                <Text className="icon">📷</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="upload-card card">
                    <View className="card-header">
                        <Text className="title">完工验收照片 <Text className="required">*</Text></Text>
                        <Text className="subtitle">请拍摄整体效果及细节处（轨道/窗帘盒）</Text>
                    </View>
                    <View className="images-grid">
                        {afterImages.map((img, i) => (
                            <Image key={i} className="photo-thumb" src={img} mode="aspectFill" />
                        ))}
                        {afterImages.length < 9 && (
                            <View className="photo-add" onClick={() => takePhoto('after')}>
                                <Text className="icon">📷</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="remark-card card">
                    <Text className="title">作业备注</Text>
                    <Textarea
                        className="remark-input"
                        placeholder="如有耗材超耗、客户特殊要求等请在此说明"
                        maxlength={200}
                        value={remark}
                        onInput={(e) => setRemark(e.detail.value)}
                    />
                </View>
                <View className="safe-bottom-space"></View>
            </ScrollView>

            <View className="bottom-bar">
                <Button className="btn-submit" onClick={handleSubmit}>确认完工并回传系统</Button>
            </View>
        </View>
    )
}
