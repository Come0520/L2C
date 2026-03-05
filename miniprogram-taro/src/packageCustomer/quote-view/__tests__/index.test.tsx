import { render, screen, act } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import QuoteView from '../index'
import { quoteService } from '@/services/quote-service'

jest.mock('@/services/quote-service', () => ({
    quoteService: {
        getQuoteDetail: jest.fn()
    }
}))

let capturedUseLoadCallback: any = null

const mockQuoteData = {
    id: 'quote-12345',
    quoteNo: 'Q-20260305-001',
    title: '全屋定制窗帘基础报价',
    status: 'PENDING',
    customerName: '李女士',
    totalAmount: '12800.50',
    items: [
        { productName: '阳光房电动卷帘', subtotal: '3200', unitPrice: '800', quantity: 4, unit: '套', roomName: '阳台' },
        { productName: '主卧真丝遮光帘', subtotal: '9600.5', unitPrice: '4800.25', quantity: 2, unit: '套', roomName: '主卧' }
    ]
}

describe('QuoteView - 报价真实数据联调', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        Taro.navigateTo = jest.fn()
            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })
            ; (quoteService.getQuoteDetail as jest.Mock).mockResolvedValue(mockQuoteData)
    })

    const renderAndLoad = async (id = 'quote-12345') => {
        const utils = render(<QuoteView />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback({ id })
            })
        }
        return utils
    }

    it('renders quote details correctly fetched from api', async () => {
        await renderAndLoad()

        // 验证 API 调用
        expect(quoteService.getQuoteDetail).toHaveBeenCalledWith('quote-12345')

        // 验证首屏数据
        expect(screen.getByText('全屋定制窗帘基础报价')).toBeTruthy()
        expect(screen.getByText('¥12,800.5')).toBeTruthy() // toLocaleString() 格式
        expect(screen.getByText('李女士')).toBeTruthy()
        expect(screen.getByText('Q-20260305-001')).toBeTruthy()
        expect(screen.getByText('待确认')).toBeTruthy()

        // 验证分组和商品名
        expect(screen.getByText('阳台')).toBeTruthy()
        expect(screen.getByText('主卧')).toBeTruthy()
        expect(screen.getByText('阳光房电动卷帘')).toBeTruthy()
        expect(screen.getByText('主卧真丝遮光帘')).toBeTruthy()

        // 验证未确认时的底部按钮
        expect(screen.getByText('确认并电子签字')).toBeTruthy()
    })
})
