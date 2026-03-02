/**
 * 租户落地页状态管理 (Zustand)
 *
 * @description 管理小程序落地页的租户信息状态。
 * 当用户通过分享链接或扫码进入时，解析 tenantCode 并获取租户公开信息。
 */
import { create } from 'zustand'
import { api } from '@/services/api'

/** 租户公开信息（与后端 TenantPublicProfile 对应） */
export interface TenantPublicProfile {
    name: string
    logoUrl: string | null
    slogan: string | null
    region: string | null
    detailAddress: string | null
    phone: string | null
    contactWechat: string | null
    landingCoverUrl: string | null
}

/** 落地页状态接口 */
interface TenantLandingState {
    /** 从 URL 参数解析的租户码 */
    tenantCode: string | null
    /** 租户公开信息 */
    profile: TenantPublicProfile | null
    /** 加载状态 */
    loading: boolean
    /** 错误信息 */
    error: string | null

    /** 获取租户公开信息 */
    fetchProfile: (code: string) => Promise<void>
    /** 重置状态 */
    reset: () => void
}

/**
 * 租户落地页 Store
 *
 * @example
 * ```tsx
 * const { profile, loading, fetchProfile } = useTenantLandingStore()
 * useEffect(() => { fetchProfile('SHANGJIA88') }, [])
 * ```
 */
export const useTenantLandingStore = create<TenantLandingState>((set) => ({
    tenantCode: null,
    profile: null,
    loading: false,
    error: null,

    fetchProfile: async (code: string) => {
        set({ tenantCode: code, loading: true, error: null })
        try {
            const res = await api.get<TenantPublicProfile>(
                `/miniprogram/tenant/public-profile?code=${encodeURIComponent(code)}`
            )
            if (res.success && res.data) {
                set({ profile: res.data, loading: false })
            } else {
                // 查询失败，降级为 L2C 官方页面
                set({ profile: null, tenantCode: null, loading: false, error: res.error || '未找到商家' })
            }
        } catch {
            set({ profile: null, tenantCode: null, loading: false, error: '网络请求失败' })
        }
    },

    reset: () => {
        set({ tenantCode: null, profile: null, loading: false, error: null })
    },
}))
