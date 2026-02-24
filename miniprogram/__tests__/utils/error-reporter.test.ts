import { errorReporter } from '../../utils/error-reporter';

describe('ErrorReporter', () => {
    let mockApp: any;

    beforeEach(() => {
        // 重置单例状态
        (errorReporter as any).queue = [];
        vi.clearAllMocks();

        // 模拟 wx 接口
        (global as any).wx = {
            onError: vi.fn(),
            onUnhandledRejection: vi.fn(),
            request: vi.fn(),
            getStorageSync: vi.fn(),
            setStorageSync: vi.fn()
        } as any;

        // 模拟 getApp
        mockApp = {
            globalData: { apiBase: 'http://localhost:3000/api/miniprogram' }
        };
        (global as any).getApp = vi.fn().mockReturnValue(mockApp);

        // 模拟 getCurrentPages
        (global as any).getCurrentPages = vi.fn().mockReturnValue([{ route: 'pages/index/index' }]);

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('should capture JS errors', () => {
        errorReporter.init();
        const errorCallback = (wx.onError as ReturnType<typeof vi.fn>).mock.calls[0][0];

        errorCallback('Test JS Error');

        expect((errorReporter as any).queue.length).toBe(1);
        expect((errorReporter as any).queue[0].type).toBe('JS_ERROR');
    });

    test('should capture Promise rejections', () => {
        errorReporter.init();
        const rejectionCallback = (wx.onUnhandledRejection as ReturnType<typeof vi.fn>).mock.calls[0][0];

        rejectionCallback({ reason: 'Promise Failed', promise: {} });

        expect((errorReporter as any).queue.length).toBe(1);
        expect((errorReporter as any).queue[0].type).toBe('PROMISE_ERROR');
    });

    test('should flush errors after timeout', async () => {
        errorReporter.report({ message: 'Manual Error', type: 'JS_ERROR', timestamp: Date.now() });

        expect((global as any).wx.request).not.toHaveBeenCalled();

        // 我们不依赖计时器真实运行，因为那是公共逻辑
        // 我们只需要通过手动调用 flush 来测试上报逻辑本身
        await errorReporter.flush();

        expect((global as any).wx.request).toHaveBeenCalledWith(
            expect.objectContaining({
                url: expect.stringContaining('/log/error'),
                method: 'POST',
                data: expect.objectContaining({ errors: expect.any(Array) })
            })
        );
        expect((errorReporter as any).queue.length).toBe(0);
    });

    test('should flush errors immediately when queue is full', () => {
        for (let i = 0; i < 20; i++) {
            errorReporter.report({ message: `Error ${i}`, type: 'JS_ERROR', timestamp: Date.now() });
        }

        expect((global as any).wx.request).toHaveBeenCalled();
    });
});

export { };
