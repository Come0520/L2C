-- ========================================
-- 🔧 完整数据库 Schema 修复脚本
-- 生成时间: 2026-01-25
-- ========================================

-- ========================================
-- quotes 表
-- ========================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_signature_url text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS measure_variant_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS bundle_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS root_quote_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS min_profit_margin numeric(5,4);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_required boolean DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approver_id uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS reject_reason text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ========================================
-- quote_rooms 表
-- ========================================
ALTER TABLE quote_rooms ADD COLUMN IF NOT EXISTS measure_room_id uuid;
ALTER TABLE quote_rooms ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE quote_rooms ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE quote_rooms ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ========================================
-- quote_items 表
-- ========================================
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS room_id uuid;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS product_sku varchar(100);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS room_name varchar(100);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS cost_price numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS width numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS height numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS fold_ratio numeric(4,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS process_fee numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}';
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS calculation_params jsonb;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS remark text;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ========================================
-- quote_plans 表
-- ========================================
CREATE TABLE IF NOT EXISTS quote_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- quote_plan_items 表
-- ========================================
CREATE TABLE IF NOT EXISTS quote_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL,
    template_id uuid NOT NULL,
    override_price numeric(10,2),
    role varchar(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- quote_templates 表
-- ========================================
CREATE TABLE IF NOT EXISTS quote_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name varchar(200) NOT NULL,
    description text,
    category varchar(50),
    tags jsonb DEFAULT '[]',
    source_quote_id uuid,
    is_public boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- quote_template_rooms 表
-- ========================================
CREATE TABLE IF NOT EXISTS quote_template_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- quote_template_items 表
-- ========================================
CREATE TABLE IF NOT EXISTS quote_template_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    room_id uuid,
    parent_id uuid,
    category varchar(50) NOT NULL,
    product_id uuid,
    product_name varchar(200) NOT NULL,
    default_width numeric(10,2),
    default_height numeric(10,2),
    default_fold_ratio numeric(4,2),
    unit_price numeric(10,2),
    attributes jsonb DEFAULT '{}',
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- users 表
-- ========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin boolean DEFAULT false;

-- ========================================
-- customers 表
-- ========================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type varchar(20) DEFAULT 'INDIVIDUAL';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_secondary varchar(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wechat_openid varchar(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender varchar(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday timestamp;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS level varchar(10) DEFAULT 'D';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage varchar(50) DEFAULT 'LEAD';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pipeline_status varchar(50) DEFAULT 'UNASSIGNED';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referrer_customer_id uuid;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source_lead_id uuid;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code varchar(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_orders integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_order_amount numeric(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_order_at timestamp with time zone;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_at timestamp with time zone;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_merged boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS merged_from uuid[];
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_sales_id uuid;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ========================================
-- leads 表
-- ========================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_wechat varchar(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS house_type varchar(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS channel_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS channel_contact_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_channel_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_sub_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS distribution_rule_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_detail varchar(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS url_params jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_name varchar(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_customer_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_amount numeric(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id varchar(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_recommendation timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS decoration_progress varchar(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS quoted_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS visited_store_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS community varchar(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intention_level varchar(20);

-- ========================================
-- market_channels 表
-- ========================================
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS auto_assign_sales_id uuid;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS distribution_rule_id uuid;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS allow_duplicate_leads boolean DEFAULT false;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS url_params_config jsonb;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS code varchar(50);
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS cooperation_mode varchar(20) DEFAULT 'REBATE';
ALTER TABLE market_channels ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4) DEFAULT 0.1;

-- ========================================
-- lead_status 枚举值
-- ========================================
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'PENDING_FOLLOWUP';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'FOLLOWING_UP';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'INVALID';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'WON';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'VOID';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'PENDING_ASSIGNMENT';

-- ✅ 完成
