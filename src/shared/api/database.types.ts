/**
 * L2C 数据库类型定�?
 * 基于 Supabase 生成的类型，手动补充业务类型
 * 
 * TODO: 使用 `supabase gen types typescript` 自动生成
 */

// 枚举类型
export type LeadStatus = 'PENDING_DISPATCH' | 'PENDING_FOLLOWUP' | 'FOLLOWING' | 'WON' | 'VOID';
export type MeasureTaskStatus = 'PENDING_DISPATCH' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED';
export type MeasureSheetStatus = 'DRAFT' | 'CONFIRMED' | 'ARCHIVED';
export type QuoteStatus = 'DRAFT' | 'ACTIVE' | 'LOCKED' | 'EXPIRED';
export type OrderStatus = 'PENDING_PO' | 'IN_PRODUCTION' | 'PENDING_DELIVERY' | 'DISPATCHING' | 'SHIPPED' | 'PENDING_INSTALL' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
export type POStatus = 'DRAFT' | 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';
export type InstallTaskStatus = 'PENDING_DISPATCH' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED';
export type StatementStatus = 'PENDING_INVOICE' | 'PENDING_PAYMENT' | 'PARTIAL_PAYMENT' | 'COMPLETED' | 'BAD_DEBT';
export type StatementType = 'AR' | 'AP_SUPPLIER' | 'AP_LABOR';
export type AfterSalesStatus = 'PENDING' | 'PROCESSING' | 'PENDING_VISIT' | 'PENDING_CALLBACK' | 'CLOSED' | 'REJECTED';
export type LiabilityStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'CONFIRMED' | 'DISPUTED' | 'ARBITRATED';
export type ProductCategory = 'CURTAIN_FABRIC' | 'CURTAIN_SHEER' | 'CURTAIN_TRACK' | 'CURTAIN_ACCESSORY' | 'WALLCLOTH' | 'WALLPANEL' | 'WINDOWPAD' | 'STANDARD' | 'MOTOR';
export type CustomerLevel = 'A' | 'B' | 'C' | 'D';
export type IntentionLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK_TRANSFER' | 'OTHER';
export type LiablePartyType = 'COMPANY' | 'SUPPLIER' | 'INSTALLER' | 'MEASURER' | 'CUSTOMER';

// 数据库表类型定义
export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    code: string;
                    logo_url: string | null;
                    settings: Record<string, unknown>;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
            };
            users: {
                Row: {
                    id: string;
                    tenant_id: string;
                    email: string | null;
                    phone: string;
                    password_hash: string | null;
                    name: string;
                    avatar_url: string | null;
                    is_active: boolean;
                    last_login_at: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            leads: {
                Row: {
                    id: string;
                    tenant_id: string;
                    lead_no: string;
                    source_category_id: string | null;
                    source_sub_id: string | null;
                    source_detail: string | null;
                    customer_name: string;
                    customer_phone: string;
                    customer_wechat: string | null;
                    community: string | null;
                    address: string | null;
                    house_type: string | null;
                    intention_level: IntentionLevel | null;
                    estimated_amount: number | null;
                    status: LeadStatus;
                    assigned_sales_id: string | null;
                    assigned_at: string | null;
                    tags: string[];
                    remark: string | null;
                    referrer_customer_id: string | null;
                    customer_id: string | null;
                    quoted_at: string | null;
                    visited_store_at: string | null;
                    won_at: string | null;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                    last_activity_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_activity_at'>;
                Update: Partial<Database['public']['Tables']['leads']['Insert']>;
            };
            customers: {
                Row: {
                    id: string;
                    tenant_id: string;
                    customer_no: string;
                    name: string;
                    phone: string;
                    phone_secondary: string | null;
                    wechat: string | null;
                    gender: string | null;
                    birthday: string | null;
                    source_lead_id: string | null;
                    referrer_customer_id: string | null;
                    default_address: string | null;
                    addresses: Record<string, unknown>[];
                    tags: string[];
                    level: CustomerLevel;
                    total_orders: number;
                    total_amount: number;
                    avg_order_amount: number;
                    first_order_at: string | null;
                    last_order_at: string | null;
                    preferences: Record<string, unknown>;
                    notes: string | null;
                    is_merged: boolean;
                    merged_from: string[] | null;
                    assigned_sales_id: string | null;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['customers']['Insert']>;
            };
            orders: {
                Row: {
                    id: string;
                    tenant_id: string;
                    order_no: string;
                    quote_id: string;
                    lead_id: string | null;
                    customer_id: string;
                    customer_name: string;
                    customer_phone: string;
                    delivery_address: string;
                    status: OrderStatus;
                    total_amount: number;
                    paid_amount: number;
                    confirmation_img: string | null;
                    sales_id: string;
                    remark: string | null;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                    closed_at: string | null;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
            };
            products: {
                Row: {
                    id: string;
                    tenant_id: string;
                    sku: string;
                    name: string;
                    category: ProductCategory;
                    unit: string;
                    base_price: number;
                    cost_price: number | null;
                    default_supplier_id: string | null;
                    is_stockable: boolean;
                    stock_quantity: number;
                    safety_stock: number | null;
                    images: string[];
                    attributes: Record<string, unknown>;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };
            suppliers: {
                Row: {
                    id: string;
                    tenant_id: string;
                    supplier_no: string;
                    name: string;
                    contact_name: string | null;
                    contact_phone: string | null;
                    contact_email: string | null;
                    address: string | null;
                    settlement_type: string;
                    bank_account: Record<string, unknown> | null;
                    is_active: boolean;
                    remark: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            lead_status: LeadStatus;
            order_status: OrderStatus;
            quote_status: QuoteStatus;
            product_category: ProductCategory;
            customer_level: CustomerLevel;
        };
    };
}
