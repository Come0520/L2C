/**
 * W-01 engineer-service 单元测试
 *
 * @description 验证工长/安装师傅端核心服务的完整行为。
 * 覆盖：收益查询、可抢单池、日程排期查询、完工打卡。
 */
import { engineerService } from '../engineer-service'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'

// Mock Taro 请求
jest.mock('@tarojs/taro')

describe('engineerService — 师傅端服务', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // 设置师傅角色已登录状态
        useAuthStore.setState({
            token: 'test-worker-token',
            isLoggedIn: true,
            currentRole: 'worker',
            userInfo: { id: 'w1', name: '李师傅', role: 'worker' },
        })
    })

    test('getEarnings 应向 /engineer/earnings 发送 GET 请求并返回收益数据', async () => {
        const mockSummary = {
            totalEarnings: 8500,
            pendingEarnings: 1200,
            thisMonthEarnings: 3400
        }

            ; (Taro.request as jest.Mock).mockResolvedValue({
                statusCode: 200,
                data: { data: mockSummary }
            })

        const result = await engineerService.getEarnings()

        expect(result).toEqual(mockSummary)
        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: expect.stringContaining('/engineer/earnings')
            })
        )
    })

    test('getBiddableTasks 应请求抢单池并返回任务数组', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: [{ id: 'task-1' }, { id: 'task-2' }] }
        })

        const result = await engineerService.getBiddableTasks()

        // 注意：getBiddableTasks 返回的是完整的 api.get 响应，不是解构后的 data
        // 根据 engineer-service.ts 第18行 `return api.get<any[]>('/engineer/tasks/biddable')`
        // api.get 返回解构后的 `data: { data }` 内部的 payload。
        // 但让我们通过单测验证它的实际结构。因为基础 api.ts 最后会直接返回 res.data.data
        expect(result).toEqual([{ id: 'task-1' }, { id: 'task-2' }])
        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: expect.stringContaining('/engineer/tasks/biddable')
            })
        )
    })

    test('getSchedule 应传递 startDate 和 endDate 参数', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { tasks: [{ id: 'task-3', plannedDate: '2026-03-10' }] } }
        })

        const startDate = '2026-03-01'
        const endDate = '2026-03-31'
        const result = await engineerService.getSchedule(startDate, endDate)

        // getSchedule 没有 res => res.data。它的返回其实是 api.get 的返回值（即 interceptors 处理后的 payload）
        expect(result).toEqual({ tasks: [{ id: 'task-3', plannedDate: '2026-03-10' }] })

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: expect.stringContaining('/engineer/schedule'),
                data: expect.objectContaining({ startDate, endDate })
            })
        )
    })

    test('completeTask 应传递完工数据并支持 photos', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { success: true } }
        })

        const taskId = 'task-checkin-01'
        const inputData = { photos: ['url1', 'url2'], notes: '安装完成，已清扫现场' }

        const result = await engineerService.completeTask(taskId, inputData)

        expect(result).toEqual({ success: true })
        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining(`/engineer/tasks/${taskId}/complete`),
                data: inputData
            })
        )
    })
})
