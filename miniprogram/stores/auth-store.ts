/**
 * Auth Store (Observer Pattern)
 * Manages User, Role, Tenant state and notifies listeners (Custom TabBar, etc.)
 */
export type UserRole = 'admin' | 'sales' | 'installer' | 'customer' | 'guest';

export interface UserInfo {
    id: string;
    name: string;
    avatarUrl?: string;
    role: UserRole;
    tenantId?: string;
    tenantName?: string;
}

class AuthStore {
    // Internal State
    private _userInfo: UserInfo | null = null;
    private _token: string = '';
    private _listeners: Function[] = [];

    constructor() {
        // Load from storage on init
        const userInfo = wx.getStorageSync('userInfo');
        const token = wx.getStorageSync('token');

        if (token && userInfo) {
            this._userInfo = userInfo;
            this._token = token;
        }
    }

    // Getters
    get userInfo() { return this._userInfo; }
    get token() { return this._token; }
    get isLoggedIn() { return !!this._token && !!this._userInfo; }
    get currentRole(): UserRole { return this._userInfo?.role || 'guest'; }

    // Actions
    setLogin(token: string, userInfo: UserInfo) {
        this._token = token;
        this._userInfo = userInfo;

        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', userInfo);

        this.notify();
    }

    logout() {
        this._token = '';
        this._userInfo = null;

        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');

        this.notify();
    }

    updateRole(role: UserRole) {
        if (this._userInfo) {
            this._userInfo.role = role;
            wx.setStorageSync('userInfo', this._userInfo);
            this.notify();
        }
    }

    // Listener System
    subscribe(listener: Function) {
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
