/**
 * 认证状态管理 (Zustand)
 *
 * @description 基于最新四大角色架构设计文档（2026-03-02 已审批）重写。
 * 四大角色：Manager / Sales / Worker / Customer
 * 注意：`installer` 已废弃，统一使用 `worker`，与数据库枚举 `userRoleEnum` 一致。
 */
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { api } from '@/services/api'

/**
 * 用户角色类型
 *
 * @description 四大核心角色 + 两个系统角色
 * - manager: 店长/管理员，2 Tab（工作台、我的）
 * - sales:   销售顾问，4 Tab（工作台、线索、云展厅、我的）
 * - worker:  安装工/测量师，2 Tab（任务、我的）
 * - customer: 客户，2 Tab（展厅、我的）
 * - guest:   未登录，不显示 Tab
 * - admin:   超级管理员（兼容旧数据，等同 manager）
 */
export type UserRole = 'manager' | 'sales' | 'worker' | 'customer' | 'guest' | 'admin'

/** 用户信息接口 */
export interface UserInfo {
    id: string
    name: string
    avatarUrl?: string
    role: UserRole
    tenantId?: string
    tenantName?: string
    phone?: string
    tenantStatus?: string
}

/**
 * 各角色对应的 TabBar 配置
 *
 * @description 基于 app.config.ts 中 tabBar.list 的槽位索引
 * 槽位：0=工作台, 1=线索, 2=展厅, 3=任务, 4=我的
 */
export const ROLE_TABS: Record<UserRole, number[]> = {
    manager: [0, 4],            // 工作台、我的
    admin: [0, 4],              // 同 manager（兼容旧数据）
    sales: [0, 1, 2, 4],       // 工作台、线索、云展厅、我的
    worker: [3, 4],             // 任务、我的
    customer: [2, 4],           // 展厅、我的
    guest: [],                  // 未登录，不显示
}

/** 各角色的默认落地页（首次进入时跳转） */
export const ROLE_HOME: Record<UserRole, string> = {
    manager: '/pages/workbench/index',
    admin: '/pages/workbench/index',
    sales: '/pages/workbench/index',
    worker: '/pages/tasks/index',
    customer: '/pages/showroom/index',
    guest: '/pages/login/index',
}

/** 认证状态接口 */
interface AuthState {
    /** 用户信息 */
    userInfo: UserInfo | null
    /** JWT Token */
    token: string
    /** 是否已登录 */
    isLoggedIn: boolean
    /** 当前角色 */
    currentRole: UserRole

    /** 设置登录态 */
    setLogin: (token: string, userInfo: UserInfo) => void
    /** 退出登录 */
    logout: () => void
    /** 更新角色 */
    updateRole: (role: UserRole) => void
    /** 从 Storage 同步恢复登录态（保留，供单元测试使用） */
    restore: () => void
    /**
     * 异步恢复并校验登录态（App 冷启动时调用）
     *
     * @description 流程：读 Storage → 调 /auth/me 校验 Token
     * - 成功：用接口返回的最新 userInfo 更新 store
     * - 失败/过期：清除 Storage，保持 guest 状态
     */
    restoreAndVerify: () => Promise<void>
}

/**
 * 认证状态 Store
 *
 * @example
 * ```tsx
 * const { isLoggedIn, currentRole, userInfo } = useAuthStore()
 * const tabs = ROLE_TABS[currentRole]   // 该角色可见的 Tab 索引
 * const home = ROLE_HOME[currentRole]   // 该角色的默认落地页
 * ```
 */
export const useAuthStore = create<AuthState>((set) => ({
    userInfo: null,
    token: '',
    isLoggedIn: false,
    currentRole: 'guest',

    setLogin: (token: string, userInfo: UserInfo) => {
        /**
         * 角色规范化：后端存储大写（ADMIN / BOSS / SALES），前端统一小写。
         * BOSS 在数据库中是管理员，映射到 manager 角色。
         */
        const rawRole = (userInfo.role as string)?.toLowerCase() || 'guest'
        const normalizedRole: UserRole = rawRole === 'boss' ? 'manager' : rawRole as UserRole
        const normalizedUser: UserInfo = { ...userInfo, role: normalizedRole }

        Taro.setStorageSync('token', token)
        Taro.setStorageSync('userInfo', normalizedUser)
        set({
            token,
            userInfo: normalizedUser,
            isLoggedIn: true,
            currentRole: normalizedRole,
        })
    },

    logout: () => {
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('userInfo')
        set({
            token: '',
            userInfo: null,
            isLoggedIn: false,
            currentRole: 'guest',
        })
    },

    updateRole: (role: UserRole) => {
        set((state) => {
            if (state.userInfo) {
                const updated = { ...state.userInfo, role }
                Taro.setStorageSync('userInfo', updated)
                return { userInfo: updated, currentRole: role }
            }
            return {}
        })
    },

    restore: () => {
        try {
            const token = Taro.getStorageSync('token')
            const userInfo = Taro.getStorageSync('userInfo')
            if (token && userInfo) {
                // 兼容旧 Storage 中可能存在的大写角色
                const rawRole = (userInfo.role as string)?.toLowerCase() || 'guest'
                const role: UserRole = rawRole === 'boss' ? 'manager' : rawRole as UserRole
                set({
                    token,
                    userInfo: { ...userInfo, role },
                    isLoggedIn: true,
                    currentRole: role,
                })
            }
        } catch (e) {
            console.error('恢复登录态失败', e)
        }
    },

    restoreAndVerify: async () => {
        try {
            const token = Taro.getStorageSync('token')
            const userInfo = Taro.getStorageSync('userInfo')

            // Storage 为空，保持 guest 状态，无需网络请求
            if (!token || !userInfo) return

            // 先用 Storage 数据临时恢复，使后续 api 请求能携带 token
            set({
                token,
                userInfo,
                isLoggedIn: true,
                currentRole: userInfo.role || 'guest',
            })

            // 调用 /auth/me 验证 token 有效性，并获取最新用户信息
            const res = await api.get<UserInfo>('/auth/me')

            if (res.success && res.data) {
                // Token 有效，角色规范化后更新 store
                const rawRole = (res.data.role as string)?.toLowerCase() || 'guest'
                const role: UserRole = rawRole === 'boss' ? 'manager' : rawRole as UserRole
                const normalizedUser: UserInfo = { ...res.data, role }
                Taro.setStorageSync('userInfo', normalizedUser)
                set({
                    userInfo: normalizedUser,
                    currentRole: role,
                })
            } else {
                // Token 无效或过期，清除所有登录态
                Taro.removeStorageSync('token')
                Taro.removeStorageSync('userInfo')
                set({
                    token: '',
                    userInfo: null,
                    isLoggedIn: false,
                    currentRole: 'guest',
                })
            }
        } catch (e) {
            console.error('[Auth] restoreAndVerify 失败', e)
            // 网络异常时保守处理：清除登录态，要求重新登录
            Taro.removeStorageSync('token')
            Taro.removeStorageSync('userInfo')
            set({
                token: '',
                userInfo: null,
                isLoggedIn: false,
                currentRole: 'guest',
            })
        }
    },
}))
