/**
 * 展厅模块结构化错误码
 */
export const ShowroomErrors = {
    // 通用错误 (1000-1099)
    UNAUTHORIZED: { code: 'SHOWROOM_1001', message: '未授权访问' },
    FORBIDDEN: { code: 'SHOWROOM_1002', message: '无权操作此资源' },
    INVALID_INPUT: { code: 'SHOWROOM_1003', message: '输入参数非法' },
    INTERNAL_ERROR: { code: 'SHOWROOM_1004', message: '系统内部错误' },

    // 素材管理错误 (1100-1199)
    ITEM_NOT_FOUND: { code: 'SHOWROOM_1101', message: '素材未找到' },
    ITEM_DELETE_FAILED: { code: 'SHOWROOM_1102', message: '素材删除失败' },
    ITEM_UPDATE_FAILED: { code: 'SHOWROOM_1103', message: '素材更新失败' },

    // 分享管理错误 (1200-1299)
    SHARE_NOT_FOUND: { code: 'SHOWROOM_1201', message: '分享链接不存在或已停用' },
    SHARE_EXPIRED: { code: 'SHOWROOM_1202', message: '分享链接已过期' },
    SHARE_RATE_LIMIT: { code: 'SHOWROOM_1203', message: '请求频率过高，请稍后再试' },
    REDIS_UNAVAILABLE: { code: 'SHOWROOM_1204', message: '服务暂时不可用 (Redis)' },
    INVALID_PASSWORD: { code: 'SHOWROOM_1205', message: '访问提取码不正确或未提供' },
    SHARE_LIMIT_EXCEEDED: { code: 'SHOWROOM_1206', message: '分享访问次数已达到上限，阅后即焚已启动' },
} as const;

export type ShowroomErrorCode = typeof ShowroomErrors[keyof typeof ShowroomErrors]['code'];

export class ShowroomError extends Error {
    constructor(public errorDetail: typeof ShowroomErrors[keyof typeof ShowroomErrors]) {
        super(errorDetail.message);
        this.name = 'ShowroomError';
    }
}
