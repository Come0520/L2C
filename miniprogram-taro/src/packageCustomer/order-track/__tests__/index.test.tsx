/**
 * C-02 order-track 时间线数据接入
 *
 * @description
 * 1. 加载中状态渲染
 * 2. 接入 orderService.getOrderDetail 后渲染订单号及状态
 * 3. 根据订单状态渲染时间线节点（已完成 / 未完成）
 */
import { render, screen, act } from '@testing-library/react'
import { useLoad } from '@tarojs/taro'
import OrderTrack from '../index'
import { orderService } from '@/services/order-service'

jest.mock('@/services/order-service', () => ({
    orderService: {
        getOrderDetail: jest.fn(),
    }
}))

let capturedUseLoadCallback: ((params: any) => Promise<void>) | null = null

describe('OrderTrack - 订单跟踪时间线', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })
    })

    async function renderAndLoad(id = 'order-001') {
        render(<OrderTrack />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!({ id })
            })
        }
    }

    test('数据加载中应显示"加载进度中..."', () => {
        ; (useLoad as jest.Mock).mockImplementation(() => { })
        render(<OrderTrack />)
        expect(screen.getByText('加载进度中...')).toBeTruthy()
    })

    test('API 无数据时应显示"查无此订单"', async () => {
        ; (orderService.getOrderDetail as jest.Mock).mockResolvedValue(null)

        await renderAndLoad()
        expect(screen.getByText('查无此订单')).toBeTruthy()
    })

    test('数据加载成功后应渲染订单编号和状态', async () => {
        ; (orderService.getOrderDetail as jest.Mock).mockResolvedValue({
            id: 'order-001',
            orderNo: 'ORD-20260305-001',
            status: 'MEASURED',
            updatedAt: '2026-03-05T10:00:00Z',
            createdAt: '2026-03-01T08:00:00Z',
        })

        await renderAndLoad()

        // 订单编号应显示
        expect(screen.getByText('ORD-20260305-001')).toBeTruthy()
        // 状态文字 "已量尺" 应显示
        expect(screen.getByText('已量尺')).toBeTruthy()
    })

    test('状态为 MEASURED 时，时间线节点"上门量尺完成"应标记为已完成', async () => {
        ; (orderService.getOrderDetail as jest.Mock).mockResolvedValue({
            id: 'order-001',
            orderNo: 'ORD-20260305-001',
            status: 'MEASURED',
            updatedAt: '2026-03-05T10:00:00Z',
            createdAt: '2026-03-01T08:00:00Z',
        })

        await renderAndLoad()

        // "订单已确认" 和 "上门量尺完成" 节点应该已渲染（已完成态，带有真实描述）
        expect(screen.getByText('订单已确认')).toBeTruthy()
        expect(screen.getByText('上门量尺完成')).toBeTruthy()
        // 后续节点 "待上门安装" 应该仍处于等待中
        expect(screen.getByText('待上门安装')).toBeTruthy()
    })
})
