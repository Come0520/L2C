import { logger } from "@/shared/lib/logger";
import { products, auditLogs } from '@/shared/api/schema';

export type AuditLog = typeof auditLogs.$inferSelect;

/**
 * 产品实体类型
 */
export type Product = Omit<typeof products.$inferSelect, 'images'> & {
    // 覆盖 images 类型为 string[]
    images: string[] | null;
    // 允许包含关联的供应商信息
    supplier?: {
        id: string;
        name: string;
    } | null;
    // 详情页可能包含的审计日志
    logs?: AuditLog[];
};
