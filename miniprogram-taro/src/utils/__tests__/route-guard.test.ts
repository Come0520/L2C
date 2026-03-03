import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import { isPublicPage, requireAuth, requireRole } from '../route-guard'

// Mock Taro
jest.mock('@tarojs/taro', () => ({
    __esModule: true,
    default: {
        redirectTo: jest.fn(),
        switchTab: jest.fn(() => Promise.resolve()),
    }
}))

// Mock useAuthStore
jest.mock('@/stores/auth', () => ({
    useAuthStore: {
        getState: jest.fn(),
    },
    ROLE_HOME: {
        manager: '/pages/workbench/index',
        sales: '/pages/workbench/index',
        worker: '/pages/tasks/index',
        customer: '/pages/showroom/index',
        guest: '/pages/login/index',
        admin: '/pages/workbench/index',
    },
}))

describe('路由守卫 (route-guard)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('isPublicPage', () => {
        it('1. isPublicPage 应正确识别公开页面', () => {
            expect(isPublicPage('/pages/login/index')).toBe(true)
            expect(isPublicPage('/pages/landing/index?id=123')).toBe(true)
        })

        it('2. isPublicPage 应正确拒绝非公开页面', () => {
            expect(isPublicPage('/pages/workbench/index')).toBe(false)
            expect(isPublicPage('/pages/leads/index')).toBe(false)
        })
    })

    describe('requireAuth', () => {
        it('3. requireAuth 未登录时应重定向到登录页', () => {
            ; (useAuthStore.getState as jest.Mock).mockReturnValue({ isLoggedIn: false })
            const result = requireAuth()
            expect(result).toBe(false)
            expect(Taro.redirectTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
        })

        it('4. requireAuth 已登录时应返回 true', () => {
            ; (useAuthStore.getState as jest.Mock).mockReturnValue({ isLoggedIn: true })
            const result = requireAuth()
            expect(result).toBe(true)
            expect(Taro.redirectTo).not.toHaveBeenCalled()
        })
    })

    describe('requireRole', () => {
        it('5. requireRole 未登录时应重定向到登录页', () => {
            ; (useAuthStore.getState as jest.Mock).mockReturnValue({ isLoggedIn: false, currentRole: 'guest' })
            const result = requireRole(['manager'])
            expect(result).toBe(false)
            expect(Taro.redirectTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
        })

        it('6. requireRole 角色匹配时应返回 true', () => {
            ; (useAuthStore.getState as jest.Mock).mockReturnValue({ isLoggedIn: true, currentRole: 'sales' })
            const result = requireRole(['manager', 'sales'])
            expect(result).toBe(true)
            expect(Taro.redirectTo).not.toHaveBeenCalled()
            expect(Taro.switchTab).not.toHaveBeenCalled()
        })

        it('7. requireRole 角色不匹配时应重定向到角色首页', () => {
            ; (useAuthStore.getState as jest.Mock).mockReturnValue({ isLoggedIn: true, currentRole: 'customer' })
            const result = requireRole(['manager', 'sales'])
            expect(result).toBe(false)
            expect(Taro.switchTab).toHaveBeenCalledWith({ url: '/pages/showroom/index' })
        })
    })
})
