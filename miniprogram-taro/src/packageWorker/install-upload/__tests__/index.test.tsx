import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import InstallUploadPage from '../index'
import { taskService } from '@/services/task-service'
import { engineerService } from '@/services/engineer-service'

// Mock Services
jest.mock('@/services/task-service', () => ({
    taskService: {
        checkIn: jest.fn()
    }
}))

jest.mock('@/services/engineer-service', () => ({
    engineerService: {
        completeTask: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null

describe('InstallUploadPage - 安装提报', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.showToast = jest.fn()
        Taro.navigateBack = jest.fn()
        Taro.chooseMedia = jest.fn().mockImplementation(({ success }) => {
            success({
                tempFiles: [{ tempFilePath: 'mock_uploaded_img.jpg' }]
            })
        })

            // Mock Taro hooks
            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // Mock APIs
            ; (taskService.checkIn as jest.Mock).mockResolvedValue({ success: true })
            ; (engineerService.completeTask as jest.Mock).mockResolvedValue({ success: true })
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

    it('submits installation record correctly after checking in and taking photo', async () => {
        await renderAndLoad()

        // 1. 打卡 - Wait for checkIn to resolve
        const checkInBtn = screen.getByText('实地打卡')
        await act(async () => {
            fireEvent.click(checkInBtn)
        })

        expect(Taro.showLoading).toHaveBeenCalled()
        expect(taskService.checkIn).toHaveBeenCalledWith('task-888', expect.any(Object))

        // Let promises resolve if any
        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })
        expect(screen.getByText('已打卡')).toBeTruthy()

        // 2. 上传售后完工图 (afterImages)
        // 界面上有两个模块提供 📷 , 第一个是 before, 第二个是 after
        const photoBtns = screen.getAllByText('📷')
        await act(async () => {
            fireEvent.click(photoBtns[1]) // click the after photo button
        })

        expect(Taro.chooseMedia).toHaveBeenCalled()

        // 3. 填写备注
        // The input is a Textarea
        const textareas = document.querySelectorAll('.remark-input')
        const remarkInput = textareas[0]
        await act(async () => {
            fireEvent.input(remarkInput, { target: { value: '安装非常顺利' }, detail: { value: '安装非常顺利' } })
        })

        // 4. 提交
        const submitBtn = screen.getByText('确认完工并回传系统')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(engineerService.completeTask).toHaveBeenCalledWith('task-888', expect.objectContaining({
            photos: expect.arrayContaining(['mock_uploaded_img.jpg']),
            notes: '安装非常顺利'
        }))
        expect(Taro.navigateBack).toHaveBeenCalled()
    })
})
