/**
 * 认证状态管理器（观察者模式）
 *
 * @description 管理用户信息、角色、租户状态，并在状态变化时通知所有订阅者（如自定义 TabBar）。
 * 数据持久化于 wx.Storage，应用启动时自动恢复。
 */
export type UserRole = 'admin' | 'sales' | 'installer' | 'customer' | 'guest';

export interface UserInfo {
    id: string;
    name: string;
    avatarUrl?: string;
    role: UserRole;
    tenantId?: string;
    tenantName?: string;
    phone?: string;
    tenantStatus?: string;
}

class AuthStore {
    // Internal State
    private _userInfo: UserInfo | null = null;
    private _token: string = '';
    /** 监听器回调类型 */
    private _listeners: ((store: AuthStore) => void)[] = [];

    constructor() {
        // Load from storage on init
        const userInfo = wx.getStorageSync('userInfo');
        const token = wx.getStorageSync('token');

        if (token && userInfo) {
            this._userInfo = userInfo;
            this._token = token;
        }
    }

    // --- 访问器 (Getters) ---

    /** 当前用户信息，未登录时为 null */
    get userInfo() { return this._userInfo; }
    /** JWT Token，未登录时为空字符串 */
    get token() { return this._token; }
    /** 是否已登录（同时拥有 Token 和 UserInfo） */
    get isLoggedIn() { return !!this._token && !!this._userInfo; }
    /** 当前用户角色，未登录时返回 'guest' */
    get currentRole(): UserRole { return this._userInfo?.role || 'guest'; }

    // --- 操作 (Actions) ---

    /**
     * 设置登录态
     * @param token - JWT 令牌
     * @param userInfo - 用户信息对象
     */
    setLogin(token: string, userInfo: UserInfo) {
        this._token = token;
        this._userInfo = userInfo;

        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', userInfo);

        this.notify();
    }

    /**
     * 退出登录，清除所有认证信息
     */
    logout() {
        this._token = '';
        this._userInfo = null;

        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');

        this.notify();
    }

    /**
     * 更新当前用户角色
     * @param role - 新角色
     */
    updateRole(role: UserRole) {
        if (this._userInfo) {
            this._userInfo.role = role;
            wx.setStorageSync('userInfo', this._userInfo);
            this.notify();
        }
    }

    // --- 订阅系统 ---

    /**
     * 订阅状态变化
     * @param listener - 状态变化回调函数
     * @returns 取消订阅的函数
     */
    subscribe(listener: (store: AuthStore) => void) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this._listeners.forEach(l => l(this));
    }
}

export const authStore = new AuthStore();

export { };
