'use client';

/**
 * 移动端认证上下文 (Auth Context)
 *
 * 提供:
 * - JWT Token 存储与管理
 * - 登录/登出逻辑
 * - Token 刷新机制
 * - 用户会话信息
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================
// 类型定义
// ============================================================

/**
 * 移动端用户信息
 */
export interface MobileUser {
    id: string;
    name: string | null;
    phone: string | null;
    role: 'WORKER' | 'SALES' | 'BOSS' | 'PURCHASER' | 'CUSTOMER';
    tenantId?: string;
    avatar?: string | null;
}

/**
 * 登录响应
 */
interface LoginResponse {
    success: boolean;
    data?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: MobileUser;
    };
    message?: string;
}

/**
 * Auth Context 值
 */
interface MobileAuthContextValue {
    user: MobileUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    getToken: () => string | null;
}

// ============================================================
// 常量
// ============================================================

const ACCESS_TOKEN_KEY = 'l2c_mobile_access_token';
const REFRESH_TOKEN_KEY = 'l2c_mobile_refresh_token';
const USER_KEY = 'l2c_mobile_user';

// ============================================================
// Context
// ============================================================

const MobileAuthContext = createContext<MobileAuthContextValue | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

interface MobileAuthProviderProps {
    children: ReactNode;
}

export function MobileAuthProvider({ children }: MobileAuthProviderProps) {
    const router = useRouter();
    const [user, setUser] = useState<MobileUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化: 从 localStorage 恢复会话
    useEffect(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                // JSON 解析失败，清理存储
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(ACCESS_TOKEN_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // 登录
    const login = useCallback(async (phone: string, password: string) => {
        try {
            const response = await fetch('/api/mobile/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.data) {
                // 存储 Token 和用户信息
                localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
                localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

                setUser(data.data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message || '登录失败' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }, []);

    // 登出
    const logout = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        router.push('/mobile/login');
    }, [router]);

    // 获取 Token
    const getToken = useCallback(() => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }, []);

    const value: MobileAuthContextValue = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getToken,
    };

    return (
        <MobileAuthContext.Provider value={value}>
            {children}
        </MobileAuthContext.Provider>
    );
}

// ============================================================
// Hook
// ============================================================

/**
 * 使用移动端认证上下文
 */
export function useMobileAuth() {
    const context = useContext(MobileAuthContext);
    if (context === undefined) {
        throw new Error('useMobileAuth must be used within a MobileAuthProvider');
    }
    return context;
}
