/**
 * 小程序全局类型定义
 */

interface IAppOption {
    globalData: {
        userInfo: any;
        openId: string | null;
        tenantId: string | null;
        tenantStatus: string | null;
        isLoggedIn: boolean;
        apiBase: string;
    };
    wxLogin(): Promise<{ success: boolean; openId?: string; error?: string }>;
    request(path: string, options?: { method?: string; data?: any }): Promise<any>;
    logout(): void;
}
