/**
 * 小程序全局类型定义
 */

/** 用户信息结构 */
interface IUserInfo {
    nickName: string;
    avatarUrl: string;
    gender?: number;
    city?: string;
    province?: string;
    country?: string;
}

interface IAppOption {
    globalData: {
        userInfo: IUserInfo | null;
        openId: string | null;
        tenantId: string | null;
        tenantStatus: string | null;
        isLoggedIn: boolean;
        apiBase: string;
    };
    wxLogin(): Promise<{ success: boolean; openId?: string; error?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 全局请求方法返回格式不固定，保留 any 确保兼容性
    request(path: string, options?: { method?: string; data?: Record<string, unknown> }): Promise<any>;
    _doRequest(path: string, options?: { method?: string; data?: Record<string, unknown> }): Promise<any>;
    logout(): void;
}
