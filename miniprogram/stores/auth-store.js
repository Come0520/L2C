class AuthStore {
    constructor() {
        // Internal State
        this._userInfo = null;
        this._token = '';
        /** 监听器回调类型 */
        this._listeners = [];
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
    get currentRole() { var _a; return ((_a = this._userInfo) === null || _a === void 0 ? void 0 : _a.role) || 'guest'; }
    // --- 操作 (Actions) ---
    /**
     * 设置登录态
     * @param token - JWT 令牌
     * @param userInfo - 用户信息对象
     */
    setLogin(token, userInfo) {
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
    updateRole(role) {
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
    subscribe(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }
    notify() {
        this._listeners.forEach(l => l(this));
    }
}
export const authStore = new AuthStore();
