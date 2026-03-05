/**
 * S-05 measure-review 量尺审查页面测试
 *
 * @description 验证审核操作按钮的绑定：
 * 1. "核对无误确认" → taskService.verifyMeasureData('APPROVE')
 * 2. "提出申诉"     → taskService.verifyMeasureData('DISPUTE', reason)
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import SalesMeasureReviewPage from '../index'
import { taskService } from '@/services/task-service'

jest.mock('@/services/task-service', () => ({
    taskService: {
        getTaskDetail: jest.fn(),
        verifyMeasureData: jest.fn(),
    }
}))

let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('SalesMeasureReviewPage — 量尺审查', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // 返回有效任务数据
            ; (taskService.getTaskDetail as jest.Mock).mockResolvedValue({
                id: 'task-001',
                measureNo: 'MR-2026-001',
                assignedWorkerId: 'w001',
                createdAt: '2026-03-05T10:00:00Z',
            })

            ; (taskService.verifyMeasureData as jest.Mock).mockResolvedValue({ success: true })

            // showModal 默认自动确认
            ; (Taro.showModal as jest.Mock).mockImplementation(({ success }) => {
                if (success) success({ confirm: true, cancel: false, content: '数据模糊' })
                return Promise.resolve({ confirm: true, cancel: false })
            })
    })

    async function renderAndLoad(id = 'task-001') {
        render(<SalesMeasureReviewPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!(({ id }))
            })
        }
    }

    test('加载中应显示提示', () => {
        // 不触发 useLoad
        ; (useLoad as jest.Mock).mockImplementation(() => { })
        render(<SalesMeasureReviewPage />)
        expect(screen.getByText('加载中...')).toBeTruthy()
    })

    test('数据加载后应渲染量尺单号', async () => {
        await renderAndLoad('task-001')
        expect(screen.getByText('MR-2026-001')).toBeTruthy()
    })

    test('点击"核对无误确认"应调用 verifyMeasureData(APPROVE)', async () => {
        await renderAndLoad('task-001')

        const approveBtn = screen.getByText('核对无误确认')
        await act(async () => {
            fireEvent.click(approveBtn)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(taskService.verifyMeasureData).toHaveBeenCalledWith('task-001', 'APPROVE')
    })

    test('点击"提出申诉"确认后应调用 verifyMeasureData(DISPUTE, reason)', async () => {
        await renderAndLoad('task-001')

        const disputeBtn = screen.getByText('提出申诉')
        await act(async () => {
            fireEvent.click(disputeBtn)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(taskService.verifyMeasureData).toHaveBeenCalledWith('task-001', 'DISPUTE', '小程序端销售主动打回')
    })
})
