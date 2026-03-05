import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import WorkerOrderBidPage from '../index'
import { engineerService } from '@/services/engineer-service'
import { taskService } from '@/services/task-service'

// Mock Services
jest.mock('@/services/engineer-service', () => ({
    engineerService: {
        getBiddableTasks: jest.fn()
    }
}))

jest.mock('@/services/task-service', () => ({
    taskService: {
        negotiateTask: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null;
let capturedUseDidShowCallback: any = null;

const mockTasks = [
    {
        id: 'order-101',
        taskNo: 'INS-2026-101',
        type: 'INSTALL',
        typeLabel: '安装',
        distance: '1.2km',
        scheduledDate: '2026-05-20',
        timeSlot: '10:00-12:00',
        address: '北京市朝阳区测试地址1号',
        customerName: '张先生',
        systemPrice: 150
    },
    {
        id: 'order-102',
        taskNo: 'SVC-2026-102',
        type: 'REPAIR',
        typeLabel: '维修',
        distance: '3.5km',
        scheduledDate: '2026-05-21',
        timeSlot: '14:00-16:00',
        address: '北京市海淀区测试地址2号',
        customerName: '李女士',
        systemPrice: 80
    }
]

describe('WorkerOrderBidPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null
        capturedUseDidShowCallback = null

        Taro.stopPullDownRefresh = jest.fn()
        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.showToast = jest.fn()

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb;
            })
            ; (useDidShow as jest.Mock).mockImplementation((cb) => {
                capturedUseDidShowCallback = cb;
            })
            ; (Taro.showModal as jest.Mock).mockImplementation(({ success }) => {
                if (success) success({ confirm: true, cancel: false })
                return Promise.resolve({ confirm: true, cancel: false })
            })

            // Mock getBiddableTasks success
            ; (engineerService.getBiddableTasks as jest.Mock).mockResolvedValue(mockTasks)
            // Mock negotiateTask success
            ; (taskService.negotiateTask as jest.Mock).mockResolvedValue({
                success: true
            })
    })

    const renderAndLoad = async () => {
        const utils = render(<WorkerOrderBidPage />)

        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback()
            })
        }
        if (capturedUseDidShowCallback) {
            await act(async () => {
                await capturedUseDidShowCallback()
            })
        }

        return utils
    }

    it('renders task list from getBiddableTasks', async () => {
        await renderAndLoad()

        expect(engineerService.getBiddableTasks).toHaveBeenCalled()
        expect(screen.getByText('INS-2026-101')).toBeTruthy()
        expect(screen.getByText('SVC-2026-102')).toBeTruthy()
        expect(screen.getByText('共 2 个新订单正在等待分配')).toBeTruthy()
    })

    it('handles ACCEPT action successfully', async () => {
        await renderAndLoad()

        // Find and click the "接单" button for the first order
        // The first order's accept button is usually the first "接单"
        const acceptBtns = screen.getAllByText('接单')
        expect(acceptBtns.length).toBe(2)

        await act(async () => {
            fireEvent.click(acceptBtns[0])
        })

        // Wait for async changes
        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(Taro.showModal).toHaveBeenCalled()
        expect(taskService.negotiateTask).toHaveBeenCalledWith('order-101', 'ACCEPT')
        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '接单成功' }))
    })

    it('handles REJECT action successfully', async () => {
        await renderAndLoad()

        const rejectBtns = screen.getAllByText('拒绝')

        await act(async () => {
            fireEvent.click(rejectBtns[0])
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(Taro.showModal).toHaveBeenCalled()
        expect(taskService.negotiateTask).toHaveBeenCalledWith('order-101', 'REJECT')
        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '已拒绝' }))

        // After rejection, the first item should be removed
        expect(screen.queryByText('INS-2026-101')).toBeNull()
    })

    it('handles COUNTER offer successfully', async () => {
        await renderAndLoad()

        const counterBtns = screen.getAllByText('议价')

        // Open modal for the first order
        await act(async () => {
            fireEvent.click(counterBtns[0])
        })

        // Check if modal title exists
        expect(screen.getByText('工单议价')).toBeTruthy()

        const priceInput = screen.getByPlaceholderText('请输入您的心理价位')
        const reasonInput = screen.getByPlaceholderText('如：路程较远、楼层较高无电梯等')

        await act(async () => {
            fireEvent.input(priceInput, { target: { value: '200' }, detail: { value: '200' } })
            fireEvent.input(reasonInput, { target: { value: '路程较远' }, detail: { value: '路程较远' } })
        })

        const submitBtn = screen.getByText('提交议价申请')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(taskService.negotiateTask).toHaveBeenCalledWith('order-101', 'COUNTER', {
            price: '200',
            reason: '路程较远'
        })
        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '议价已提交' }))
    })
})
