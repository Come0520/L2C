/**
 * API 服务层单元测试
 *
 * @description 测试统一请求封装的全部功能：
 * GET/POST 请求、Token 自动携带、401 处理、错误处理。
 */
import { api } from '../api'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import { __clearMockStorage } from '../../__mocks__/@tarojs/taro'

describe('API 服务层', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        __clearMockStorage()
        // 重置 Store
        useAuthStore.setState({
            userInfo: null,
            token: '',
            isLoggedIn: false,
            currentRole: 'guest',
        })
    })

    // ========== 基本请求 ==========

    test('GET 请求应正确拼接 URL 并发送', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { items: [] } },
        })

        const res = await api.get('/dashboard')

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'GET',
                url: expect.stringContaining('/dashboard'),
            })
        )
        expect(res.success).toBe(true)
    })

    test('POST 请求应携带 data 参数', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: { id: '123' } },
        })

        const postData = { name: '张三', phone: '13800138000' }
        await api.post('/leads', { data: postData })

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                data: postData,
            })
        )
    })

    // ========== Token 处理 ==========

    test('请求应自动携带 Authorization header（当有 token 时）', async () => {
        // 先登录设置 token
        useAuthStore.getState().setLogin('my-jwt-token', {
            id: 'u1', name: '测试', role: 'sales',
        })

            ; (Taro.request as jest.Mock).mockResolvedValue({
                statusCode: 200,
                data: { data: {} },
            })

        await api.get('/test')

        expect(Taro.request).toHaveBeenCalledWith(
            expect.objectContaining({
                header: expect.objectContaining({
                    Authorization: 'Bearer my-jwt-token',
                }),
            })
        )
    })

    test('无 token 时不应携带 Authorization header', async () => {
        ; (Taro.request as jest.Mock).mockResolvedValue({
            statusCode: 200,
            data: { data: {} },
        })

        await api.get('/test')

        const callArgs = (Taro.request as jest.Mock).mock.calls[0][0]
        expect(callArgs.header.Authorization).toBeUndefined()
    })

    // ========== 错误处理 ==========

    test('HTTP 401 应触发自动登出并跳转登录页', async () => {
        // 先登录
        useAuthStore.getState().setLogin('expired-token', {
            id: 'u1', name: '测试', role: 'sales',
        })

            ; (Taro.request as jest.Mock).mockResolvedValue({
                statusCode: 401,
                data: { message: 'Unauthorized' },
            })

        const res = await api.get('/protected-resource')

        // 应返回失败
        expect(res.success).toBe(false)
        expect(res.error).toBe('登录已过期')

        // 应跳转到登录页
        expect(Taro.navigateTo).toHaveBeenCalledWith({
            url: '/pages/login/index',
        })
    })

    test('网络错误应返回友好错误信息', async () => {
        ; (Taro.request as jest.Mock).mockRejectedValue({
            errMsg: 'request:fail net::ERR_CONNECTION_REFUSED',
        })

        const res = await api.get('/test')

        expect(res.success).toBe(false)
        expect(res.error).toContain('request:fail')
    })
})
