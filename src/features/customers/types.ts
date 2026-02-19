import { InferSelectModel } from 'drizzle-orm';
import { customers, customerAddresses, users } from '@/shared/api/schema';

// 基础模型类型
export type Customer = InferSelectModel<typeof customers>;
export type CustomerAddress = InferSelectModel<typeof customerAddresses>;
// User 类型可能并未从 schema 直接导出所有字段(比如密码)，这里仅作参考，
// 实际查询通常只选特定字段。
export type User = InferSelectModel<typeof users>;

/**
 * 客户列表项
 * 用于 getCustomers 返回
 */
export interface CustomerListItem extends Customer {
    assignedSales?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> | null;
}

/**
 * 客户详情
 * 用于 getCustomerDetail 返回
 */
export interface CustomerDetail extends Customer {
    assignedSales?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> | null;
    creator?: Pick<User, 'id' | 'name'> | null;
    addresses?: CustomerAddress[];
    referrer?: Pick<Customer, 'id' | 'name'> | null;
    referrals?: Pick<Customer, 'id' | 'name' | 'phone' | 'customerNo' | 'createdAt'>[];

    // 业务逻辑增强字段 (兼容性处理)
    // 覆盖原类型的 source/referrerName (虽然原类型也有，但这里明确业务含义)
    source: string | null;
    referrerName: string | null;
}

/**
 * 客户画像数据
 * 用于 getCustomerProfile 返回
 */
export interface CustomerProfile {
    customer: {
        id: string;
        name: string;
        phone: string;
        type: string | null;
        level: string | null;
        assignedSalesName?: string | null;
        referrerName?: string | null;
        createdAt: Date | null;
    };
    stats: {
        totalAmount: number;
        orderCount: number;
        lastOrderDate: Date | null;
        daysSinceLastOrder: number | null;
        avgOrderAmount: number;
    };
    rfm: {
        recencyScore: number;
        frequencyScore: number;
        monetaryScore: number;
        avgScore: number;
    };
    valueLabel: 'HIGH_VALUE' | 'POTENTIAL' | 'NORMAL' | 'SLEEPING' | 'LOST';
    valueLabelText: string;
}

/**
 * 转介绍节点
 */
export interface ReferralNode {
    id: string;
    name: string;
    phone: string;
    referralsCount: number;
    // 递归结构在实际返回中可能被简化，但这里定义便于扩展
    // referrals?: ReferralNode[]; 
}

/**
 * 转介绍链数据
 * 用于 getReferralChain 返回
 */
export interface ReferralChain {
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    referrer: {
        id: string;
        name: string;
    } | null;
    referrals: ReferralNode[];
    stats: {
        directReferralsCount: number;
    };
}
