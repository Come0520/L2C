import { User as SupabaseUser, Session, AuthError, PostgrestError } from '@supabase/supabase-js'

import { handleSupabaseError, ApiError } from '@/lib/api/error-handler'
import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/shared/types/auth'

/**
 * 映射 Supabase 用户到应用用户
 */
function mapSupabaseUserToUser(supabaseUser: SupabaseUser): User {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        phone: supabaseUser.phone || '',
        name: supabaseUser.user_metadata?.name || '',
        avatarUrl: supabaseUser.user_metadata?.avatar_url,
        role: (supabaseUser.user_metadata?.role as UserRole) || 'user',
        createdAt: supabaseUser.created_at,
        updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
    }
}

/**
 * 认证服务
 * 使用 Supabase Auth 进行用户认证管理
 */
export const authService = {
    /**
     * 手机号或邮箱登录
     */
    async loginWithPhone(identifier: string, password: string) {
        const supabase = createClient()

        // 判断是手机号还是邮箱
        const isEmail = identifier.includes('@');
        
        // 如果是手机号，且看起来像手机号（纯数字且11位），则验证格式
        // 否则直接尝试登录，交给 Supabase 判断
        if (!isEmail && /^\d+$/.test(identifier) && identifier.length === 11) {
            if (!/^1[3-9]\d{9}$/.test(identifier)) {
                throw new ApiError('手机号格式不正确', 'INVALID_PHONE', 400)
            }
        }

        let result;
        
        if (isEmail) {
             result = await supabase.auth.signInWithPassword({
                email: identifier,
                password,
            })
        } else {
             result = await supabase.auth.signInWithPassword({
                phone: identifier,
                password,
            })
        }

        const { data, error } = result;

        if (error) {
            throw new ApiError(error.message || '登录失败', error.code || 'AUTH_ERROR', 401)
        }

        return {
            user: data.user ? mapSupabaseUserToUser(data.user) : null,
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
        return { 
            user: data.user ? mapSupabaseUserToUser(data.user) : null,
            session: data.session 
        }
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
                data: {
                    ...metadata,
                    role: 'user', // Default role
                },
            },
        })

        if (error) {
            handleSupabaseError(error as AuthError)
        }

        return {
            user: data.user ? mapSupabaseUserToUser(data.user) : null,
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
            handleSupabaseError(error as AuthError)
        }
    },

    /**
     * 获取当前用户
     */
    async getCurrentUser(): Promise<User | null> {
        const supabase = createClient()

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            // Don't throw on get user, just return null if not found
            return null
        }

        return user ? mapSupabaseUserToUser(user) : null
    },

    /**
     * 获取当前会话
     */
    async getSession() {
        const supabase = createClient()

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            handleSupabaseError(error as AuthError)
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
            handleSupabaseError(error as AuthError)
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
            handleSupabaseError(error as AuthError)
        }

        return data.user ? mapSupabaseUserToUser(data.user) : null
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
            handleSupabaseError(error as AuthError)
        }

        return {
            user: data.user ? mapSupabaseUserToUser(data.user) : null,
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
            handleSupabaseError(error as AuthError)
        }
    },

    async sendVerificationCode(phone: string) {
        return authService.sendOtp(phone)
    },

    /**
     * 监听认证状态变化
     */
    onAuthStateChange(callback: (event: string, session: Session | null, user: User | null) => void) {
        const supabase = createClient()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user ? mapSupabaseUserToUser(session.user) : null
            callback(event, session, user)
        })

        return {
            unsubscribe: () => subscription.unsubscribe(),
        }
    },

    /**
     * 第三方登录
     */
    async loginWithThirdParty(provider: 'wechat' | 'feishu') {
        const supabase = createClient()
        
        // Map our provider to Supabase provider names
        const supabaseProvider = provider === 'wechat' ? 'wechat' : 'feishu'
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider as any, // Supabase types might not include these providers by default
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: provider === 'wechat' ? 'snsapi_userinfo' : '',
            },
        })
        
        if (error) {
            throw new ApiError(error.message || '第三方登录失败', error.code || 'AUTH_ERROR', 401)
        }
        
        return data
    },
}
