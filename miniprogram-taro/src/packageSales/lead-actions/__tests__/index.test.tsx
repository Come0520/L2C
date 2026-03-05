/**
 * S-03 lead-actions 操作按钮绑定
 *
 * @description 测试"放弃"按钮（退回公海）以及作废等操作是否调用了正确的 API，
 * 并能正确处理页面的返回栈。
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import LeadActionsPage from '../index'
import { leadService } from '@/services/lead-service'

jest.mock('@/services/lead-service', () => ({
    leadService: {
        releaseLead: jest.fn(),
        voidLead: jest.fn(),
    }
}))

let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('LeadActionsPage - 线索操作', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // showModal 默认点击"确定"
            ; (Taro.showModal as jest.Mock).mockImplementation(({ success }) => {
                if (success) success({ confirm: true, cancel: false })
                return Promise.resolve({ confirm: true, cancel: false })
            })

            ; (Taro.showLoading as jest.Mock).mockClear()
            ; (Taro.hideLoading as jest.Mock).mockClear()
            ; (Taro.showToast as jest.Mock).mockClear()
            ; (Taro.navigateBack as jest.Mock).mockClear()
            ; (leadService.releaseLead as jest.Mock).mockResolvedValue({ success: true })
            ; (leadService.voidLead as jest.Mock).mockResolvedValue({ success: true })
    })

    async function renderAndLoad(id = 'lead-001') {
        render(<LeadActionsPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!({ id })
            })
        }
    }

    test('点击"退回公海 (放弃)"并确认，应调用 releaseLead 并返回两层', async () => {
        jest.useFakeTimers()
        await renderAndLoad()

        const abandonBtn = screen.getByText('退回公海 (放弃)')
        await act(async () => {
            fireEvent.click(abandonBtn)
        })

        // 等待所有微任务执行完毕 (Mock 的网络请求)
        await act(async () => {
            await Promise.resolve()
        })

        expect(Taro.showModal).toHaveBeenCalled()
        expect(leadService.releaseLead).toHaveBeenCalledWith('lead-001')
        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '已退回' }))

        act(() => {
            jest.runAllTimers()
        })
        expect(Taro.navigateBack).toHaveBeenCalledWith({ delta: 2 })
        jest.useRealTimers()
    })

    test('点击"作废线索"并确认，应调用 voidLead 并返回两层', async () => {
        jest.useFakeTimers()
        await renderAndLoad()

        const voidBtn = screen.getByText('作废线索')
        await act(async () => {
            fireEvent.click(voidBtn)
        })

        await act(async () => {
            await Promise.resolve()
        })

        expect(Taro.showModal).toHaveBeenCalled()
        expect(leadService.voidLead).toHaveBeenCalledWith('lead-001', '小程序端手动操作作废')
        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '已作废' }))

        act(() => {
            jest.runAllTimers()
        })
        expect(Taro.navigateBack).toHaveBeenCalledWith({ delta: 2 })
        jest.useRealTimers()
    })
})
