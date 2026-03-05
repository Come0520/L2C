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
        const photoBtn = screen.getByText('📸 拍素材')
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
})
