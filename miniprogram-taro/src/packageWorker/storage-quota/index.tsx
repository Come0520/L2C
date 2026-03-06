/**
 * 师傅端 · 我的存储
 *
 * @description 展示当前租户的媒体存储用量：
 * - 顶部大进度环（百分比 + 颜色区间）
 * - 用量明细：已用 / 剩余 / 上限
 * - 媒体文件列表（暂 Mock，后续接入 API）
 * - 清理上传成功文件的快捷入口（调用 useUploadQueue.clearUploaded）
 */
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { api } from '@/services/api'
import './index.scss'

/** 配额接口返回结构（对应后端 GET /api/miniprogram/storage/quota） */
interface QuotaData {
    usedMB: number
    totalMB: number
    usagePercent: number
    fileCount?: number
}

/** 根据使用率返回颜色等级 */
function getLevel(pct: number): 'safe' | 'warn' | 'danger' {
    if (pct >= 90) return 'danger'
    if (pct >= 70) return 'warn'
    return 'safe'
}

export default function StorageQuotaPage() {
    const [quota, setQuota] = useState<QuotaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useLoad(async () => {
        await fetchQuota()
    })

    /** 获取存储配额数据 */
    const fetchQuota = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/storage/quota')
            if (res.success && res.data) {
                setQuota(res.data)
            } else {
                setError(res.message || '获取存储信息失败')
            }
        } catch (err: any) {
            setError(err.message || '网络异常，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    /** 刷新 + 提示 */
    const handleRefresh = async () => {
        Taro.showLoading({ title: '刷新中...' })
        await fetchQuota()
        Taro.hideLoading()
    }

    if (loading) {
        return (
            <View className='storage-quota-page'>
                <View className='loading-wrap'>
                    <Text className='loading-text'>加载中...</Text>
                </View>
            </View>
        )
    }

    if (error || !quota) {
        return (
            <View className='storage-quota-page'>
                <View className='error-wrap'>
                    <Text className='error-icon'>⚠️</Text>
                    <Text className='error-msg'>{error || '暂无数据'}</Text>
                    <Button className='retry-btn' onClick={handleRefresh}>重新加载</Button>
                </View>
            </View>
        )
    }

    const level = getLevel(quota.usagePercent)
    const usedGB = (quota.usedMB / 1024).toFixed(2)
    const totalGB = (quota.totalMB / 1024).toFixed(1)
    const freeGB = ((quota.totalMB - quota.usedMB) / 1024).toFixed(2)

    return (
        <View className='storage-quota-page'>
            <ScrollView scrollY showScrollbar={false} className='content-scroll'>

                {/* ── 环形进度区 ── */}
                <View className={`quota-hero level-${level}`}>
                    {/* 文字代替 Canvas 圆环，保持轻量 */}
                    <View className='ring-wrap'>
                        <View className='ring-inner'>
                            <Text className='ring-pct'>{quota.usagePercent.toFixed(1)}%</Text>
                            <Text className='ring-label'>已使用</Text>
                        </View>
                    </View>
                    <Text className='hero-sub'>{usedGB} GB / {totalGB} GB</Text>
                </View>

                {/* ── 用量明细卡片 ── */}
                <View className='detail-card'>
                    <View className='detail-row'>
                        <Text className='detail-icon'>📦</Text>
                        <Text className='detail-label'>已使用</Text>
                        <Text className={`detail-value level-${level}`}>{usedGB} GB</Text>
                    </View>
                    <View className='detail-row'>
                        <Text className='detail-icon'>✅</Text>
                        <Text className='detail-label'>剩余空间</Text>
                        <Text className='detail-value safe'>{freeGB} GB</Text>
                    </View>
                    <View className='detail-row'>
                        <Text className='detail-icon'>🗄️</Text>
                        <Text className='detail-label'>存储上限</Text>
                        <Text className='detail-value'>{totalGB} GB</Text>
                    </View>
                    {quota.fileCount !== undefined && (
                        <View className='detail-row'>
                            <Text className='detail-icon'>🖼️</Text>
                            <Text className='detail-label'>媒体文件数</Text>
                            <Text className='detail-value'>{quota.fileCount} 个</Text>
                        </View>
                    )}
                </View>

                {/* ── 进度条 ── */}
                <View className='progress-section'>
                    <View className='progress-track'>
                        <View
                            className={`progress-fill level-${level}`}
                            style={{ width: `${Math.min(quota.usagePercent, 100)}%` }}
                        />
                    </View>
                    <View className='progress-labels'>
                        <Text className='progress-label-left'>0 GB</Text>
                        <Text className='progress-label-right'>{totalGB} GB</Text>
                    </View>
                </View>

                {/* ── 温馨提示 ── */}
                {level !== 'safe' && (
                    <View className={`tip-banner level-${level}`}>
                        <Text className='tip-icon'>{level === 'danger' ? '🚨' : '⚠️'}</Text>
                        <Text className='tip-text'>
                            {level === 'danger'
                                ? '存储空间即将耗尽！请联系管理员扩容，或删除旧媒体文件。'
                                : '存储空间使用率较高，建议及时清理旧录像或音频文件。'}
                        </Text>
                    </View>
                )}

                {/* ── 操作区 ── */}
                <View className='action-section'>
                    <Button className='action-btn refresh' onClick={handleRefresh}>🔄 刷新用量</Button>
                    <Button
                        className='action-btn contact'
                        onClick={() => Taro.showToast({ title: '请联系管理员申请扩容', icon: 'none', duration: 2500 })}
                    >
                        📩 申请扩容
                    </Button>
                </View>

                <View className='safe-bottom-space' />
            </ScrollView>
        </View>
    )
}
