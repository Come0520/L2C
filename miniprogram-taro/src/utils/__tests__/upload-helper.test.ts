/**
 * upload-helper 单元测试
 *
 * 测试策略：RED 阶段 — 先运行让测试全部失败，确认失败原因正确，再编写实现。
 */
import Taro from '@tarojs/taro'
import { api } from '@/services/api'
import { chooseAndUploadImages } from '../upload-helper'

// 自动使用 src/__mocks__/@tarojs/taro.ts
jest.mock('@tarojs/taro')

// Mock api 模块，仅替换 upload 方法
jest.mock('@/services/api', () => ({
    api: { upload: jest.fn() },
}))

describe('chooseAndUploadImages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            // 默认：chooseMedia 成功回调返回 2 个临时文件
            ; (Taro.chooseMedia as jest.Mock).mockImplementation(({ success }) => {
                success({
                    tempFiles: [
                        { tempFilePath: '/tmp/img1.jpg' },
                        { tempFilePath: '/tmp/img2.jpg' },
                    ],
                })
            })
            // 默认：upload 成功
            ; (api.upload as jest.Mock).mockResolvedValue({
                data: { url: 'https://oss.example.com/img.jpg' },
            })
    })

    it('T1: 应调用 Taro.chooseMedia 并传入正确的默认参数', async () => {
        await chooseAndUploadImages({ maxCount: 3 })

        expect(Taro.chooseMedia).toHaveBeenCalledWith(
            expect.objectContaining({
                mediaType: ['image'],
                count: 3,
            })
        )
    })

    it('T2: 全部上传成功时，应返回 URL 数组且 failedPaths 为空', async () => {
        const result = await chooseAndUploadImages()

        expect(result.urls).toHaveLength(2)
        expect(result.failedPaths).toHaveLength(0)
        expect(result.urls[0]).toBe('https://oss.example.com/img.jpg')
    })

    it('T3: 第 2 张上传失败时，failedPaths 应包含失败路径', async () => {
        // 第 1 张成功，第 2 张抛出异常
        ; (api.upload as jest.Mock)
            .mockResolvedValueOnce({ data: { url: 'https://oss.example.com/img1.jpg' } })
            .mockRejectedValueOnce(new Error('上传超时'))

        const result = await chooseAndUploadImages()

        expect(result.urls).toHaveLength(1)
        expect(result.failedPaths).toHaveLength(1)
        expect(result.failedPaths[0]).toBe('/tmp/img2.jpg')
    })

    it('T4: options.maxCount 应正确传给 Taro.chooseMedia 的 count 参数', async () => {
        await chooseAndUploadImages({ maxCount: 5 })

        expect(Taro.chooseMedia).toHaveBeenCalledWith(
            expect.objectContaining({ count: 5 })
        )
    })
})
