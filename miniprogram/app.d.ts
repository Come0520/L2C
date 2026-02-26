export interface IAppOption {
    globalData: {
        apiBase: string;
        baseUrl: string;
        userInfo?: any;
    };
    userInfoReadyCallback?: (res: any) => void;
    wxLogin: () => Promise<{
        success: boolean;
        openId?: string;
        error?: string;
    }>;
    request: (path: string, data?: any, method?: string) => Promise<any>;
}
export {};
