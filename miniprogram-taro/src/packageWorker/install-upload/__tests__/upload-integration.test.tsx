/**
 * install-upload 上传集成测试
 *
 * 测试策略：RED 阶段 — 验证 install-upload 页面使用 chooseAndUploadImages
 * 而非直接调用 Taro.chooseMedia，以及上传结果的 UI 反映。
 *
 * 注意：此文件专用于测试上传流程，GPS 打卡测试保留在 index.test.tsx 中。
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import InstallUploadPage from '../index'

// Mock upload-helper 模块
jest.mock('@/utils/upload-helper', () => ({
    chooseAndUploadImages: jest.fn(),
}))

// Mock 依赖服务
jest.mock('@/services/task-service', () => ({
    taskService: {
        checkIn: jest.fn(),
    },
}))
jest.mock('@/services/engineer-service', () => ({
    engineerService: {
        completeTask: jest.fn(),
    },
}))

import { chooseAndUploadImages } from '@/utils/upload-helper'

let capturedUseLoadCallback: any = null

describe('InstallUploadPage — 上传集成', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            // 默认：chooseAndUploadImages 成功返回 OSS URL
            ; (chooseAndUploadImages as jest.Mock).mockResolvedValue({
                urls: ['https://oss.example.com/photo.jpg'],
                failedPaths: [],
            })

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })
    })

    const renderAndLoad = async (taskId = 'task-888') => {
        const utils = render(<InstallUploadPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback({ taskId })
            })
        }
        return utils
    }

    it('T1: 点击拍照区域后，应调用 chooseAndUploadImages 而不是直接调用 Taro.chooseMedia', async () => {
        await renderAndLoad()

        const photoBtns = screen.getAllByText('📷')
        await act(async () => {
            fireEvent.click(photoBtns[0]) // 点击"施工前"拍照区域
        })

        // 等待异步上传完成
        await act(async () => {
            await new Promise((r) => setTimeout(r, 100))
        })

        // 应调用 chooseAndUploadImages
        expect(chooseAndUploadImages).toHaveBeenCalled()
        // 不应直接调用 Taro.chooseMedia
        expect(Taro.chooseMedia).not.toHaveBeenCalled()
    })

    it('T2: 上传成功后，图片预览区应渲染返回的 OSS URL', async () => {
        await renderAndLoad()

        const photoBtns = screen.getAllByText('📷')
        await act(async () => {
            fireEvent.click(photoBtns[1]) // 点击"完工后"拍照区域
        })

        // 等待 React 状态更新
        await act(async () => {
            await new Promise((r) => setTimeout(r, 100))
        })

        // 图片预览中应包含 OSS URL
        const imgs = screen.getAllByRole('img')
        const ossImg = imgs.find((img) =>
            img.getAttribute('src')?.includes('oss.example.com')
        )
        expect(ossImg).toBeTruthy()
    })

    it('T3: 部分上传失败时，Toast 提示"X 张上传失败"', async () => {
        // 模拟：1 张上传成功，1 张失败
        ; (chooseAndUploadImages as jest.Mock).mockResolvedValue({
            urls: ['https://oss.example.com/photo.jpg'],
            failedPaths: ['/tmp/failed.jpg'],
        })

        await renderAndLoad()

        const photoBtns = screen.getAllByText('📷')
        await act(async () => {
            fireEvent.click(photoBtns[0])
        })

        await act(async () => {
            await new Promise((r) => setTimeout(r, 100))
        })

        expect(Taro.showToast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: expect.stringContaining('上传失败'),
            })
        )
    })
})
