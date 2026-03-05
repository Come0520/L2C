import { render, screen, act, fireEvent } from '@testing-library/react'
import Taro, { useLoad } from '@tarojs/taro'
import Acceptance from '../index'
import { api } from '@/services/api'
import { customerService } from '@/services/customer-service'

jest.mock('@/services/api', () => ({
    api: {
        upload: jest.fn()
    }
}))
jest.mock('@/services/customer-service', () => ({
    customerService: {
        acceptInstallation: jest.fn()
    }
}))
jest.mock('@tarojs/components', () => {
    const original = jest.requireActual('@tarojs/components')
    return {
        ...original,
        Canvas: (props: any) => (
            <div
                id={props.id}
                className={props.className}
                data-testid="mock-canvas"
                onTouchStart={props.onTouchStart}
                onTouchMove={(e: any) => {
                    // 补充必要的模拟行为
                    if (!e.stopPropagation) e.stopPropagation = jest.fn()
                    if (!e.preventDefault) e.preventDefault = jest.fn()
                    props.onTouchMove(e)
                }}
                onTouchEnd={props.onTouchEnd}
            />
        )
    }
})

let capturedUseLoadCallback: any = null

describe('Acceptance - 验收接口绑定与表单交互联调', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedUseLoadCallback = null

        Taro.showToast = jest.fn()
        Taro.showLoading = jest.fn()
        Taro.hideLoading = jest.fn()
        Taro.navigateBack = jest.fn()

        // Mock 画布相关依赖
        Taro.nextTick = jest.fn((cb) => cb())
        Taro.createSelectorQuery = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            fields: jest.fn().mockReturnThis(),
            exec: jest.fn((cb) => {
                cb([{
                    node: {
                        getContext: () => ({
                            scale: jest.fn(),
                            beginPath: jest.fn(),
                            moveTo: jest.fn(),
                            lineTo: jest.fn(),
                            stroke: jest.fn(),
                            clearRect: jest.fn()
                        }),
                        width: 300,
                        height: 150
                    },
                    width: 300,
                    height: 150
                }])
            })
        })

        // Mock Taro API
        Taro.getSystemInfoSync = jest.fn().mockReturnValue({ pixelRatio: 2 })
        Taro.chooseMedia = jest.fn().mockImplementation(({ success }) => {
            success({ tempFiles: [{ tempFilePath: 'tmp://photo1' }, { tempFilePath: 'tmp://photo2' }] })
        })
        Taro.canvasToTempFilePath = jest.fn().mockImplementation(({ success }) => {
            success({ tempFilePath: 'tmp://signature' })
        })

            ; (useLoad as jest.Mock).mockImplementation((cb) => {
                capturedUseLoadCallback = cb
            })

            // Mock 业务 API 返回
            ; (api.upload as jest.Mock).mockImplementation((path) => {
                return Promise.resolve({ data: `https://mock.url/${path.split('//')[1]}` })
            })
            ; (customerService.acceptInstallation as jest.Mock).mockResolvedValue({ success: true })
    })

    const renderAndLoad = async (id = 'OD-12345') => {
        const utils = render(<Acceptance />)
        if (capturedUseLoadCallback) {
            await act(async () => {
                await capturedUseLoadCallback({ id })
            })
        }
        return utils
    }

    it('submits acceptance data successfully calling the correct api endpoints', async () => {
        await renderAndLoad('OD-12345')

        // 验证初始化
        expect(screen.getByText('订单：OD-12345')).toBeTruthy()

        // 1. 模拟上传图片
        const uploadBtn = screen.getByText('添加照片')
        await act(async () => {
            fireEvent.click(uploadBtn)
        })

        // 2. 模拟电子签字
        const canvasElement = screen.getByTestId('mock-canvas')
        await act(async () => {
            fireEvent.touchStart(canvasElement, { touches: [{ x: 10, y: 10 }] })
        })
        await act(async () => {
            fireEvent.touchMove(canvasElement, { touches: [{ x: 20, y: 20 }] })
        })
        await act(async () => {
            fireEvent.touchEnd(canvasElement)
        })

        // 3. 点击提交
        const submitBtn = screen.getByText('确认并完成验收')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        // 验证：
        // a. 生成临时签名区图片
        expect(Taro.canvasToTempFilePath).toHaveBeenCalled()

        // b. 上传全部图片到 OSS
        expect(api.upload).toHaveBeenCalledTimes(3) // 两张现场照片 + 一张签名
        expect(api.upload).toHaveBeenCalledWith('tmp://photo1', 'acceptance')
        expect(api.upload).toHaveBeenCalledWith('tmp://photo2', 'acceptance')
        expect(api.upload).toHaveBeenCalledWith('tmp://signature', 'signature')

        // c. 调用真正业务接口
        expect(customerService.acceptInstallation).toHaveBeenCalledWith('OD-12345', {
            photoUrls: ['https://mock.url/photo1', 'https://mock.url/photo2'],
            signatureUrl: 'https://mock.url/signature'
        })

        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '验收成功' }))
    })

    it('prevents submission if signature is missing', async () => {
        await renderAndLoad('OD-12345')

        const submitBtn = screen.getByText('确认并完成验收')
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        expect(Taro.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/签字|上传/) }))
        expect(customerService.acceptInstallation).not.toHaveBeenCalled()
    })
})
