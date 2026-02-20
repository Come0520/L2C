/**
 * 工作台/仪表盘模块结构化错误码
 */
export const WorkbenchErrors = {
    // 数据查询错误 (2000-2099)
    FETCH_TODOS_FAILED: { code: 'WORKBENCH_2001', message: '获取待办事项失败' },
    FETCH_ALERTS_FAILED: { code: 'WORKBENCH_2002', message: '获取报警信息失败' },

    // 配置管理错误 (2100-2199)
    CONFIG_NOT_FOUND: { code: 'WORKBENCH_2101', message: '仪表盘配置未找到' },
    CONFIG_UPDATE_FAILED: { code: 'WORKBENCH_2102', message: '更新仪表盘配置失败' },
    INVALID_WIDGET_CONFIG: { code: 'WORKBENCH_2103', message: '非法的小组件配置' },

    // 路由与权限 (2200-2299)
    UNAUTHORIZED: { code: 'WORKBENCH_2201', message: '未授权，请重新登录' },
    FORBIDDEN: { code: 'WORKBENCH_2202', message: '无权操作此仪表盘资源' },
} as const;

export type WorkbenchErrorCode = typeof WorkbenchErrors[keyof typeof WorkbenchErrors]['code'];

/**
 * 工作台自定义错误类
 */
export class WorkbenchError extends Error {
    public code: string;
    public details?: unknown;

    constructor(public errorDetail: typeof WorkbenchErrors[keyof typeof WorkbenchErrors], details?: unknown) {
        super(errorDetail.message);
        this.name = 'WorkbenchError';
        this.code = errorDetail.code;
        this.details = details;
    }
}
