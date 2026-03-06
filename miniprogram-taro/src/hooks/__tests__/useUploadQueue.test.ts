/**
 * useUploadQueue — 离线上传队列 TDD 测试
 *
 * T9: 添加文件到队列后，items 更新，status 为 'pending'
 * T10: 有网络时调用 flush，所有 pending 文件尝试上传
 * T11: 上传失败的文件 status 保持 'failed'，可重试
 */
import { renderHook, act } from '@testing-library/react'
import Taro from '@tarojs/taro'

// 模拟 api.upload
const mockUpload = jest.fn()
jest.mock('@/services/api', () => ({
    api: {
        upload: (...args: unknown[]) => mockUpload(...args),
    },
}))

import { useUploadQueue } from '../useUploadQueue'

beforeEach(() => {
    jest.clearAllMocks()
        // 默认网络在线
        ; (Taro.getNetworkType as jest.Mock).mockResolvedValue({ networkType: 'wifi' })
})

describe('useUploadQueue — 离线上传队列', () => {
    // T9: 添加文件到队列，状态为 pending
    it('T9: enqueue() 后 items 增加一条 pending 记录', async () => {
        const { result } = renderHook(() => useUploadQueue())

        expect(result.current.items).toHaveLength(0)

        act(() => {
            result.current.enqueue({
                localPath: 'file://tmp/photo1.jpg',
                uploadUrl: '/upload',
                type: 'image',
            })
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0]).toMatchObject({
            localPath: 'file://tmp/photo1.jpg',
            status: 'pending',
            type: 'image',
        })
    })

    // T10: 有网时 flush，pending → uploaded
    it('T10: flush() 在有网时触发上传，成功后 status 变为 uploaded', async () => {
        mockUpload.mockResolvedValue({ data: { url: 'https://oss.example.com/photo1.jpg' } })

        const { result } = renderHook(() => useUploadQueue())

        act(() => {
            result.current.enqueue({
                localPath: 'file://tmp/photo2.jpg',
                uploadUrl: '/upload',
                type: 'image',
            })
        })

        await act(async () => {
            await result.current.flush()
        })

        expect(mockUpload).toHaveBeenCalledTimes(1)
        expect(result.current.items[0]).toMatchObject({
            status: 'uploaded',
            remoteUrl: 'https://oss.example.com/photo1.jpg',
        })
    })

    // T11: 上传失败保留 failed 状态，retryFailed 可重试
    it('T11: 上传失败时 status 为 failed，retryFailed() 重置为 pending 可再次尝试', async () => {
        mockUpload.mockRejectedValueOnce(new Error('网络超时'))

        const { result } = renderHook(() => useUploadQueue())

        act(() => {
            result.current.enqueue({
                localPath: 'file://tmp/photo3.jpg',
                uploadUrl: '/upload',
                type: 'image',
            })
        })

        await act(async () => {
            await result.current.flush()
        })

        // 第一次失败
        expect(result.current.items[0].status).toBe('failed')

        // 第二次成功
        mockUpload.mockResolvedValue({ data: { url: 'https://oss.example.com/photo3.jpg' } })

        act(() => { result.current.retryFailed() })

        // 重置为 pending
        expect(result.current.items[0].status).toBe('pending')

        await act(async () => { await result.current.flush() })

        expect(result.current.items[0].status).toBe('uploaded')
    })
})
