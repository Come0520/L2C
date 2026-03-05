
import { render, screen, act } from '@testing-library/react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import WorkerSchedulePage from '../index'
import { engineerService } from '@/services/engineer-service'

// Mock Services
jest.mock('@/services/engineer-service', () => ({
    engineerService: {
        getSchedule: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null
let capturedUseDidShowCallback: any = null

const todayStr = new Date().toISOString().split('T')[0]


const mockScheduleData = {
    tasks: [
        {
            id: 'task-001',
            title: '上门测量 - 张先生',
            date: todayStr,
            time: '14:00 - 15:30',
            address: '海淀区某某街道1号',
            status: 'PENDING',
            type: 'MEASURE',
            changeNote: ''
        },
        {
            id: 'task-002',
            title: '上门安装 - 李女士',
            date: todayStr,
            time: '16:00 - 18:00',
            address: '朝阳区某某街道2号',
            status: 'COMPLETED',
            type: 'INSTALL',
            changeNote: '客户要求提前半小时'
        }
    ]
}

describe('WorkerSchedulePage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null
        capturedUseDidShowCallback = null

        Taro.stopPullDownRefresh = jest.fn()
        Taro.showToast = jest.fn()
        Taro.navigateTo = jest.fn()
        Taro.showModal = jest.fn()

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })
            ; (useDidShow as jest.Mock).mockImplementation((cb) => {
                capturedUseDidShowCallback = cb
            })

            ; (engineerService.getSchedule as jest.Mock).mockResolvedValue(mockScheduleData)
    })

    const renderAndLoad = async () => {
        const utils = render(<WorkerSchedulePage />)

        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback()
            })
        }
        if (capturedUseDidShowCallback) {
            await act(async () => {
                await capturedUseDidShowCallback()
            })
        }

        return utils
    }

    it('should fetch and display the schedule correctly on load', async () => {
        await renderAndLoad()

        expect(engineerService.getSchedule).toHaveBeenCalled()

        // Verify task rendering
        expect(screen.getByText('海淀区某某街道1号')).toBeTruthy()
        expect(screen.getByText('朝阳区某某街道2号')).toBeTruthy()
        expect(screen.getByText('14:00')).toBeTruthy() // time.split()[0]
        expect(screen.getByText('16:00')).toBeTruthy()
        expect(screen.getByText('预计耗时：14:00 - 15:30')).toBeTruthy()
        expect(screen.getByText('预计耗时：16:00 - 18:00')).toBeTruthy()
        expect(screen.getByText('上门测量')).toBeTruthy()
        expect(screen.getByText('上门安装')).toBeTruthy()
        expect(screen.getByText('待服务')).toBeTruthy()
        expect(screen.getByText('已完成')).toBeTruthy()

        // Verify change note rendering
        expect(screen.getByText('客户要求提前半小时')).toBeTruthy()
    })
})
