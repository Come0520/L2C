/**
 * S-04 quick-follow-up 提交联调
 *
 * @description
 * 1. 验证提交记录与下次跟进日期的合并
 * 2. 验证调用 leadService.addFollowUp 带正确参数
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import QuickFollowUpPage from '../index'
import { leadService } from '@/services/lead-service'
import { api } from '@/services/api'

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

describe('QuickFollowUpPage - 快速跟进', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            ; (leadService.addFollowUp as jest.Mock).mockResolvedValue({ success: true })
            ; (api.upload as jest.Mock).mockImplementation((_url: string, path: string) =>
                Promise.resolve({ data: { url: `https://fake.url/${path}` } })
            )
    })

    async function renderAndLoad(id = 'lead-001') {
        render(<QuickFollowUpPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!({ id })
            })
        }
    }

    test('内容为空时点击提交，应提示错误', async () => {
        await renderAndLoad()
        const submitBtn = screen.getByText('发布跟进')
        await act(async () => {
            fireEvent.click(submitBtn)
        })
        expect(Taro.showToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: '内容或图片不能为空' })
        )
        expect(leadService.addFollowUp).not.toHaveBeenCalled()
    })

    test('只填写内容并提交，应正确调用 addFollowUp（无日期）', async () => {
        jest.useFakeTimers()
        await renderAndLoad()

        // 通过 global Textarea mock 输入内容
        const textarea = screen.getByPlaceholderText(
            '记录这次跟进的详细情况、客户的顾虑或阶段性成果...'
        ) as HTMLTextAreaElement

        await act(async () => {
            fireEvent.change(textarea, { target: { value: '今日面谈顺利' } })
        })

        const submitBtn = screen.getByText('发布跟进')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        // 等待 Promise 链完成
        await act(async () => { await Promise.resolve() })
        await act(async () => { await Promise.resolve() })

        expect(leadService.addFollowUp).toHaveBeenCalledWith('lead-001', {
            content: '今日面谈顺利',
            type: 'PHONE_CALL',
            nextFollowUpDate: undefined,
        })
        expect(Taro.showToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: '提交成功' })
        )

        act(() => { jest.runAllTimers() })
        expect(Taro.navigateBack).toHaveBeenCalled()
        jest.useRealTimers()
    })

    test('设置日期并提交，应将日期合并到 content 和 payload', async () => {
        jest.useFakeTimers()
        await renderAndLoad()

        const textarea = screen.getByPlaceholderText(
            '记录这次跟进的详细情况、客户的顾虑或阶段性成果...'
        ) as HTMLTextAreaElement

        await act(async () => {
            fireEvent.change(textarea, { target: { value: '加微信，待发送资料' } })
        })

        // 通过 data-mock-value 属性注入日期值到 Picker mock
        const pickerEl = screen.getByTestId('mock-picker')
        pickerEl.setAttribute('data-mock-value', '2026-04-01')
        await act(async () => {
            fireEvent.click(pickerEl)
        })

        const submitBtn = screen.getByText('发布跟进')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        await act(async () => { await Promise.resolve() })
        await act(async () => { await Promise.resolve() })

        expect(leadService.addFollowUp).toHaveBeenCalledWith('lead-001', {
            content: '加微信，待发送资料\n\n[计划下次跟进: 2026-04-01]',
            type: 'PHONE_CALL',
            nextFollowUpDate: '2026-04-01',
        })

        act(() => { jest.runAllTimers() })
        jest.useRealTimers()
    })
})
