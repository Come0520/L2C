class AuthStore {
    constructor() {
        // Internal State
        this._userInfo = null;
        this._token = '';
        this._listeners = [];
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
    get currentRole() { var _a; return ((_a = this._userInfo) === null || _a === void 0 ? void 0 : _a.role) || 'guest'; }
    // Actions
    setLogin(token, userInfo) {
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
    updateRole(role) {
        if (this._userInfo) {
            this._userInfo.role = role;
            wx.setStorageSync('userInfo', this._userInfo);
            this.notify();
        }
    }
    // Listener System
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
