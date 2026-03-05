import { render, screen, fireEvent, act } from '@testing-library/react'
import Taro from '@tarojs/taro'
import { api } from '@/services/api'
import AfterSalesPage from '../index'

// --- Mock Setup ---
// Taro mock will be mutated directly in beforeEach

jest.mock('@/services/api', () => ({
    api: {
        post: jest.fn(),
        upload: jest.fn(),
    }
}))

describe('AfterSalesPage - 报修提交联调', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        Taro.showToast = jest.fn()
        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.navigateBack = jest.fn()
        Taro.chooseMedia = jest.fn().mockImplementation(({ success }) => {
            success({ tempFiles: [{ tempFilePath: 'mock-temp-img.jpg' }] })
        })
    })

    it('renders the form correctly', () => {
        render(<AfterSalesPage />)
        expect(screen.getByText('申请售后服务')).toBeTruthy()
        expect(screen.getByText('服务类型')).toBeTruthy()
        expect(screen.getByPlaceholderText('请输入相关订单号')).toBeTruthy()
        expect(screen.getByPlaceholderText('请输入您的手机号')).toBeTruthy()
        expect(screen.getByPlaceholderText(/请详细描述您遇到的问题/)).toBeTruthy()
    })

    it('submits after-sales form successfully with image', async () => {
        ; (api.upload as jest.Mock).mockResolvedValue({ data: { url: 'https://mock.url/img.jpg' } })
            ; (api.post as jest.Mock).mockResolvedValue({ success: true, data: { ticketId: 'T-123' } })

        render(<AfterSalesPage />)

        // 1. Select Service Type (index 0 for '维修')
        const mockPicker = screen.getByTestId('mock-picker')
        fireEvent.click(mockPicker)

        // 2. Input Order ID
        const orderInput = screen.getByPlaceholderText('请输入相关订单号')
        fireEvent.change(orderInput, { target: { value: 'OD-999' } })

        // 3. Input Phone
        const phoneInput = screen.getByPlaceholderText('请输入您的手机号')
        fireEvent.change(phoneInput, { target: { value: '13812345678' } })

        // 4. Input Description
        const descInput = screen.getByPlaceholderText(/请详细描述您遇到的问题/)
        fireEvent.change(descInput, { target: { value: '机器不启动，显示E1故障码' } })

        // 5. Add Image
        const addImageBtn = screen.getByText('添加照片')
        fireEvent.click(addImageBtn) // Will trigger Taro.chooseMedia mock

        // 6. Submit
        const submitBtn = screen.getByText('提交申请')
        // Note: The real button component is a `button` element.
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        // Verify
        expect(api.upload).toHaveBeenCalledWith('/upload', 'mock-temp-img.jpg', 'file')
        expect(api.post).toHaveBeenCalledWith('/service/tickets', {
            data: {
                orderId: 'OD-999',
                type: 'REPAIR',
                description: '机器不启动，显示E1故障码\n\n联系电话: 13812345678',
                photos: ['https://mock.url/img.jpg']
            }
        })
        expect(Taro.showToast).toHaveBeenLastCalledWith({ title: '提交成功', icon: 'success' })
    })

    it('validates required fields before submitting', async () => {
        render(<AfterSalesPage />)
        const submitBtn = screen.getByText('提交申请')

        // Initially button might be disabled, but let's test the component logic by forcing click if possible, or assert disabled state.
        // Component has: disabled={loading || !form.type || form.description.length === 0 || !form.orderId.trim()}
        // If it's disabled, tests might not trigger onClick. Let's assert it is disabled instead of triggering click.
        expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
    })
})
