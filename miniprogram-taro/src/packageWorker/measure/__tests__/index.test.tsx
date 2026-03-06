import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import MeasurePage from '../index'
import { taskService } from '@/services/task-service'

// Mock Services
jest.mock('@/services/task-service', () => ({
    taskService: {
        checkIn: jest.fn(),
        submitMeasureData: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null;

describe('WorkerMeasurePage - 量尺填报', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.showToast = jest.fn()
        Taro.navigateBack = jest.fn()
        Taro.chooseMedia = jest.fn().mockImplementation(({ success }) => {
            success({
                tempFiles: [{ tempFilePath: 'mock_image_1.jpg' }, { tempFilePath: 'mock_image_2.jpg' }]
            })
        })

            // Mock Taro hooks
            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb;
            })

            // Mock Services Return Values
            ; (taskService.checkIn as jest.Mock).mockResolvedValue({ success: true })
            ; (taskService.submitMeasureData as jest.Mock).mockResolvedValue({ success: true })
    })

    const renderAndLoad = async (taskId = 'task-1024') => {
        const utils = render(<MeasurePage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback({ taskId })
            })
        }
        return utils
    }

    it('handles check-in correctly', async () => {
        await renderAndLoad()

        const checkInBtn = screen.getByText('实地打卡')

        await act(async () => {
            fireEvent.click(checkInBtn)
        })

        // Check if taskService.checkIn was called (currently it won't be, so it's a RED test)
        expect(Taro.showLoading).toHaveBeenCalled()
        expect(taskService.checkIn).toHaveBeenCalledWith('task-1024', expect.any(Object))

        // Let promises resolve if any
        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })
        expect(screen.getByText('已打卡')).toBeTruthy()
    })

    it('submits measure data correctly', async () => {
        await renderAndLoad()

        // 1. Force check-in to be able to submit
        const checkInBtn = screen.getByText('实地打卡')
        await act(async () => {
            fireEvent.click(checkInBtn)
        })
        await act(async () => {
            // Wait for the simulated or actual async delay
            await new Promise(r => setTimeout(r, 1600))
        })

        // 2. Modify some room data
        const widthInput = screen.getAllByPlaceholderText('0.00')[0] // get the first width input
        await act(async () => {
            fireEvent.input(widthInput, { target: { value: '4.5' }, detail: { value: '4.5' } })
        })

        // 3. Take photo
        const photoBtn = screen.getByText('📸 拍照')
        await act(async () => {
            fireEvent.click(photoBtn)
        })

        expect(Taro.chooseMedia).toHaveBeenCalled()

        // 4. Submit
        const submitBtn = screen.getByText('一键回传系统报价单')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 1600))
        })

        expect(taskService.submitMeasureData).toHaveBeenCalledWith('task-1024', expect.objectContaining({
            plans: expect.arrayContaining([
                expect.objectContaining({
                    rooms: expect.arrayContaining([
                        expect.objectContaining({
                            width: '4.5'
                        })
                    ])
                })
            ]),
            images: expect.arrayContaining(['mock_image_1.jpg', 'mock_image_2.jpg'])
        }))
        expect(Taro.navigateBack).toHaveBeenCalled()
    })

    // T3: 拍照按钮只选图片，且使用压缩模式
    it('T3: 点击"拍照"时只选图片并启用压缩', async () => {
        await renderAndLoad()

        const photoBtn = screen.getByText('📸 拍照')
        await act(async () => {
            fireEvent.click(photoBtn)
        })

        expect(Taro.chooseMedia).toHaveBeenCalledWith(
            expect.objectContaining({
                mediaType: ['image'],
                sizeType: ['compressed'],
            })
        )
    })

    // T4: 录像按钮只选视频，且 maxDuration 为 30
    it('T4: 点击"录像"时只选视频且限制30秒', async () => {
        await renderAndLoad()

        const videoBtn = screen.getByText('🎬 录像')
        await act(async () => {
            fireEvent.click(videoBtn)
        })

        expect(Taro.chooseMedia).toHaveBeenCalledWith(
            expect.objectContaining({
                mediaType: ['video'],
                maxDuration: 30,
            })
        )
    })

    // T5: 录像达到3段后，录像按钮消失
    it('T5: 录像已达3段后录像按钮不可见', async () => {
        // 模拟每次点击返回1个视频文件
        ; (Taro.chooseMedia as jest.Mock).mockImplementation(({ success }) => {
            success({ tempFiles: [{ tempFilePath: `mock_video_${Date.now()}.mp4` }] })
        })

        await renderAndLoad()

        // 点击 3 次录像
        for (let i = 0; i < 3; i++) {
            const videoBtn = screen.getByText('🎬 录像')
            await act(async () => {
                fireEvent.click(videoBtn)
            })
        }

        // 第4次：录像按钮应该消失
        expect(screen.queryByText('🎬 录像')).toBeNull()
    })

    // T8: 有报价单（hasExistingQuote=true）时，未填备注不能提交
    it('T8: hasExistingQuote=true 时，未填备注直接提交会弹出提示', async () => {
        // 通过 taskId 携带 hasExistingQuote 标记（路由参数）
        await renderAndLoad('task-with-quote')

        // 先打卡
        const checkInBtn = screen.getByText('实地打卡')
        await act(async () => { fireEvent.click(checkInBtn) })
        await act(async () => { await new Promise(r => setTimeout(r, 100)) })

        // 不填备注，直接提交
        const submitBtn = screen.getByText('一键回传系统报价单')
        await act(async () => { fireEvent.click(submitBtn) })

        // 应该弹出提示，而不是调用 submitMeasureData
        expect(Taro.showToast).toHaveBeenCalledWith(
            expect.objectContaining({ icon: 'none' })
        )
        expect(taskService.submitMeasureData).not.toHaveBeenCalled()
    })
})


