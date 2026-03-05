/**
 * S-02 lead-detail 页面渲染测试
 *
 * @description 验证 lead-detail 页面能正确接入 leadService，
 * 渲染真实数据（非静态 Mock），以及处理加载和空数据状态。
 *
 * 策略：
 * - useLoad Mock 默认记录回调但不执行
 * - render 后，在独立的 act() 中手动触发已记录的回调
 * - 这样 React 状态更新被正确包裹在 act() 中
 */
import { render, screen, act } from '@testing-library/react'
import { useLoad } from '@tarojs/taro'
import LeadDetailPage from '../index'
import { leadService } from '@/services/lead-service'

// Mock leadService，让我们控制返回值
jest.mock('@/services/lead-service', () => ({
    leadService: {
        getLeadDetail: jest.fn(),
        getLeadFollowUps: jest.fn(),
    }
}))

// 用于捕获 useLoad 注册的回调
let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('LeadDetailPage — 线索详情页', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            // useLoad Mock：记录传入的回调但不立即执行
            ; (useLoad as jest.Mock).mockImplementation((cb: (params: any) => void) => {
                capturedUseLoadCallback = cb
            })
    })

    /**
     * 辅助函数：渲染页面 → 触发 useLoad → 等待异步更新完成
     */
    async function renderAndLoad(routeParams: Record<string, string> = { id: 'lead-001' }) {
        render(<LeadDetailPage />)

        // 在 act 中触发 useLoad 回调
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!(routeParams)
            })
        }
    }

    test('数据加载过程中应显示加载状态', () => {
        // 不触发 useLoad 回调 — 保持 loading=true 初始状态
        render(<LeadDetailPage />)

        expect(screen.getByText('加载中...')).toBeTruthy()
    })

    test('数据加载完成后应渲染线索客户姓名和电话', async () => {
        const mockLead = {
            id: 'lead-001',
            customerName: '李梅',
            customerPhone: '13912345678',
            status: 'FOLLOWING',
            intentionLevel: 'HIGH',
            sourceChannel: { name: '抖音推广' },
            address: '北京市朝阳区XX路1号',
            community: '阳光花园',
            houseType: '3室2厅',
            assignedSales: { name: '销售甲' }
        }

            ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue(mockLead)
            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue([])

        await renderAndLoad({ id: 'lead-001' })

        expect(screen.getByText('李梅')).toBeTruthy()
        expect(screen.getByText('13912345678')).toBeTruthy()
    })

    test('有跟进记录时应渲染记录内容', async () => {
        const mockLead = {
            id: 'lead-001',
            customerName: '王明',
            customerPhone: '13800000001',
            status: 'FOLLOWING',
            intentionLevel: 'MEDIUM',
        }

        const mockFollowUps = [
            { id: 'f1', content: '上门拜访，了解需求', type: 'VISIT', createdAt: '2026-03-01T10:00:00Z' },
            { id: 'f2', content: '发送报价方案', type: 'PHONE', createdAt: '2026-03-03T14:00:00Z' },
        ]

            ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue(mockLead)
            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue(mockFollowUps)

        await renderAndLoad({ id: 'lead-001' })

        expect(screen.getByText('上门拜访，了解需求')).toBeTruthy()
        expect(screen.getByText('发送报价方案')).toBeTruthy()
    })

    test('无跟进记录时应渲染空状态提示', async () => {
        const mockLead = {
            id: 'lead-002',
            customerName: '张亮',
            customerPhone: '13700000002',
            status: 'PENDING_FOLLOWUP',
            intentionLevel: 'LOW',
        }

            ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue(mockLead)
            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue([])

        await renderAndLoad({ id: 'lead-002' })

        expect(screen.getByText('暂无跟进记录')).toBeTruthy()
    })

    test('leadService.getLeadDetail 应以路由参数 id 调用', async () => {
        ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue({
            id: 'lead-abc', customerName: '测试', customerPhone: '13000000000',
            status: 'FOLLOWING', intentionLevel: 'HIGH',
        })
            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue([])

        await renderAndLoad({ id: 'lead-abc' })

        expect(leadService.getLeadDetail).toHaveBeenCalledWith('lead-abc')
        expect(leadService.getLeadFollowUps).toHaveBeenCalledWith('lead-abc')
    })
})
