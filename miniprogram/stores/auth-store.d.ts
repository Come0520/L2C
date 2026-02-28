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
declare class AuthStore {
    private _userInfo;
    private _token;
    /** 监听器回调类型 */
    private _listeners;
    constructor();
    /** 当前用户信息，未登录时为 null */
    get userInfo(): UserInfo | null;
    /** JWT Token，未登录时为空字符串 */
    get token(): string;
    /** 是否已登录（同时拥有 Token 和 UserInfo） */
    get isLoggedIn(): boolean;
    /** 当前用户角色，未登录时返回 'guest' */
    get currentRole(): UserRole;
    /**
     * 设置登录态
     * @param token - JWT 令牌
     * @param userInfo - 用户信息对象
     */
    setLogin(token: string, userInfo: UserInfo): void;
    /**
     * 退出登录，清除所有认证信息
     */
    logout(): void;
    /**
     * 更新当前用户角色
     * @param role - 新角色
     */
    updateRole(role: UserRole): void;
    /**
     * 订阅状态变化
     * @param listener - 状态变化回调函数
     * @returns 取消订阅的函数
     */
    subscribe(listener: (store: AuthStore) => void): () => void;
    private notify;
}
export declare const authStore: AuthStore;
export {};
