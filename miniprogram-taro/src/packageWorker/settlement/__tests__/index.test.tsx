import { render, screen, act } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import SettlementPage from '../index'
import { engineerService } from '@/services/engineer-service'

// Mock Services
jest.mock('@/services/engineer-service', () => ({
    engineerService: {
        getEarnings: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null

const mockEarningsData = {
    totalEarned: '12500.00',
    pendingAmount: '3200.00',
    recentDetails: [
        {
            id: 'r-1',
            feeType: 'INSTALL',
            installTaskNo: 'INS-2026-001',
            createdAt: '2026-03-05T10:00:00Z',
            amount: 150.5,
            description: '安装尾款'
        },
        {
            id: 'r-2',
            feeType: 'MEASURE',
            installTaskNo: '',
            createdAt: '2026-03-04T15:30:00Z',
            amount: 50.0,
            description: '上门测量费'
        }
    ]
}

describe('SettlementPage - 收益结算', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        Taro.showToast = jest.fn()

            // Mock Taro hooks
            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // Mock APIs
            ; (engineerService.getEarnings as jest.Mock).mockResolvedValue(mockEarningsData)
    })

    const renderAndLoad = async () => {
        let utils: any
        await act(async () => {
            utils = render(<SettlementPage />)
        })

        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback({})
            })
        }
        return utils
    }

    it('renders dashboard numbers and record list correctly', async () => {
        await renderAndLoad()

        expect(engineerService.getEarnings).toHaveBeenCalled()

        // Verify dashboard numbers
        expect(screen.getByText('12500.00')).toBeTruthy()
        expect(screen.getByText('3200.00')).toBeTruthy()

        // Verify record list
        expect(screen.getByText('INS-2026-001')).toBeTruthy()
        expect(screen.getByText('安装尾款')).toBeTruthy()
        expect(screen.getByText('+ 150.50')).toBeTruthy()
        expect(screen.getByText('上门测量费')).toBeTruthy()
        expect(screen.getByText('+ 50.00')).toBeTruthy()

        // Verify fee types map translation
        expect(screen.getByText('安装')).toBeTruthy()
        expect(screen.getByText('量尺')).toBeTruthy()
    })
})
