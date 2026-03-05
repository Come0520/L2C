/**
 * S-04 quick-follow-up 快速跟进页面测试
 *
 * @description 验证提交跟进时 leadService.addFollowUp() 被正确调用。
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useLoad } from '@tarojs/taro'
import QuickFollowUpPage from '../index'
import { leadService } from '@/services/lead-service'

jest.mock('@/services/lead-service', () => ({
    leadService: {
        addFollowUp: jest.fn(),
    }
}))

jest.mock('@/services/api', () => ({
    api: {
        upload: jest.fn(),
    }
}))

let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('QuickFollowUpPage — 快速跟进', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            ; (leadService.addFollowUp as jest.Mock).mockResolvedValue({ id: 'fu-new' })
    })

    async function renderAndLoad(id = 'lead-500') {
        render(<QuickFollowUpPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                capturedUseLoadCallback!({ id })
            })
        }
    }

    test('页面应渲染提交按钮', async () => {
        await renderAndLoad()
        expect(screen.getByText('发布跟进')).toBeTruthy()
    })

    test('输入内容后点击提交应调用 leadService.addFollowUp()', async () => {
        await renderAndLoad('lead-600')

        // 模拟输入跟进内容
        const textarea = screen.getByPlaceholderText(/记录这次跟进/)
        await act(async () => {
            fireEvent.input(textarea, { target: { value: '客户确认下单' }, detail: { value: '客户确认下单' } })
        })

        // 点击提交
        const submitBtn = screen.getByText('发布跟进')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        // 等待异步
        await act(async () => {
            await new Promise(r => setTimeout(r, 50))
        })

        expect(leadService.addFollowUp).toHaveBeenCalledWith('lead-600', expect.objectContaining({
            content: expect.stringContaining('客户确认下单'),
            type: 'PHONE_CALL',
        }))
    })
})
