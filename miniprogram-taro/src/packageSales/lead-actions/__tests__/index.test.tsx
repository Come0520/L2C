/**
 * S-03 lead-actions 操作按钮测试
 *
 * @description 验证线索操作页面的三个核心操作：
 * 1. 退回公海（release） — 确认后调用 leadService.releaseLead()
 * 2. 作废线索（void）   — 确认后调用 leadService.voidLead()
 * 3. 转交线索           — 目前弹提示（功能即将上线）
 *
 * 策略：Mock Taro.showModal 自动确认，验证 service 方法被调用。
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

describe('LeadActionsPage — 线索操作页', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // showModal 默认自动确认
            ; (Taro.showModal as jest.Mock).mockImplementation(({ success }) => {
                if (success) success({ confirm: true, cancel: false })
                return Promise.resolve({ confirm: true, cancel: false })
            })

            ; (leadService.releaseLead as jest.Mock).mockResolvedValue({ success: true })
            ; (leadService.voidLead as jest.Mock).mockResolvedValue({ success: true })
    })

    async function renderAndLoad(id = 'lead-100') {
        render(<LeadActionsPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                capturedUseLoadCallback!({ id })
            })
        }
    }

    test('页面应渲染三个操作卡片', async () => {
        await renderAndLoad()

        expect(screen.getByText('分配/转交线索')).toBeTruthy()
        expect(screen.getByText('退回公海 (放弃)')).toBeTruthy()
        expect(screen.getByText('作废线索')).toBeTruthy()
    })

    test('点击"退回公海"确认后应调用 leadService.releaseLead()', async () => {
        await renderAndLoad('lead-200')

        const abandonCard = screen.getByText('退回公海 (放弃)').closest('.action-card')!
        await act(async () => {
            fireEvent.click(abandonCard)
        })

        // 等待异步操作完成
        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(leadService.releaseLead).toHaveBeenCalledWith('lead-200')
    })

    test('点击"作废线索"确认后应调用 leadService.voidLead()', async () => {
        await renderAndLoad('lead-300')

        const voidCard = screen.getByText('作废线索').closest('.action-card')!
        await act(async () => {
            fireEvent.click(voidCard)
        })

        await act(async () => {
            await new Promise(r => setTimeout(r, 10))
        })

        expect(leadService.voidLead).toHaveBeenCalledWith('lead-300', '小程序端手动操作作废')
    })

    test('点击"转交线索"应弹 Toast 提示', async () => {
        await renderAndLoad()

        const transferCard = screen.getByText('分配/转交线索').closest('.action-card')!
        await act(async () => {
            fireEvent.click(transferCard)
        })

        expect(Taro.showToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: '转交功能即将上线' })
        )
    })
})
