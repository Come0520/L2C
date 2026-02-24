import { UserRole } from '../stores/auth-store';

/**
 * 线索实体
 */
export interface Lead {
    id: string;
    customerName: string;
    phone: string;
    source: string;
    status: 'new' | 'following' | 'converted' | 'closed';
    createdAt: string;
    updatedAt: string;
}

/**
 * 客户实体
 */
export interface Customer {
    id: string;
    name: string;
    phone: string;
    address?: string;
    tags?: string[];
}

/**
 * 报价单实体
 */
export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    totalAmount: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

export {};
