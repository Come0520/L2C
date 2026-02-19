import { InferSelectModel } from 'drizzle-orm';
import { showroomItems, showroomShares } from '@/shared/api/schema/showroom';
import { users } from '@/shared/api/schema/infrastructure';

/**
 * 云展厅素材基础模型 (基于数据库 Schema)
 */
export type ShowroomItem = InferSelectModel<typeof showroomItems>;

/**
 * 展厅分享记录基础模型
 */
export type ShowroomShare = InferSelectModel<typeof showroomShares>;

/**
 * 分享快照中的单项结构
 */
export interface ShowroomShareItemSnapshot {
    itemId: string;
    overridePrice?: number;
}

/**
 * 展厅分享记录 (包含快照类型加固)
 */
export type ShowroomShareWithSnapshot = Omit<ShowroomShare, 'itemsSnapshot'> & {
    itemsSnapshot: ShowroomShareItemSnapshot[];
};

/**
 * 分享内容返回结构 (API 响应)
 */
export interface ShareContentResponse {
    expired: boolean;
    items?: (ShowroomItem & { overridePrice?: number })[];
    sales?: InferSelectModel<typeof users>; // 关联的销售人员信息
}

/**
 * 展厅模块审计日志数据结构
 */
export interface ShowroomAuditData {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
}
