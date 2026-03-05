/**
 * S-02 lead-detail 真实数据接入
 *
 * @description 验证线索详情页的数据渲染
 * 1. 初始"数据加载中"状态
 * 2. 正常获取详情及跟进记录
 * 3. 页面按钮的正确路由绑定
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import LeadDetailPage from '../index'
import { leadService } from '@/services/lead-service'

jest.mock('@/services/lead-service', () => ({
    leadService: {
        getLeadDetail: jest.fn(),
        getLeadFollowUps: jest.fn(),
    }
}))

let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('LeadDetailPage - 线索详情', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            ; (Taro.navigateTo as jest.Mock).mockResolvedValue(undefined)

            ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue({
                id: 'lead-001',
                customerName: '李四',
                customerPhone: '13811112222',
                status: 'PENDING_FOLLOWUP',
                intentionLevel: 'HIGH',
                sourceChannel: { name: '抖音广告' },
                address: '北京市朝阳区',
                community: '阳光花园',
                houseType: '3室2厅',
                assignedSales: { name: '张销售' }
            })

            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue([
                {
                    id: 'fu-001',
                    content: '客户微信已加，明天跟进',
                    createdAt: '2026-03-05T10:00:00Z',
                    type: 'WECHAT'
                }
            ])
    })

    async function renderAndLoad(id = 'lead-001') {
        render(<LeadDetailPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!({ id })
            })
        }
    }

    test('尚未加载完时应显示"加载中..."', () => {
        ; (useLoad as jest.Mock).mockImplementation(() => { })
        render(<LeadDetailPage />)
        expect(screen.getByText('加载中...')).toBeTruthy()
    })

    test('如果 getLeadDetail 失败或未找到，最终应提示"线索不存在"', async () => {
        ; (leadService.getLeadDetail as jest.Mock).mockResolvedValue(null)
            ; (leadService.getLeadFollowUps as jest.Mock).mockResolvedValue(null)

        await renderAndLoad()
        expect(screen.getByText('线索不存在')).toBeTruthy()
    })

    test('数据加载成功应渲染姓名、电话、状态和地址', async () => {
        await renderAndLoad()
        expect(screen.getByText('李四')).toBeTruthy()
        expect(screen.getByText('13811112222')).toBeTruthy()
        expect(screen.getByText('待跟进')).toBeTruthy()
        expect(screen.getByText('北京市朝阳区')).toBeTruthy()
        // 跟进记录
        expect(screen.getByText('客户微信已加，明天跟进')).toBeTruthy()
    })

    test('点击"管理"按钮应导航到 lead-actions', async () => {
        await renderAndLoad()
        const manageBtn = screen.getByText('管理')
        await act(async () => {
            fireEvent.click(manageBtn)
        })
        expect(Taro.navigateTo).toHaveBeenCalledWith(
            expect.objectContaining({ url: '/packageSales/lead-actions/index?id=lead-001' })
        )
    })
})
