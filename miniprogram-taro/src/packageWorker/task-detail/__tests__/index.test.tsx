/**
 * W-02 task-detail 任务详情页面测试
 *
 * @description 验证页面正确加载并在初始化时调用 `taskService.getTaskDetail`，能够渲染任务的必要字段。
 */
import { render, screen, act } from '@testing-library/react'
import { useLoad } from '@tarojs/taro'
import TaskDetailPage from '../index'
import { taskService } from '@/services/task-service'

// Mock services
jest.mock('@/services/task-service', () => ({
    taskService: {
        getTaskDetail: jest.fn(),
    }
}))

// Mock Taro Hooks
let capturedUseLoadCallback: ((params: any) => void) | null = null

describe('TaskDetailPage — 真实数据渲染', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // 定义可供渲染的 mock 任务数据
            ; (taskService.getTaskDetail as jest.Mock).mockResolvedValue({
                id: 'task-1024',
                taskNo: 'INS-2026-002',
                status: 'PENDING',
                taskType: 'INSTALLATION',
                createdAt: '2026-03-05T08:00:00Z',
                tenantId: 'tenant-1'
            })
    })

    async function renderAndLoad(id = 'task-1024', type = 'install') {
        render(<TaskDetailPage />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback!({ id, type })
            })
        }
    }

    test('加载中时应显示"加载中..."', () => {
        // 不执行 load 回调，停留在初始状态
        ; (useLoad as jest.Mock).mockImplementation(() => { })
        render(<TaskDetailPage />)
        expect(screen.getByText('加载中...')).toBeTruthy()
    })

    test('加载完毕后应根据真实接口返回渲染任务标题', async () => {
        await renderAndLoad('task-1024', 'install')

        // 验证服务调用正确传参
        expect(taskService.getTaskDetail).toHaveBeenCalledWith('task-1024', 'install')
        // 验证 UI 渲染出来自 Mock 服务的特定任务号
        expect(screen.getByText('单号：INS-2026-002')).toBeTruthy()
    })
})
