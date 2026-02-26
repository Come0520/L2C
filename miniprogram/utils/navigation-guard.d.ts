/**
 * 导航守卫与统一导航工具
 */
export declare class NavigationGuard {
    private static publicPages;
    /**
     * 统一跳转方法
     */
    static navigateTo(url: string): void;
    /**
     * 权限检查逻辑
     */
    private static canAccess;
    /**
     * 返回上一页并执行回调（如果有）
     */
    static back(delta?: number): void;
}
export {};
