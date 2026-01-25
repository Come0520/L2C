-- 测试文件：只包含几个关键表
-- 这个文件用于测试 DMS 连接和执行是否正常

-- 创建枚举类型
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM (
    'ADMIN',
    'SALES',
    'MANAGER',
    'WORKER',
    'FINANCE',
    'SUPPLY'
);

CREATE TYPE IF NOT EXISTS public.lead_status AS ENUM (
    'PENDING_ASSIGNMENT',
    'PENDING_FOLLOWUP',
    'FOLLOWING_UP',
    'INVALID',
    'WON',
    'VOID'
);

CREATE TYPE IF NOT EXISTS public.order_status AS ENUM (
    'DRAFT',
    'PENDING_MEASURE',
    'MEASURED',
    'QUOTED',
    'SIGNED',
    'PAID',
    'PENDING_PO',
    'PENDING_PRODUCTION',
    'IN_PRODUCTION',
    'PAUSED',
    'HALTED',
    'PENDING_APPROVAL',
    'PENDING_DELIVERY',
    'PENDING_INSTALL',
    'INSTALLATION_COMPLETED',
    'PENDING_CONFIRMATION',
    'INSTALLATION_REJECTED',
    'COMPLETED',
    'CANCELLED'
);

-- 创建关键表
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid,
    status public.lead_status DEFAULT 'PENDING_ASSIGNMENT'::public.lead_status NOT NULL,
    source character varying(50),
    assigned_to uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- 添加外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_tenants_id_fk'
    ) THEN
        ALTER TABLE ONLY public.users
        ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_tenant_id_tenants_id_fk'
    ) THEN
        ALTER TABLE ONLY public.leads
        ADD CONSTRAINT leads_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
