import { Logger } from '../logger'
import { useAuthStore } from '@/stores/auth'

// Mock useAuthStore
jest.mock('@/stores/auth', () => ({
    useAuthStore: {
        getState: jest.fn(),
    },
}))

describe('Logger', () => {
    let consoleLogSpy: jest.SpyInstance
    let consoleWarnSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        // 默认未登录
        ; (useAuthStore.getState as jest.Mock).mockReturnValue({
            userInfo: undefined,
        })

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { })
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        // Mock 系统时间，确保 timestamp 测试稳定
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    it('Logger.info 应输出正确格式的日志', () => {
        Logger.info('TEST', 'test_action', { foo: 'bar' })
        expect(consoleLogSpy).toHaveBeenCalledWith(
            '[TEST] test_action',
            expect.objectContaining({
                level: 'info',
                module: 'TEST',
                action: 'test_action',
                data: { foo: 'bar' },
            })
        )
    })

    it('Logger.warn 应使用 console.warn', () => {
        Logger.warn('TEST', 'test_warn')
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[TEST] test_warn',
            expect.objectContaining({
                level: 'warn',
                module: 'TEST',
                action: 'test_warn',
            })
        )
    })

    it('Logger.error 应包含 error.message', () => {
        const error = new Error('测试错误消息')
        Logger.error('TEST', 'test_error', error)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[TEST] test_error',
            expect.objectContaining({
                level: 'error',
                error: '测试错误消息',
            })
        )
    })

    it('日志条目应包含 timestamp', () => {
        Logger.info('TEST', 'test_timestamp')
        expect(consoleLogSpy).toHaveBeenCalledWith(
            '[TEST] test_timestamp',
            expect.objectContaining({
                timestamp: '2026-01-01T00:00:00.000Z',
            })
        )
    })

    it('已登录时日志应包含 userId', () => {
        ; (useAuthStore.getState as jest.Mock).mockReturnValue({
            userInfo: { id: 'user_123' },
        })
        Logger.info('TEST', 'test_user')
        expect(consoleLogSpy).toHaveBeenCalledWith(
            '[TEST] test_user',
            expect.objectContaining({
                userId: 'user_123',
            })
        )
    })

    it('未登录时日志 userId 应为 undefined', () => {
        Logger.info('TEST', 'test_no_user')
        expect(consoleLogSpy).toHaveBeenCalledWith(
            '[TEST] test_no_user',
            expect.objectContaining({
                userId: undefined,
            })
        )
    })
})
