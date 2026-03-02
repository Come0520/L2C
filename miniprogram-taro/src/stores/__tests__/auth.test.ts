/**
 * Auth Store 单元测试
 *
 * @description 测试认证状态管理的全部功能：
 * 登录/登出/角色切换/Storage 持久化/状态恢复/角色常量。
 */
import { useAuthStore, ROLE_TABS, ROLE_HOME, type UserInfo } from '../auth'
import { __clearMockStorage } from '../../__mocks__/@tarojs/taro'
import Taro from '@tarojs/taro'

/** 标准测试用户 */
const mockUser: UserInfo = {
    id: 'user-001',
    name: '张三',
    role: 'sales',
    tenantId: 'tenant-001',
    tenantName: '测试窗帘店',
    phone: '13800138000',
}

describe('Auth Store', () => {
    beforeEach(() => {
        useAuthStore.setState({
            userInfo: null,
            token: '',
            isLoggedIn: false,
            currentRole: 'guest',
        })
        __clearMockStorage()
        jest.clearAllMocks()
    })

    test('初始状态应为 guest、未登录', () => {
        const state = useAuthStore.getState()
        expect(state.isLoggedIn).toBe(false)
        expect(state.currentRole).toBe('guest')
        expect(state.userInfo).toBeNull()
        expect(state.token).toBe('')
    })

    test('setLogin 应正确设置 token、userInfo、isLoggedIn、currentRole', () => {
        useAuthStore.getState().setLogin('jwt-token-123', mockUser)
        const state = useAuthStore.getState()
        expect(state.token).toBe('jwt-token-123')
        expect(state.userInfo).toEqual(mockUser)
        expect(state.isLoggedIn).toBe(true)
        expect(state.currentRole).toBe('sales')
    })

    test('setLogin 应将 token 和 userInfo 持久化到 Storage', () => {
        useAuthStore.getState().setLogin('jwt-token-123', mockUser)
        expect(Taro.setStorageSync).toHaveBeenCalledWith('token', 'jwt-token-123')
        expect(Taro.setStorageSync).toHaveBeenCalledWith('userInfo', mockUser)
    })

    test('logout 应清除所有登录态', () => {
        useAuthStore.getState().setLogin('jwt-token-123', mockUser)
        useAuthStore.getState().logout()
        const state = useAuthStore.getState()
        expect(state.isLoggedIn).toBe(false)
        expect(state.currentRole).toBe('guest')
        expect(state.userInfo).toBeNull()
        expect(state.token).toBe('')
    })

    test('logout 应清除 Storage 中的数据', () => {
        useAuthStore.getState().setLogin('jwt-token-123', mockUser)
        jest.clearAllMocks()
        useAuthStore.getState().logout()
        expect(Taro.removeStorageSync).toHaveBeenCalledWith('token')
        expect(Taro.removeStorageSync).toHaveBeenCalledWith('userInfo')
    })

    test('updateRole 应更新角色并同步 Storage', () => {
        useAuthStore.getState().setLogin('jwt-token-123', mockUser)
        jest.clearAllMocks()
        useAuthStore.getState().updateRole('manager')
        const state = useAuthStore.getState()
        expect(state.currentRole).toBe('manager')
        expect(state.userInfo?.role).toBe('manager')
        expect(Taro.setStorageSync).toHaveBeenCalledWith('userInfo',
            expect.objectContaining({ role: 'manager' })
        )
    })

    test('restore 应从 Storage 恢复登录态', () => {
        ; (Taro.getStorageSync as jest.Mock)
            .mockImplementation((key: string) => {
                if (key === 'token') return 'stored-token'
                if (key === 'userInfo') return mockUser
                return ''
            })
        useAuthStore.getState().restore()
        const state = useAuthStore.getState()
        expect(state.isLoggedIn).toBe(true)
        expect(state.token).toBe('stored-token')
        expect(state.userInfo).toEqual(mockUser)
        expect(state.currentRole).toBe('sales')
    })

    test('restore 在 Storage 为空时应保持 guest 状态', () => {
        ; (Taro.getStorageSync as jest.Mock).mockReturnValue('')
        useAuthStore.getState().restore()
        const state = useAuthStore.getState()
        expect(state.isLoggedIn).toBe(false)
        expect(state.currentRole).toBe('guest')
    })

    test('ROLE_TABS 应为每个角色返回正确的 Tab 索引', () => {
        expect(ROLE_TABS.manager).toEqual([0, 4])
        expect(ROLE_TABS.admin).toEqual([0, 4])
        expect(ROLE_TABS.sales).toEqual([0, 1, 2, 4])
        expect(ROLE_TABS.worker).toEqual([3, 4])
        expect(ROLE_TABS.customer).toEqual([2, 4])
        expect(ROLE_TABS.guest).toEqual([])
    })

    test('ROLE_HOME 应为每个角色返回正确的落地页路径', () => {
        expect(ROLE_HOME.manager).toBe('/pages/workbench/index')
        expect(ROLE_HOME.admin).toBe('/pages/workbench/index')
        expect(ROLE_HOME.sales).toBe('/pages/workbench/index')
        expect(ROLE_HOME.worker).toBe('/pages/tasks/index')
        expect(ROLE_HOME.customer).toBe('/pages/showroom/index')
        expect(ROLE_HOME.guest).toBe('/pages/login/index')
    })
})
