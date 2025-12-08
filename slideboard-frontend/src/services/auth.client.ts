import { handleSupabaseError, ApiError } from '@/lib/api/error-handler'
import { createClient } from '@/lib/supabase/client'

/**
 * 认证服务
 * 使用 Supabase Auth 进行用户认证管理
 */
export const authService = {
    /**
     * 手机号登录
     */
    async loginWithPhone(phone: string, password: string) {
        const supabase = createClient()

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            throw new ApiError('手机号格式不正确', 'INVALID_PHONE', 400)
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            phone,
            password,
        })

        if (error) {
            throw new ApiError(error.message || '登录失败', error.code || 'AUTH_ERROR', 401)
        }

        return {
            user: data.user,
            session: data.session,
        }
    },

    async loginWithSms(phone: string, verificationCode: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token: verificationCode,
            type: 'sms',
        })
        if (error) {
            throw new ApiError(error.message || '验证码登录失败', error.code || 'AUTH_ERROR', 400)
        }
        return { user: data?.user, session: data?.session }
    },



    /**
     * 手机号注册
     */
    async registerWithPhone(phone: string, password: string, metadata?: Record<string, unknown>) {
        const supabase = createClient()

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            throw new ApiError('手机号格式不正确', 'INVALID_PHONE', 400)
        }

        // 验证密码强度
        if (password.length < 6) {
            throw new ApiError('密码长度至少为 6 位', 'WEAK_PASSWORD', 400)
        }

        const { data, error } = await supabase.auth.signUp({
            phone,
            password,
            options: {
                data: metadata,
            },
        })

        if (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handleSupabaseError(error as any)
        }

        return {
            user: data.user,
            session: data.session,
        }
    },

    async register(phone: string, password: string, name?: string) {
        const result = await authService.registerWithPhone(phone, password, name ? { name } : undefined)
        return { user: result.user }
    },



    /**
     * 登出
     */
    async logout() {
        const supabase = createClient()

        const { error } = await supabase.auth.signOut()

        if (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handleSupabaseError(error as any)
        }
    },

    /**
     * 获取当前用户
     */
    async getCurrentUser() {
        const supabase = createClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            handleSupabaseError(error as any)
        }

        return user
    },

    /**
     * 获取当前会话
     */
    async getSession() {
        const supabase = createClient()

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            handleSupabaseError(error as any)
        }

        return session
    },

    /**
     * 刷新会话
     */
    async refreshSession() {
        const supabase = createClient()

        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
            handleSupabaseError(error as any)
        }

        return data.session
    },

    /**
     * 更新用户信息
     */
    async updateUser(attributes: {
        phone?: string
        password?: string
        data?: Record<string, unknown>
    }) {
        const supabase = createClient()

        const { data, error } = await supabase.auth.updateUser(attributes)

        if (error) {
            handleSupabaseError(error as any)
        }

        return data.user
    },



    /**
     * 验证 OTP（一次性密码）
     */
    async verifyOtp(phone: string, token: string) {
        const supabase = createClient()

        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        })

        if (error) {
            handleSupabaseError(error as any)
        }

        return {
            user: data.user,
            session: data.session,
        }
    },

    /**
     * 发送手机验证码
     */
    async sendOtp(phone: string) {
        const supabase = createClient()

        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            throw new ApiError('手机号格式不正确', 'INVALID_PHONE', 400)
        }

        const { error } = await supabase.auth.signInWithOtp({
            phone,
        })

        if (error) {
            handleSupabaseError(error as any)
        }
    },

    async sendVerificationCode(phone: string) {
        return authService.sendOtp(phone)
    },

    /**
     * 监听认证状态变化
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        const supabase = createClient()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)

        return {
            unsubscribe: () => subscription.unsubscribe(),
        }
    },
}
