import { useState, useRef } from 'react'
import { api } from '@/services/api'

/** 单条上传任务 */
export interface UploadItem {
    /** 唯一 ID */
    id: string
    /** 本地临时文件路径 */
    localPath: string
    /** 上传接口路径 */
    uploadUrl: string
    /** 文件类型 */
    type: 'image' | 'video' | 'audio'
    /** 当前状态 */
    status: 'pending' | 'uploading' | 'uploaded' | 'failed'
    /** 上传成功后的远端 URL */
    remoteUrl?: string
    /** 创建时间 */
    createdAt: number
}

/** 入队参数 */
interface EnqueueParams {
    localPath: string
    uploadUrl: string
    type: 'image' | 'video' | 'audio'
}

interface UploadQueueState {
    /** 当前队列所有项 */
    items: UploadItem[]
    /** 将文件加入上传队列 */
    enqueue: (params: EnqueueParams) => void
    /** 上传所有 pending 的项 */
    flush: () => Promise<void>
    /** 将所有 failed 重置为 pending，以便下次 flush 重试 */
    retryFailed: () => void
    /** 清除已上传的成功记录 */
    clearUploaded: () => void
}

let _idCounter = 0
const genId = () => `upload_${Date.now()}_${++_idCounter}`

/**
 * useUploadQueue — 离线上传队列 Hook
 *
 * 设计要点：
 * - useRef 存最新 items 引用，避免闭包陈旧问题
 * - flush 先快照 pending 列表，再逐项上传并更新状态
 */
export function useUploadQueue(): UploadQueueState {
    const [items, setItems] = useState<UploadItem[]>([])
    // 用 ref 保持最新 items，解决闭包内访问旧 state 的问题
    const itemsRef = useRef<UploadItem[]>([])

    const syncItems = (updater: (prev: UploadItem[]) => UploadItem[]) => {
        setItems(prev => {
            const next = updater(prev)
            itemsRef.current = next
            return next
        })
    }

    const enqueue = (params: EnqueueParams) => {
        const item: UploadItem = {
            id: genId(),
            ...params,
            status: 'pending',
            createdAt: Date.now(),
        }
        syncItems(prev => [...prev, item])
    }

    const flush = async () => {
        // 快照当前所有 pending 项
        const pendingItems = itemsRef.current.filter(i => i.status === 'pending')
        if (pendingItems.length === 0) return

        // 标记为 uploading
        syncItems(prev =>
            prev.map(i => (i.status === 'pending' ? { ...i, status: 'uploading' } : i))
        )

        // 逐项上传（串行，避免并发压带宽）
        for (const item of pendingItems) {
            try {
                const res = await api.upload(item.uploadUrl, item.localPath, 'file') as { data?: { url?: string } }
                const remoteUrl = res?.data?.url
                syncItems(prev =>
                    prev.map(i =>
                        i.id === item.id ? { ...i, status: 'uploaded', remoteUrl } : i
                    )
                )
            } catch {
                syncItems(prev =>
                    prev.map(i =>
                        i.id === item.id ? { ...i, status: 'failed' } : i
                    )
                )
            }
        }
    }

    const retryFailed = () => {
        syncItems(prev =>
            prev.map(i => (i.status === 'failed' ? { ...i, status: 'pending' } : i))
        )
    }

    const clearUploaded = () => {
        syncItems(prev => prev.filter(i => i.status !== 'uploaded'))
    }

    return { items, enqueue, flush, retryFailed, clearUploaded }
}
