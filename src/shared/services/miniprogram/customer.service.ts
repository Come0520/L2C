import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { eq, and, or, like, desc, isNull, count, lt } from 'drizzle-orm';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';

export interface GetCustomersParams {
    keyword?: string | null;
    page: number;
    limit: number;
    cursor?: string;
}

export interface CreateCustomerData {
    name: string;
    phone?: string;
    wechat?: string | null;
    address?: string;
}

/**
 * 客户领域服务 (Miniprogram)
 * 负责处理小程序端客户相关的核心业务逻辑，剥离 API 路由层的 HTTP 依赖
 */
export class CustomerService {
    /**
     * 获取客户列表与分页总数
     *
     * @param tenantId - 租户 ID，用于数据隔离
     * @param params - 分页与搜索参数
     * @returns 包含客户列表和总数的对象
     */
    static async getCustomers(tenantId: string, params: GetCustomersParams) {
        const { keyword, page, limit } = params;

        let whereClause = and(
            eq(customers.tenantId, tenantId),
            isNull(customers.deletedAt)
        );

        if (keyword) {
            whereClause = and(
                whereClause,
                or(
                    like(customers.name, `%${keyword}%`),
                    like(customers.phone, `%${keyword}%`)
                )
            );
        }

        if (params.cursor) {
            // 在百万级数据下执行游标截短以提升后置分页查询速度
            whereClause = and(whereClause, lt(customers.updatedAt, new Date(params.cursor)));
        }

        const list = await db.query.customers.findMany({
            where: whereClause,
            orderBy: [desc(customers.updatedAt)],
            limit,
            // 收到精准游标时免除 O(N) 的数据库全纪录流扫描抛弃动作
            offset: params.cursor ? 0 : (page - 1) * limit,
            columns: {
                id: true,
                name: true,
                phone: true,
                level: true,
                totalOrders: true,
                lifecycleStage: true,
            },
        });

        // 并行查询总数
        const [totalResult] = await db.select({ value: count() })
            .from(customers)
            .where(whereClause!);
        const total = totalResult?.value ?? 0;

        // 手机号脱敏
        const data = list.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone ? c.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
            level: c.level,
            totalOrders: c.totalOrders,
            lifecycleStage: c.lifecycleStage,
        }));

        return { data, total, page, limit };
    }

    /**
     * 创建新客户并记录审计日志
     *
     * @param tenantId - 租户 ID
     * @param userId - 操作人 ID
     * @param data - 客户基础数据与可选地址
     * @returns 创建完成的客户信息
     */
    static async createCustomer(tenantId: string, userId: string, data: CreateCustomerData) {
        const { name, phone, wechat, address } = data;
        const customerNo = `C${Date.now()}`;

        const [newCustomer] = await db
            .insert(customers)
            .values({
                tenantId,
                customerNo,
                name,
                phone: phone || '',
                wechat: wechat || null,
                createdBy: userId,
            })
            .returning({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
            });

        // 如果提供了地址，保存到地址表
        if (address) {
            await db.insert(customerAddresses).values({
                tenantId,
                customerId: newCustomer.id,
                address: address,
                label: '默认地址',
                isDefault: true,
            });
        }

        // 审计日志 (容灾设计：审计故障不应中断核心业务)
        try {
            await AuditService.log(db, {
                tableName: 'customers',
                recordId: newCustomer.id,
                action: 'CREATE',
                userId: userId,
                tenantId: tenantId,
                details: { name, phone }
            });
        } catch (auditError) {
            logger.warn('[CustomerService] 审计日志记录失败', { error: auditError, recordId: newCustomer.id });
        }

        return newCustomer;
    }
}
