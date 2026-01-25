SELECT pg_catalog.set_config('search_path', '', false);
CREATE SCHEMA IF NOT EXISTS drizzle;
COMMENT ON SCHEMA public IS '';
CREATE TYPE IF NOT EXISTS public.after_sales_status AS ENUM (
    'PENDING',
    'INVESTIGATING',
    'PROCESSING',
    'PENDING_VISIT',
    'PENDING_CALLBACK',
    'PENDING_VERIFY',
    'CLOSED',
    'REJECTED'
);
CREATE TYPE IF NOT EXISTS public.approval_node_mode AS ENUM (
    'ANY',
    'ALL',
    'MAJORITY'
);
CREATE TYPE IF NOT EXISTS public.approval_timeout_action AS ENUM (
    'REMIND',
    'AUTO_PASS',
    'AUTO_REJECT'
);
CREATE TYPE IF NOT EXISTS public.approver_role AS ENUM (
    'STORE_MANAGER',
    'ADMIN',
    'FINANCE',
    'PURCHASING',
    'DISPATCHER'
);
CREATE TYPE IF NOT EXISTS public.ar_statement_status AS ENUM (
    'PENDING_RECON',
    'RECONCILED',
    'INVOICED',
    'PARTIAL',
    'PAID',
    'PENDING_DELIVER',
    'COMPLETED',
    'BAD_DEBT'
);
CREATE TYPE IF NOT EXISTS public.bill_status AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'PAID',
    'REJECTED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.change_request_status AS ENUM (
    'PENDING',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.change_request_type AS ENUM (
    'FIELD_CHANGE',
    'CUSTOMER_CHANGE',
    'STOCK_OUT',
    'OTHER'
);
CREATE TYPE IF NOT EXISTS public.channel_category AS ENUM (
    'ONLINE',
    'OFFLINE',
    'REFERRAL'
);
CREATE TYPE IF NOT EXISTS public.channel_level AS ENUM (
    'S',
    'A',
    'B',
    'C'
);
CREATE TYPE IF NOT EXISTS public.channel_settlement_type AS ENUM (
    'PREPAY',
    'MONTHLY'
);
CREATE TYPE IF NOT EXISTS public.channel_status AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED'
);
CREATE TYPE IF NOT EXISTS public.channel_type AS ENUM (
    'DECORATION_CO',
    'DESIGNER',
    'CROSS_INDUSTRY',
    'DOUYIN',
    'XIAOHONGSHU',
    'STORE',
    'OTHER'
);
CREATE TYPE IF NOT EXISTS public.commission_status AS ENUM (
    'PENDING',
    'CALCULATED',
    'PAID'
);
CREATE TYPE IF NOT EXISTS public.commission_trigger_mode AS ENUM (
    'ORDER_CREATED',
    'ORDER_COMPLETED',
    'PAYMENT_COMPLETED'
);
CREATE TYPE IF NOT EXISTS public.commission_type AS ENUM (
    'FIXED',
    'TIERED'
);
CREATE TYPE IF NOT EXISTS public.cooperation_mode AS ENUM (
    'BASE_PRICE',
    'COMMISSION'
);
CREATE TYPE IF NOT EXISTS public.customer_level AS ENUM (
    'A',
    'B',
    'C',
    'D'
);
CREATE TYPE IF NOT EXISTS public.customer_lifecycle_stage AS ENUM (
    'LEAD',
    'OPPORTUNITY',
    'SIGNED',
    'DELIVERED',
    'LOST'
);
CREATE TYPE IF NOT EXISTS public.customer_pipeline_status AS ENUM (
    'UNASSIGNED',
    'PENDING_FOLLOWUP',
    'PENDING_MEASUREMENT',
    'PENDING_QUOTE',
    'QUOTE_SENT',
    'IN_PRODUCTION',
    'PENDING_DELIVERY',
    'PENDING_INSTALLATION',
    'COMPLETED'
);
CREATE TYPE IF NOT EXISTS public.customer_type AS ENUM (
    'INDIVIDUAL',
    'COMPANY',
    'DESIGNER',
    'PARTNER'
);
CREATE TYPE IF NOT EXISTS public.decoration_progress AS ENUM (
    'WATER_ELECTRIC',
    'MUD_WOOD',
    'INSTALLATION',
    'PAINTING',
    'COMPLETED'
);
CREATE TYPE IF NOT EXISTS public.delegation_type AS ENUM (
    'GLOBAL',
    'FLOW'
);
CREATE TYPE IF NOT EXISTS public.fabric_inventory_log_type AS ENUM (
    'PURCHASE_IN',
    'PROCESSING_OUT',
    'ADJUSTMENT',
    'RETURN'
);
CREATE TYPE IF NOT EXISTS public.fee_check_status AS ENUM (
    'NONE',
    'PENDING',
    'PAID',
    'WAIVED',
    'REFUNDED'
);
CREATE TYPE IF NOT EXISTS public.header_process_type AS ENUM (
    'HOOK',
    'PUNCH',
    'FIXED_PLEAT'
);
CREATE TYPE IF NOT EXISTS public.install_item_issue_category AS ENUM (
    'NONE',
    'MISSING',
    'DAMAGED',
    'WRONG_SIZE'
);
CREATE TYPE IF NOT EXISTS public.install_photo_type AS ENUM (
    'BEFORE',
    'AFTER',
    'DETAIL'
);
CREATE TYPE IF NOT EXISTS public.install_task_category AS ENUM (
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'OTHER'
);
CREATE TYPE IF NOT EXISTS public.install_task_source_type AS ENUM (
    'ORDER',
    'AFTER_SALES',
    'REWORK'
);
CREATE TYPE IF NOT EXISTS public.install_task_status AS ENUM (
    'PENDING_DISPATCH',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.install_type AS ENUM (
    'TOP',
    'SIDE'
);
CREATE TYPE IF NOT EXISTS public.intention_level AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);
CREATE TYPE IF NOT EXISTS public.inventory_log_type AS ENUM (
    'IN',
    'OUT',
    'ADJUST',
    'TRANSFER'
);
CREATE TYPE IF NOT EXISTS public.labor_category AS ENUM (
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'WALLPANEL',
    'MEASURE_LEAD',
    'MEASURE_PRECISE',
    'OTHER'
);
CREATE TYPE IF NOT EXISTS public.labor_rate_entity_type AS ENUM (
    'TENANT',
    'WORKER'
);
CREATE TYPE IF NOT EXISTS public.labor_unit_type AS ENUM (
    'WINDOW',
    'SQUARE_METER',
    'FIXED'
);
CREATE TYPE IF NOT EXISTS public.lead_activity_type AS ENUM (
    'PHONE_CALL',
    'WECHAT_CHAT',
    'STORE_VISIT',
    'HOME_VISIT',
    'QUOTE_SENT',
    'SYSTEM'
);
CREATE TYPE IF NOT EXISTS public.lead_status AS ENUM (
    'PENDING_ASSIGNMENT',
    'PENDING_FOLLOWUP',
    'FOLLOWING_UP',
    'INVALID',
    'WON',
    'VOID'
);
CREATE TYPE IF NOT EXISTS public.liability_reason_category AS ENUM (
    'PRODUCTION_QUALITY',
    'CONSTRUCTION_ERROR',
    'DATA_ERROR',
    'SALES_ERROR',
    'LOGISTICS_ISSUE',
    'CUSTOMER_REASON'
);
CREATE TYPE IF NOT EXISTS public.liability_status AS ENUM (
    'DRAFT',
    'PENDING_CONFIRM',
    'CONFIRMED',
    'DISPUTED',
    'ARBITRATED'
);
CREATE TYPE IF NOT EXISTS public.liable_party_type AS ENUM (
    'COMPANY',
    'FACTORY',
    'INSTALLER',
    'MEASURER',
    'LOGISTICS',
    'CUSTOMER'
);
CREATE TYPE IF NOT EXISTS public.measure_sheet_status AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'ARCHIVED'
);
CREATE TYPE IF NOT EXISTS public.measure_task_status AS ENUM (
    'PENDING_APPROVAL',
    'PENDING',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.measure_type AS ENUM (
    'QUOTE_BASED',
    'BLIND',
    'SALES_SELF'
);
CREATE TYPE IF NOT EXISTS public.notification_channel AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS',
    'WECHAT',
    'WECHAT_MINI',
    'LARK',
    'SYSTEM'
);
CREATE TYPE IF NOT EXISTS public.notification_type_enum AS ENUM (
    'SYSTEM',
    'ORDER_STATUS',
    'APPROVAL',
    'ALERT',
    'MENTION',
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR'
);
CREATE TYPE IF NOT EXISTS public.order_item_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'PO_CONFIRMED',
    'PRODUCED',
    'SHIPPED',
    'DELIVERED',
    'INSTALLED',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.order_settlement_type AS ENUM (
    'PREPAID',
    'CREDIT',
    'CASH'
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
CREATE TYPE IF NOT EXISTS public.package_overflow_mode AS ENUM (
    'FIXED_PRICE',
    'IGNORE',
    'ORIGINAL',
    'DISCOUNT'
);
CREATE TYPE IF NOT EXISTS public.package_type AS ENUM (
    'QUANTITY',
    'COMBO',
    'CATEGORY',
    'TIME_LIMITED'
);
CREATE TYPE IF NOT EXISTS public.payment_method AS ENUM (
    'CASH',
    'WECHAT',
    'ALIPAY',
    'BANK'
);
CREATE TYPE IF NOT EXISTS public.payment_schedule_status AS ENUM (
    'PENDING',
    'PAID'
);
CREATE TYPE IF NOT EXISTS public.payment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID'
);
CREATE TYPE IF NOT EXISTS public.po_fabric_status AS ENUM (
    'DRAFT',
    'IN_PRODUCTION',
    'DELIVERED',
    'STOCKED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.po_finished_status AS ENUM (
    'DRAFT',
    'IN_PRODUCTION',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.po_type AS ENUM (
    'FINISHED',
    'FABRIC',
    'STOCK'
);
CREATE TYPE IF NOT EXISTS public.product_category AS ENUM (
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'MATTRESS',
    'OTHER',
    'CURTAIN_FABRIC',
    'CURTAIN_SHEER',
    'CURTAIN_TRACK',
    'MOTOR',
    'CURTAIN_ACCESSORY',
    'WALLCLOTH_ACCESSORY',
    'WALLPANEL',
    'WINDOWPAD',
    'STANDARD',
    'SERVICE'
);
CREATE TYPE IF NOT EXISTS public.product_type AS ENUM (
    'FINISHED',
    'CUSTOM'
);
CREATE TYPE IF NOT EXISTS public.purchase_order_status AS ENUM (
    'DRAFT',
    'PENDING',
    'CONFIRMED',
    'IN_PRODUCTION',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.quote_plan_type AS ENUM (
    'ECONOMIC',
    'COMFORT',
    'LUXURY'
);
CREATE TYPE IF NOT EXISTS public.quote_status AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'PENDING_CUSTOMER',
    'ACCEPTED',
    'REJECTED',
    'LOCKED',
    'ORDERED',
    'EXPIRED'
);
CREATE TYPE IF NOT EXISTS public.room_type AS ENUM (
    'LIVING_ROOM',
    'BEDROOM',
    'DINING_ROOM',
    'STUDY',
    'BALCONY',
    'BATHROOM',
    'KITCHEN',
    'OTHER'
);
CREATE TYPE IF NOT EXISTS public.settlement_type AS ENUM (
    'CASH',
    'TRANSFER'
);
CREATE TYPE IF NOT EXISTS public.supplier_type AS ENUM (
    'SUPPLIER',
    'PROCESSOR',
    'BOTH'
);
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM (
    'ADMIN',
    'SALES',
    'MANAGER',
    'WORKER',
    'FINANCE',
    'SUPPLY'
);
CREATE TYPE IF NOT EXISTS public.verification_code_type AS ENUM (
    'LOGIN_MFA',
    'PASSWORD_RESET',
    'BIND_PHONE'
);
CREATE TYPE IF NOT EXISTS public.wall_material AS ENUM (
    'CONCRETE',
    'WOOD',
    'GYPSUM'
);
CREATE TYPE IF NOT EXISTS public.window_type AS ENUM (
    'STRAIGHT',
    'L_SHAPE',
    'U_SHAPE',
    'ARC'
);
CREATE TYPE IF NOT EXISTS public.work_order_item_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.work_order_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE IF NOT EXISTS public.worker_skill_type AS ENUM (
    'MEASURE_CURTAIN',
    'INSTALL_CURTAIN',
    'MEASURE_WALLCLOTH',
    'INSTALL_WALLCLOTH',
    'MEASURE_WALLPANEL',
    'INSTALL_WALLPANEL'
);
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);
CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;
CREATE TABLE IF NOT EXISTS public.account_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transaction_no character varying(50) NOT NULL,
    account_id uuid NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    related_type character varying(50) NOT NULL,
    related_id uuid NOT NULL,
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.account_transactions FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.after_sales_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    ticket_no character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    install_task_id uuid,
    type character varying(50) NOT NULL,
    status public.after_sales_status DEFAULT 'PENDING'::public.after_sales_status NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying,
    description text,
    photos text[],
    resolution text,
    estimated_cost numeric(12,2),
    total_actual_cost numeric(12,2) DEFAULT 0.00,
    actual_deduction numeric(12,2) DEFAULT 0.00,
    internal_loss numeric(12,2) DEFAULT 0.00,
    is_warranty boolean DEFAULT true,
    satisfaction integer,
    channel_satisfaction integer,
    assigned_to uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone,
    sla_response_deadline timestamp with time zone,
    sla_visit_deadline timestamp with time zone,
    sla_closure_deadline timestamp with time zone
);
ALTER TABLE ONLY public.after_sales_tickets FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.ap_labor_fee_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    statement_id uuid NOT NULL,
    install_task_id uuid,
    install_task_no character varying(50),
    fee_type character varying(20) NOT NULL,
    description character varying(200) NOT NULL,
    calculation character varying(200) NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    liability_notice_id uuid,
    liability_notice_no character varying(50)
);
ALTER TABLE ONLY public.ap_labor_fee_details FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.ap_labor_statements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    statement_no character varying(50) NOT NULL,
    worker_id uuid NOT NULL,
    worker_name character varying(100) NOT NULL,
    settlement_period character varying(20) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    pending_amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    completed_at timestamp with time zone,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.ap_labor_statements FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.ap_supplier_statements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    statement_no character varying(50) NOT NULL,
    purchase_order_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    supplier_name character varying(100) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    pending_amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    invoice_no character varying(100),
    invoiced_at timestamp with time zone,
    invoice_amount numeric(12,2),
    tax_rate numeric(5,4),
    tax_amount numeric(12,2),
    is_tax_inclusive boolean DEFAULT false,
    completed_at timestamp with time zone,
    purchaser_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.ap_supplier_statements FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.approval_delegations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    delegator_id uuid NOT NULL,
    delegatee_id uuid NOT NULL,
    type public.delegation_type DEFAULT 'GLOBAL'::public.delegation_type,
    flow_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reason text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.approval_delegations FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.approval_flows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    definition jsonb DEFAULT '{"edges": [], "nodes": []}'::jsonb
);
ALTER TABLE ONLY public.approval_flows FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.approval_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    flow_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    approver_role public.approver_role,
    approver_user_id uuid,
    node_type character varying(20) DEFAULT 'APPROVAL'::character varying,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    approver_mode public.approval_node_mode DEFAULT 'ANY'::public.approval_node_mode,
    timeout_hours integer,
    timeout_action public.approval_timeout_action DEFAULT 'REMIND'::public.approval_timeout_action,
    min_amount numeric(12,2),
    max_amount numeric(12,2),
    conditions jsonb DEFAULT '[]'::jsonb
);
ALTER TABLE ONLY public.approval_nodes FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.approval_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    approval_id uuid NOT NULL,
    node_id uuid,
    approver_id uuid,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    comment text,
    action_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    timeout_at timestamp with time zone,
    is_dynamic boolean DEFAULT false,
    parent_task_id uuid
);
ALTER TABLE ONLY public.approval_tasks FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    requester_id uuid NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    flow_id uuid,
    current_node_id uuid,
    completed_at timestamp with time zone
);
ALTER TABLE ONLY public.approvals FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.ar_statements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    statement_no character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_name character varying(100) NOT NULL,
    settlement_type character varying(20) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    received_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    pending_amount numeric(12,2) NOT NULL,
    status public.ar_statement_status NOT NULL,
    invoice_no character varying(100),
    invoiced_at timestamp with time zone,
    tax_rate numeric(5,4),
    tax_amount numeric(12,2),
    is_tax_inclusive boolean DEFAULT false,
    completed_at timestamp with time zone,
    sales_id uuid NOT NULL,
    channel_id uuid,
    commission_rate numeric(5,4),
    commission_amount numeric(12,2),
    commission_status public.commission_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.ar_statements FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    user_id uuid,
    changed_fields jsonb,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.audit_logs FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.channel_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.channel_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    lead_id uuid,
    order_id uuid,
    amount numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    formula jsonb,
    remark text,
    settled_at timestamp with time zone,
    settled_by uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    commission_type public.cooperation_mode,
    order_amount numeric(15,2),
    commission_rate numeric(5,4),
    settlement_id uuid
);
ALTER TABLE ONLY public.channel_commissions FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.channel_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    "position" character varying(50),
    phone character varying(20) NOT NULL,
    is_main boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.channel_contacts FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.channel_discount_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    scope character varying(20) NOT NULL,
    target_id character varying(100) NOT NULL,
    target_name character varying(200),
    s_level_discount numeric(5,2),
    a_level_discount numeric(5,2),
    b_level_discount numeric(5,2),
    c_level_discount numeric(5,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.channel_settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    settlement_no character varying(50) NOT NULL,
    channel_id uuid NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    total_commission numeric(15,2) NOT NULL,
    adjustment_amount numeric(15,2) DEFAULT '0'::numeric,
    final_amount numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    payment_bill_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    approved_by uuid,
    approved_at timestamp with time zone,
    paid_at timestamp with time zone
);
ALTER TABLE ONLY public.channel_settlements FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.channel_specific_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    special_price numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.channel_specific_prices FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    channel_type public.channel_type NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    level public.channel_level DEFAULT 'C'::public.channel_level NOT NULL,
    contact_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_type public.commission_type,
    tiered_rates jsonb,
    cooperation_mode public.cooperation_mode NOT NULL,
    price_discount_rate numeric(5,4),
    settlement_type public.channel_settlement_type NOT NULL,
    bank_info jsonb,
    contract_files jsonb,
    total_leads integer DEFAULT 0,
    total_deal_amount numeric(15,2) DEFAULT '0'::numeric,
    status public.channel_status DEFAULT 'ACTIVE'::public.channel_status,
    assigned_manager_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category public.channel_category DEFAULT 'OFFLINE'::public.channel_category NOT NULL,
    credit_limit numeric(15,2) DEFAULT '0'::numeric,
    parent_id uuid,
    hierarchy_level integer DEFAULT 1 NOT NULL,
    category_id uuid,
    commission_trigger_mode public.commission_trigger_mode DEFAULT 'PAYMENT_COMPLETED'::public.commission_trigger_mode
);
ALTER TABLE ONLY public.channels FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.commission_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    original_commission_id uuid NOT NULL,
    adjustment_type character varying(20) NOT NULL,
    adjustment_amount numeric(15,2) NOT NULL,
    reason text NOT NULL,
    order_id uuid,
    refund_amount numeric(15,2),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.commission_adjustments FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.commission_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    commission_no character varying(50) NOT NULL,
    ar_statement_id uuid NOT NULL,
    order_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    channel_name character varying(100) NOT NULL,
    cooperation_mode character varying(20) NOT NULL,
    order_amount numeric(12,2) NOT NULL,
    commission_rate numeric(5,4) NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    calculated_at timestamp with time zone,
    paid_at timestamp with time zone,
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.commission_records FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.credit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    credit_note_no character varying(50) NOT NULL,
    customer_id uuid NOT NULL,
    customer_name character varying(100) NOT NULL,
    order_id uuid,
    ar_statement_id uuid,
    type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    applied_at timestamp with time zone,
    created_by uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    remark text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    label character varying(50),
    province character varying(50),
    city character varying(50),
    district character varying(50),
    community character varying(100),
    address character varying(255) NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customer_merge_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    primary_customer_id uuid NOT NULL,
    merged_customer_ids uuid[] NOT NULL,
    operator_id uuid NOT NULL,
    field_conflicts jsonb,
    affected_tables text[],
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_no character varying(50) NOT NULL,
    name character varying(50) NOT NULL,
    type character varying(20) DEFAULT 'INDIVIDUAL'::character varying,
    phone character varying(20) NOT NULL,
    phone_secondary character varying(20),
    wechat character varying(50),
    wechat_openid character varying(100),
    gender character varying(10),
    birthday timestamp without time zone,
    level public.customer_level DEFAULT 'D'::public.customer_level,
    lifecycle_stage public.customer_lifecycle_stage DEFAULT 'LEAD'::public.customer_lifecycle_stage NOT NULL,
    pipeline_status public.customer_pipeline_status DEFAULT 'UNASSIGNED'::public.customer_pipeline_status NOT NULL,
    referrer_customer_id uuid,
    source_lead_id uuid,
    loyalty_points integer DEFAULT 0,
    referral_code character varying(20),
    total_orders integer DEFAULT 0,
    total_amount numeric(12,2) DEFAULT '0'::numeric,
    avg_order_amount numeric(12,2) DEFAULT '0'::numeric,
    first_order_at timestamp with time zone,
    last_order_at timestamp with time zone,
    preferences jsonb DEFAULT '{}'::jsonb,
    notes text,
    tags text[] DEFAULT '{}'::text[],
    is_merged boolean DEFAULT false,
    merged_from uuid[],
    assigned_sales_id uuid,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.debit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    debit_note_no character varying(50) NOT NULL,
    supplier_id uuid NOT NULL,
    supplier_name character varying(100) NOT NULL,
    purchase_order_id uuid,
    ap_statement_id uuid,
    type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason character varying(200) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    applied_at timestamp with time zone,
    created_by uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    remark text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fabric_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    fabric_product_id uuid NOT NULL,
    fabric_sku character varying(100) NOT NULL,
    fabric_name character varying(200) NOT NULL,
    fabric_color character varying(50),
    fabric_width numeric(10,2),
    fabric_roll_length numeric(10,2),
    batch_no character varying(50),
    purchase_order_id uuid,
    supplier_id uuid,
    available_quantity numeric(12,2) NOT NULL,
    reserved_quantity numeric(12,2) DEFAULT '0'::numeric,
    total_quantity numeric(12,2) NOT NULL,
    purchase_date timestamp with time zone,
    expiry_date timestamp with time zone,
    warehouse_location character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.fabric_inventory FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.fabric_inventory_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    fabric_inventory_id uuid NOT NULL,
    log_type public.fabric_inventory_log_type NOT NULL,
    quantity numeric(12,2) NOT NULL,
    before_quantity numeric(12,2) NOT NULL,
    after_quantity numeric(12,2) NOT NULL,
    reference_id uuid,
    reference_type character varying(50),
    remark text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.fabric_inventory_logs FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.finance_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    account_no character varying(50) NOT NULL,
    account_name character varying(100) NOT NULL,
    account_type character varying(20) NOT NULL,
    account_number character varying(100),
    bank_name character varying(100),
    branch_name character varying(100),
    holder_name character varying(100) NOT NULL,
    balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    remark text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.finance_accounts FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.finance_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.finance_configs FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.install_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    install_task_id uuid NOT NULL,
    order_item_id uuid,
    product_name character varying(200) NOT NULL,
    room_name character varying(100),
    quantity numeric(12,2) NOT NULL,
    actual_installed_quantity numeric(12,2),
    issue_category public.install_item_issue_category DEFAULT 'NONE'::public.install_item_issue_category,
    is_installed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.install_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.install_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    install_task_id uuid NOT NULL,
    photo_type public.install_photo_type NOT NULL,
    photo_url text NOT NULL,
    room_name character varying(100),
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.install_photos FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.install_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    task_no character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    status public.install_task_status DEFAULT 'PENDING_DISPATCH'::public.install_task_status NOT NULL,
    completed_at timestamp with time zone,
    installer_id uuid,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assigned_at timestamp with time zone,
    check_in_at timestamp with time zone,
    check_in_location jsonb,
    actual_labor_fee numeric(12,2),
    adjustment_reason text,
    rating integer,
    confirmed_by uuid,
    confirmed_at timestamp with time zone,
    source_type public.install_task_source_type DEFAULT 'ORDER'::public.install_task_source_type NOT NULL,
    after_sales_id uuid,
    customer_name character varying(100),
    customer_phone character varying(20),
    category public.install_task_category DEFAULT 'CURTAIN'::public.install_task_category NOT NULL,
    sales_id uuid,
    dispatcher_id uuid,
    installer_name character varying(100),
    scheduled_date timestamp with time zone,
    scheduled_time_slot character varying(50),
    actual_start_at timestamp with time zone,
    actual_end_at timestamp with time zone,
    logistics_ready_status boolean DEFAULT false NOT NULL,
    check_out_at timestamp with time zone,
    check_out_location jsonb,
    customer_signature_url text,
    signed_at timestamp with time zone,
    labor_fee numeric(12,2),
    fee_breakdown jsonb,
    checklist_status jsonb,
    field_discovery jsonb,
    rating_comment text,
    remark text,
    reject_count integer DEFAULT 0 NOT NULL,
    reject_reason text
);
ALTER TABLE ONLY public.install_tasks FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transfer_no character varying(50) NOT NULL,
    from_account_id uuid NOT NULL,
    to_account_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    from_transaction_id uuid,
    to_transaction_id uuid,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    remark text,
    created_by uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0,
    location text,
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    product_id uuid NOT NULL,
    type public.inventory_log_type NOT NULL,
    quantity integer NOT NULL,
    balance_after integer NOT NULL,
    reason text,
    reference_type text,
    reference_id uuid,
    operator_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.labor_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    entity_type public.labor_rate_entity_type NOT NULL,
    entity_id uuid NOT NULL,
    category public.labor_category NOT NULL,
    unit_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    base_fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    unit_type public.labor_unit_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    quote_id uuid,
    purchase_intention public.intention_level,
    customer_level character varying(20),
    activity_type public.lead_activity_type NOT NULL,
    content text NOT NULL,
    location character varying(200),
    next_followup_date timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    old_status character varying(50),
    new_status character varying(50) NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    reason text
);
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_no character varying(50) NOT NULL,
    customer_name character varying(50) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_wechat character varying(50),
    address text,
    community character varying(100),
    house_type character varying(50),
    status public.lead_status DEFAULT 'PENDING_ASSIGNMENT'::public.lead_status,
    intention_level public.intention_level,
    channel_id uuid,
    channel_contact_id uuid,
    source_channel_id uuid,
    source_sub_id uuid,
    distribution_rule_id uuid,
    source_detail character varying(100),
    url_params jsonb,
    referrer_name character varying(100),
    referrer_customer_id uuid,
    estimated_amount numeric(12,2),
    tags text[],
    notes text,
    lost_reason text,
    external_id character varying(100),
    assigned_sales_id uuid,
    assigned_at timestamp with time zone,
    last_activity_at timestamp with time zone,
    next_followup_at timestamp with time zone,
    next_followup_recommendation timestamp with time zone,
    decoration_progress public.decoration_progress,
    quoted_at timestamp with time zone,
    visited_store_at timestamp with time zone,
    won_at timestamp with time zone,
    customer_id uuid,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.liability_notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    notice_no character varying(50) NOT NULL,
    after_sales_id uuid NOT NULL,
    liable_party_type public.liable_party_type NOT NULL,
    liable_party_id uuid,
    liable_party_credit jsonb,
    reason text NOT NULL,
    liability_reason_category public.liability_reason_category,
    amount numeric(12,2) NOT NULL,
    cost_items jsonb,
    source_purchase_order_id uuid,
    source_install_task_id uuid,
    status public.liability_status DEFAULT 'DRAFT'::public.liability_status NOT NULL,
    evidence_photos text[],
    confirmed_at timestamp with time zone,
    confirmed_by uuid,
    dispute_reason text,
    dispute_evidence text[],
    arbitration_result text,
    arbitrated_by uuid,
    arbitrated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    finance_status character varying(20) DEFAULT 'PENDING'::character varying,
    finance_statement_id uuid,
    finance_synced_at timestamp with time zone
);
ALTER TABLE ONLY public.liability_notices FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    source character varying(50) NOT NULL,
    points integer NOT NULL,
    balance_after integer NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);
ALTER TABLE ONLY public.loyalty_transactions FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.market_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    parent_id uuid,
    name character varying(100) NOT NULL,
    level integer DEFAULT 1,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    auto_assign_sales_id uuid,
    distribution_rule_id uuid,
    allow_duplicate_leads boolean DEFAULT false,
    url_params_config jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    code character varying(50),
    cooperation_mode character varying(20) DEFAULT 'REBATE'::character varying,
    commission_rate numeric(5,4) DEFAULT 0.1
);
ALTER TABLE ONLY public.market_channels FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.measure_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sheet_id uuid NOT NULL,
    room_name character varying(100) NOT NULL,
    window_type public.window_type NOT NULL,
    width numeric(12,2) NOT NULL,
    height numeric(12,2) NOT NULL,
    install_type public.install_type,
    bracket_dist numeric(12,2),
    wall_material public.wall_material,
    has_box boolean DEFAULT false,
    box_depth numeric(12,2),
    is_electric boolean DEFAULT false,
    remark text,
    segment_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.measure_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.measure_sheets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    task_id uuid NOT NULL,
    status public.measure_sheet_status DEFAULT 'DRAFT'::public.measure_sheet_status,
    round integer NOT NULL,
    variant character varying(50) NOT NULL,
    site_photos jsonb,
    sketch_map text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.measure_sheets FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.measure_task_splits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    original_task_id uuid NOT NULL,
    new_task_id uuid NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.measure_task_splits FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.measure_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    measure_no character varying(50) NOT NULL,
    lead_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    status public.measure_task_status DEFAULT 'PENDING'::public.measure_task_status,
    scheduled_at timestamp with time zone,
    check_in_at timestamp with time zone,
    check_in_location jsonb,
    type public.measure_type DEFAULT 'BLIND'::public.measure_type,
    assigned_worker_id uuid,
    round integer DEFAULT 1 NOT NULL,
    remark text,
    reject_count integer DEFAULT 0 NOT NULL,
    reject_reason text,
    is_fee_exempt boolean DEFAULT false,
    fee_check_status public.fee_check_status DEFAULT 'NONE'::public.fee_check_status,
    fee_approval_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    version_display character varying(20),
    parent_id uuid,
    deleted_at timestamp with time zone
);
ALTER TABLE ONLY public.measure_tasks FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_type character varying(50) NOT NULL,
    channels jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.notification_preferences FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid,
    template_code character varying(50),
    user_id uuid,
    target_phone character varying(20),
    target_email character varying(100),
    channel character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    retry_count character varying(10) DEFAULT '0'::character varying,
    max_retries character varying(10) DEFAULT '3'::character varying,
    last_error text,
    scheduled_at timestamp with time zone,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    notification_type character varying(50) NOT NULL,
    channels jsonb DEFAULT '["IN_APP"]'::jsonb,
    title_template character varying(200) NOT NULL,
    content_template text NOT NULL,
    sms_template character varying(500),
    wechat_template_id character varying(100),
    param_mapping jsonb,
    is_active boolean DEFAULT true,
    priority character varying(20) DEFAULT 'NORMAL'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    content text,
    type character varying(50) DEFAULT 'SYSTEM'::character varying,
    channel character varying(20) DEFAULT 'IN_APP'::character varying,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    link_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.notifications FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.order_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    type public.change_request_type NOT NULL,
    reason text NOT NULL,
    status public.change_request_status DEFAULT 'PENDING'::public.change_request_status,
    diff_amount numeric(12,2) DEFAULT '0'::numeric,
    original_data jsonb,
    new_data jsonb,
    requested_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    quote_item_id uuid NOT NULL,
    room_name character varying(100) NOT NULL,
    product_id uuid NOT NULL,
    product_name character varying(200) NOT NULL,
    category public.product_category NOT NULL,
    quantity numeric(10,2) NOT NULL,
    width numeric(10,2),
    height numeric(10,2),
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    po_id uuid,
    supplier_id uuid,
    status public.order_item_status DEFAULT 'PENDING'::public.order_item_status,
    remark text,
    sort_order integer DEFAULT 0,
    attributes jsonb DEFAULT '{}'::jsonb,
    calculation_params jsonb,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_no character varying(50) NOT NULL,
    quote_id uuid NOT NULL,
    quote_version_id uuid NOT NULL,
    lead_id uuid,
    customer_id uuid NOT NULL,
    customer_name character varying(100),
    customer_phone character varying(20),
    delivery_address text,
    total_amount numeric(12,2) DEFAULT '0'::numeric,
    paid_amount numeric(12,2) DEFAULT '0'::numeric,
    balance_amount numeric(12,2) DEFAULT '0'::numeric,
    settlement_type public.order_settlement_type NOT NULL,
    confirmation_img text,
    payment_proof_img text,
    payment_amount numeric(12,2),
    payment_method public.payment_method,
    payment_time timestamp with time zone,
    prepaid_payment_id uuid,
    status public.order_status DEFAULT 'DRAFT'::public.order_status,
    is_locked boolean DEFAULT false,
    locked_at timestamp with time zone,
    sales_id uuid,
    remark text,
    snapshot_data jsonb,
    logistics jsonb,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    closed_at timestamp with time zone,
    paused_at timestamp with time zone,
    pause_reason text,
    pause_cumulative_days integer DEFAULT 0,
    deleted_at timestamp with time zone,
    quote_snapshot jsonb,
    channel_id uuid,
    channel_contact_id uuid,
    channel_cooperation_mode public.cooperation_mode
);
CREATE TABLE IF NOT EXISTS public.package_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid NOT NULL,
    product_id uuid NOT NULL,
    is_required boolean DEFAULT false,
    min_quantity numeric(10,2),
    max_quantity numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payment_bill_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    payment_bill_id uuid NOT NULL,
    statement_type character varying(50) NOT NULL,
    statement_id uuid NOT NULL,
    statement_no character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.payment_bill_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.payment_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    payment_no character varying(50) NOT NULL,
    type character varying(20) DEFAULT 'SUPPLIER'::character varying,
    payee_type character varying(20) NOT NULL,
    payee_id uuid NOT NULL,
    payee_name character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    payment_method character varying(20) NOT NULL,
    account_id uuid,
    proof_url text NOT NULL,
    paid_at timestamp with time zone,
    recorded_by uuid NOT NULL,
    remark text,
    is_verified boolean DEFAULT false,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    order_id uuid
);
ALTER TABLE ONLY public.payment_bills FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.payment_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    payment_order_id uuid NOT NULL,
    order_id uuid NOT NULL,
    statement_id uuid,
    schedule_id uuid,
    order_no character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.payment_order_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    payment_no character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    customer_id uuid,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    used_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    remaining_amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    payment_method character varying(20) NOT NULL,
    account_id uuid,
    proof_url text NOT NULL,
    received_at timestamp with time zone NOT NULL,
    remark text,
    created_by uuid NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.payment_orders FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.payment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    statement_id uuid,
    name character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    expected_date date,
    actual_date date,
    status public.payment_schedule_status DEFAULT 'PENDING'::public.payment_schedule_status,
    proof_img text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.phone_view_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    viewer_id uuid NOT NULL,
    viewer_role character varying(50) NOT NULL,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_attribute_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    category public.product_category NOT NULL,
    template_schema jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_attribute_templates FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_bundle_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    bundle_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit character varying(20),
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_bundle_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    bundle_sku character varying(50) NOT NULL,
    bundle_name character varying(200) NOT NULL,
    category character varying(50),
    retail_price numeric(12,2) DEFAULT '0'::numeric,
    channel_price numeric(12,2) DEFAULT '0'::numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_bundles FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    package_no character varying(50) NOT NULL,
    package_name character varying(200) NOT NULL,
    package_type public.package_type NOT NULL,
    package_price numeric(12,2) NOT NULL,
    original_price numeric(12,2),
    description text,
    rules jsonb DEFAULT '{}'::jsonb,
    overflow_mode public.package_overflow_mode DEFAULT 'DISCOUNT'::public.package_overflow_mode,
    overflow_price numeric(12,2),
    overflow_discount_rate numeric(5,4),
    is_active boolean DEFAULT true,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_packages FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    supplier_id uuid,
    channel_id uuid,
    price_type character varying(20) NOT NULL,
    old_price numeric(12,2),
    new_price numeric(12,2),
    effective_date timestamp with time zone,
    change_type character varying(50) NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_price_history FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    is_default boolean DEFAULT false,
    purchase_price numeric(12,2),
    logistics_cost numeric(12,2),
    processing_cost numeric(12,2),
    lead_time_days integer DEFAULT 7,
    min_order_quantity numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_suppliers FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.product_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    category public.product_category NOT NULL,
    description text,
    unit_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    default_width numeric(10,2),
    default_fold_ratio numeric(4,2),
    tags jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.product_templates FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.production_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    task_no character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    workshop character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    assigned_worker_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.production_tasks FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    sku character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    category public.product_category NOT NULL,
    unit_price numeric(12,2) DEFAULT '0'::numeric,
    unit character varying(20) DEFAULT '件'::character varying,
    purchase_price numeric(12,2) DEFAULT '0'::numeric,
    logistics_cost numeric(12,2) DEFAULT '0'::numeric,
    processing_cost numeric(12,2) DEFAULT '0'::numeric,
    loss_rate numeric(5,4) DEFAULT 0.0500,
    retail_price numeric(12,2) DEFAULT '0'::numeric,
    channel_price_mode character varying(20) DEFAULT 'FIXED'::character varying,
    channel_price numeric(12,2) DEFAULT '0'::numeric,
    channel_discount_rate numeric(5,4) DEFAULT 1.0000,
    floor_price numeric(12,2) DEFAULT '0'::numeric,
    is_tob_enabled boolean DEFAULT true,
    is_toc_enabled boolean DEFAULT true,
    default_supplier_id uuid,
    is_stockable boolean DEFAULT false,
    description text,
    specs jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    product_type public.product_type DEFAULT 'FINISHED'::public.product_type NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    stock_unit character varying(20),
    sales_unit character varying(20),
    conversion_rate numeric(10,4)
);
ALTER TABLE ONLY public.products FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    po_id uuid NOT NULL,
    order_item_id uuid,
    product_id uuid,
    product_sku character varying(100),
    category character varying(50),
    product_name character varying(200) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) DEFAULT '0'::numeric,
    width numeric(10,2),
    height numeric(10,2),
    subtotal numeric(12,2),
    quote_item_id uuid,
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    po_no character varying(50) NOT NULL,
    order_id uuid,
    after_sales_id uuid,
    supplier_id uuid NOT NULL,
    supplier_name character varying(100) NOT NULL,
    type public.po_type DEFAULT 'FINISHED'::public.po_type,
    split_rule_id uuid,
    status public.purchase_order_status DEFAULT 'DRAFT'::public.purchase_order_status,
    total_amount numeric(12,2) DEFAULT '0'::numeric,
    external_po_no character varying(100),
    supplier_quote_img text,
    sent_method character varying(20),
    sent_at timestamp with time zone,
    produced_at timestamp with time zone,
    logistics_company character varying(50),
    logistics_no character varying(100),
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status,
    expected_date timestamp with time zone,
    remark text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    entity_id uuid NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);
CREATE TABLE IF NOT EXISTS public.quote_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    parent_id uuid,
    room_id uuid,
    category character varying(50) NOT NULL,
    product_id uuid,
    product_name character varying(200) NOT NULL,
    product_sku character varying(100),
    room_name character varying(100),
    unit character varying(20),
    unit_price numeric(10,2) NOT NULL,
    cost_price numeric(10,2),
    quantity numeric(10,2) NOT NULL,
    width numeric(10,2),
    height numeric(10,2),
    fold_ratio numeric(4,2),
    process_fee numeric(10,2),
    subtotal numeric(12,2) NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb,
    calculation_params jsonb,
    remark text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_plan_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    template_id uuid NOT NULL,
    override_price numeric(10,2),
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    measure_room_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_template_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    room_id uuid,
    parent_id uuid,
    category character varying(50) NOT NULL,
    product_id uuid,
    product_name character varying(200) NOT NULL,
    default_width numeric(10,2),
    default_height numeric(10,2),
    default_fold_ratio numeric(4,2),
    unit_price numeric(10,2),
    attributes jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_template_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quote_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(50),
    tags jsonb DEFAULT '[]'::jsonb,
    source_quote_id uuid,
    is_public boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_no character varying(50) NOT NULL,
    customer_id uuid NOT NULL,
    lead_id uuid,
    measure_variant_id uuid,
    bundle_id uuid,
    root_quote_id uuid,
    parent_quote_id uuid,
    is_active boolean DEFAULT true,
    title character varying(200),
    total_amount numeric(12,2) DEFAULT '0'::numeric,
    discount_rate numeric(5,4),
    discount_amount numeric(12,2) DEFAULT '0'::numeric,
    final_amount numeric(12,2) DEFAULT '0'::numeric,
    min_profit_margin numeric(5,4),
    status public.quote_status DEFAULT 'DRAFT'::public.quote_status,
    version integer DEFAULT 1 NOT NULL,
    valid_until timestamp with time zone,
    notes text,
    approval_required boolean DEFAULT false,
    approver_id uuid,
    approved_at timestamp with time zone,
    reject_reason text,
    locked_at timestamp with time zone,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.receipt_bill_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    receipt_bill_id uuid NOT NULL,
    order_id uuid NOT NULL,
    statement_id uuid,
    schedule_id uuid,
    order_no character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.receipt_bill_items FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.receipt_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    receipt_no character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    customer_id uuid,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    used_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    remaining_amount numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    payment_method character varying(20) NOT NULL,
    account_id uuid,
    proof_url text NOT NULL,
    received_at timestamp with time zone NOT NULL,
    remark text,
    created_by uuid NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.receipt_bills FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.reconciliation_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reconciliation_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    document_id uuid NOT NULL,
    document_no character varying(50) NOT NULL,
    document_amount numeric(12,2) NOT NULL,
    reconciliation_amount numeric(12,2) NOT NULL,
    difference numeric(12,2) NOT NULL,
    status character varying(20) NOT NULL,
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.reconciliation_details FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.reconciliations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reconciliation_no character varying(50) NOT NULL,
    reconciliation_type character varying(20) NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    target_name character varying(100) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    matched_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    unmatched_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) NOT NULL,
    reconciled_at timestamp with time zone,
    confirmed_by uuid,
    confirmed_at timestamp with time zone,
    completed_at timestamp with time zone,
    remark text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.reconciliations FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.roles FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.split_route_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    priority integer DEFAULT 0,
    name character varying(100) NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
    target_type character varying(50) NOT NULL,
    target_supplier_id uuid,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.statement_confirmation_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    confirmation_id uuid NOT NULL,
    document_type character varying(30) NOT NULL,
    document_id uuid NOT NULL,
    document_no character varying(50) NOT NULL,
    document_date date NOT NULL,
    document_amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    dispute_reason text,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.statement_confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    confirmation_no character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    target_name character varying(100) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    period_label character varying(50) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    confirmed_amount numeric(12,2) DEFAULT '0'::numeric,
    disputed_amount numeric(12,2) DEFAULT '0'::numeric,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    confirmed_by character varying(100),
    remark text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_no character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    contact_person character varying(100),
    phone character varying(50),
    payment_period character varying(50) DEFAULT 'CASH'::character varying,
    is_active boolean DEFAULT true,
    address text,
    remark text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    supplier_type public.supplier_type DEFAULT 'SUPPLIER'::public.supplier_type,
    processing_prices jsonb,
    contract_url text,
    contract_expiry_date timestamp with time zone,
    business_license_url text,
    bank_account character varying(100),
    bank_name character varying(100)
);
CREATE TABLE IF NOT EXISTS public.sys_dictionaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    category character varying(50) NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    label character varying(100),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.sys_dictionaries FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    type character varying(50) DEFAULT 'INFO'::character varying,
    target_roles jsonb,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone,
    is_pinned boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    category character varying(50) NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    value_type character varying(20) NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);
CREATE TABLE IF NOT EXISTS public.system_settings_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    setting_id uuid NOT NULL,
    key character varying(100) NOT NULL,
    old_value text,
    new_value text NOT NULL,
    changed_by uuid NOT NULL,
    changed_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    logo_url text,
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'active'::character varying,
    applicant_name character varying(100),
    applicant_phone character varying(20),
    applicant_email character varying(255),
    region character varying(100),
    business_description text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    reject_reason text
);
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(100),
    phone character varying(20),
    password_hash text,
    role character varying(50) DEFAULT 'USER'::character varying,
    permissions jsonb DEFAULT '[]'::jsonb,
    wechat_openid character varying(100),
    preferences jsonb DEFAULT '{}'::jsonb,
    dashboard_config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notification_settings jsonb DEFAULT '{}'::jsonb,
    is_platform_admin boolean DEFAULT false
);
ALTER TABLE ONLY public.users FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    phone character varying(20) NOT NULL,
    code character varying(10) NOT NULL,
    type public.verification_code_type NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    ip character varying(50)
);
CREATE TABLE IF NOT EXISTS public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    manager_id uuid,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.work_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wo_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    status public.work_order_item_status DEFAULT 'PENDING'::public.work_order_item_status,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.work_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    wo_no character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    po_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    status public.work_order_status DEFAULT 'PENDING'::public.work_order_status,
    start_at timestamp with time zone,
    completed_at timestamp with time zone,
    remark text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
ALTER TABLE ONLY public.work_orders FORCE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.worker_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    skill_type public.worker_skill_type NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);
ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT IF NOT EXISTS __drizzle_migrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT IF NOT EXISTS account_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT IF NOT EXISTS account_transactions_transaction_no_unique UNIQUE (transaction_no);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_ticket_no_unique UNIQUE (ticket_no);
ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT IF NOT EXISTS ap_labor_fee_details_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT IF NOT EXISTS ap_labor_statements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT IF NOT EXISTS ap_labor_statements_statement_no_unique UNIQUE (statement_no);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_statement_no_unique UNIQUE (statement_no);
ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT IF NOT EXISTS approval_delegations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT IF NOT EXISTS approval_flows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT IF NOT EXISTS approval_nodes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT IF NOT EXISTS approvals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_statement_no_unique UNIQUE (statement_no);
ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT IF NOT EXISTS audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_categories
    ADD CONSTRAINT IF NOT EXISTS channel_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT IF NOT EXISTS channel_commissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT IF NOT EXISTS channel_contacts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_discount_overrides
    ADD CONSTRAINT IF NOT EXISTS channel_discount_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_settlement_no_unique UNIQUE (settlement_no);
ALTER TABLE ONLY public.channel_specific_prices
    ADD CONSTRAINT IF NOT EXISTS channel_specific_prices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT IF NOT EXISTS channels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT IF NOT EXISTS commission_adjustments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_commission_no_unique UNIQUE (commission_no);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_credit_note_no_unique UNIQUE (credit_note_no);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT IF NOT EXISTS customer_addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT IF NOT EXISTS customer_merge_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_customer_no_unique UNIQUE (customer_no);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_referral_code_unique UNIQUE (referral_code);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_wechat_openid_unique UNIQUE (wechat_openid);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_debit_note_no_unique UNIQUE (debit_note_no);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT IF NOT EXISTS fabric_inventory_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.fabric_inventory
    ADD CONSTRAINT IF NOT EXISTS fabric_inventory_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT IF NOT EXISTS finance_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.finance_configs
    ADD CONSTRAINT IF NOT EXISTS finance_configs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT IF NOT EXISTS install_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT IF NOT EXISTS install_photos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_task_no_unique UNIQUE (task_no);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_transfer_no_unique UNIQUE (transfer_no);
ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT IF NOT EXISTS inventory_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT IF NOT EXISTS inventory_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.labor_rates
    ADD CONSTRAINT IF NOT EXISTS labor_rates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT IF NOT EXISTS lead_activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT IF NOT EXISTS lead_status_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_lead_no_unique UNIQUE (lead_no);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_notice_no_unique UNIQUE (notice_no);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT IF NOT EXISTS loyalty_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT IF NOT EXISTS market_channels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT IF NOT EXISTS measure_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT IF NOT EXISTS measure_sheets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT IF NOT EXISTS measure_task_splits_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_measure_no_unique UNIQUE (measure_no);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT IF NOT EXISTS notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT IF NOT EXISTS notification_queue_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT IF NOT EXISTS notification_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT IF NOT EXISTS notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT IF NOT EXISTS order_changes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_order_no_unique UNIQUE (order_no);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.package_products
    ADD CONSTRAINT IF NOT EXISTS package_products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT IF NOT EXISTS payment_bill_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_payment_no_unique UNIQUE (payment_no);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_payment_no_unique UNIQUE (payment_no);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT IF NOT EXISTS payment_schedules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT IF NOT EXISTS phone_view_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_attribute_templates
    ADD CONSTRAINT IF NOT EXISTS product_attribute_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT IF NOT EXISTS product_bundle_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT IF NOT EXISTS product_bundles_bundle_sku_unique UNIQUE (bundle_sku);
ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT IF NOT EXISTS product_bundles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT IF NOT EXISTS product_packages_package_no_unique UNIQUE (package_no);
ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT IF NOT EXISTS product_packages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT IF NOT EXISTS product_price_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT IF NOT EXISTS product_suppliers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT IF NOT EXISTS product_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT IF NOT EXISTS production_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT IF NOT EXISTS production_tasks_task_no_unique UNIQUE (task_no);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT IF NOT EXISTS products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT IF NOT EXISTS products_sku_unique UNIQUE (sku);
ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT IF NOT EXISTS purchase_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_po_no_unique UNIQUE (po_no);
ALTER TABLE ONLY public.quote_config
    ADD CONSTRAINT IF NOT EXISTS quote_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT IF NOT EXISTS quote_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT IF NOT EXISTS quote_plan_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_plans
    ADD CONSTRAINT IF NOT EXISTS quote_plans_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_rooms_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT IF NOT EXISTS quote_template_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_template_rooms_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT IF NOT EXISTS quote_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_quote_no_unique UNIQUE (quote_no);
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_receipt_no_unique UNIQUE (receipt_no);
ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT IF NOT EXISTS reconciliation_details_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT IF NOT EXISTS reconciliations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT IF NOT EXISTS reconciliations_reconciliation_no_unique UNIQUE (reconciliation_no);
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT IF NOT EXISTS roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT IF NOT EXISTS split_route_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT IF NOT EXISTS statement_confirmation_details_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT IF NOT EXISTS statement_confirmations_confirmation_no_unique UNIQUE (confirmation_no);
ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT IF NOT EXISTS statement_confirmations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT IF NOT EXISTS suppliers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT IF NOT EXISTS suppliers_supplier_no_unique UNIQUE (supplier_no);
ALTER TABLE ONLY public.sys_dictionaries
    ADD CONSTRAINT IF NOT EXISTS sys_dictionaries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT IF NOT EXISTS system_announcements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT IF NOT EXISTS system_settings_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT IF NOT EXISTS system_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT IF NOT EXISTS tenants_code_unique UNIQUE (code);
ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT IF NOT EXISTS tenants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT IF NOT EXISTS users_phone_unique UNIQUE (phone);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT IF NOT EXISTS users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT IF NOT EXISTS users_wechat_openid_unique UNIQUE (wechat_openid);
ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT IF NOT EXISTS verification_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT IF NOT EXISTS warehouses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT IF NOT EXISTS work_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_wo_no_unique UNIQUE (wo_no);
ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT IF NOT EXISTS worker_skills_pkey PRIMARY KEY (id);
CREATE INDEX idx_account_transactions_account ON public.account_transactions USING btree (account_id);
CREATE INDEX idx_account_transactions_related ON public.account_transactions USING btree (related_id);
CREATE INDEX idx_account_transactions_tenant ON public.account_transactions USING btree (tenant_id);
CREATE INDEX idx_adjustments_channel ON public.commission_adjustments USING btree (channel_id);
CREATE INDEX idx_adjustments_tenant ON public.commission_adjustments USING btree (tenant_id);
CREATE INDEX idx_announce_tenant ON public.system_announcements USING btree (tenant_id);
CREATE INDEX idx_announce_time ON public.system_announcements USING btree (start_at, end_at);
CREATE INDEX idx_ap_labor_fee_details_liability ON public.ap_labor_fee_details USING btree (liability_notice_id);
CREATE INDEX idx_ap_labor_fee_details_statement ON public.ap_labor_fee_details USING btree (statement_id);
CREATE INDEX idx_ap_labor_fee_details_task ON public.ap_labor_fee_details USING btree (install_task_id);
CREATE INDEX idx_ap_labor_statements_tenant ON public.ap_labor_statements USING btree (tenant_id);
CREATE INDEX idx_ap_labor_statements_worker ON public.ap_labor_statements USING btree (worker_id);
CREATE INDEX idx_ap_supplier_statements_po ON public.ap_supplier_statements USING btree (purchase_order_id);
CREATE INDEX idx_ap_supplier_statements_supplier ON public.ap_supplier_statements USING btree (supplier_id);
CREATE INDEX idx_ap_supplier_statements_tenant ON public.ap_supplier_statements USING btree (tenant_id);
CREATE INDEX idx_approval_delegations_active ON public.approval_delegations USING btree (is_active);
CREATE INDEX idx_approval_delegations_delegatee ON public.approval_delegations USING btree (delegatee_id);
CREATE INDEX idx_approval_delegations_delegator ON public.approval_delegations USING btree (delegator_id);
CREATE INDEX idx_approval_flows_tenant_code ON public.approval_flows USING btree (tenant_id, code);
CREATE INDEX idx_approval_nodes_flow ON public.approval_nodes USING btree (flow_id);
CREATE INDEX idx_approval_tasks_approval ON public.approval_tasks USING btree (approval_id);
CREATE INDEX idx_approval_tasks_approver ON public.approval_tasks USING btree (approver_id);
CREATE INDEX idx_approval_tasks_timeout ON public.approval_tasks USING btree (timeout_at);
CREATE INDEX idx_approvals_entity ON public.approvals USING btree (entity_id);
CREATE INDEX idx_approvals_requester ON public.approvals USING btree (requester_id);
CREATE INDEX idx_approvals_status ON public.approvals USING btree (status);
CREATE INDEX idx_approvals_tenant ON public.approvals USING btree (tenant_id);
CREATE INDEX idx_ar_statements_customer ON public.ar_statements USING btree (customer_id);
CREATE INDEX idx_ar_statements_order ON public.ar_statements USING btree (order_id);
CREATE INDEX idx_ar_statements_status ON public.ar_statements USING btree (status);
CREATE INDEX idx_ar_statements_tenant ON public.ar_statements USING btree (tenant_id);
CREATE INDEX idx_as_assigned_to ON public.after_sales_tickets USING btree (assigned_to);
CREATE INDEX idx_as_customer ON public.after_sales_tickets USING btree (customer_id);
CREATE INDEX idx_as_order ON public.after_sales_tickets USING btree (order_id);
CREATE INDEX idx_as_status ON public.after_sales_tickets USING btree (status);
CREATE INDEX idx_as_tenant ON public.after_sales_tickets USING btree (tenant_id);
CREATE INDEX idx_as_ticket_no ON public.after_sales_tickets USING btree (ticket_no);
CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_table ON public.audit_logs USING btree (table_name);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs USING btree (tenant_id);
CREATE INDEX idx_bundle_items_bundle ON public.product_bundle_items USING btree (bundle_id);
CREATE INDEX idx_bundles_sku ON public.product_bundles USING btree (bundle_sku);
CREATE INDEX idx_bundles_tenant ON public.product_bundles USING btree (tenant_id);
CREATE INDEX idx_channel_categories_code ON public.channel_categories USING btree (tenant_id, code);
CREATE INDEX idx_channel_categories_tenant ON public.channel_categories USING btree (tenant_id);
CREATE INDEX idx_channel_contacts_channel ON public.channel_contacts USING btree (channel_id);
CREATE INDEX idx_channel_contacts_phone ON public.channel_contacts USING btree (phone);
CREATE INDEX idx_channel_discount_overrides_scope_target ON public.channel_discount_overrides USING btree (scope, target_id);
CREATE INDEX idx_channel_discount_overrides_tenant ON public.channel_discount_overrides USING btree (tenant_id);
CREATE INDEX idx_channels_code ON public.channels USING btree (code);
CREATE INDEX idx_channels_parent ON public.channels USING btree (parent_id);
CREATE INDEX idx_channels_phone ON public.channels USING btree (phone);
CREATE INDEX idx_channels_tenant ON public.channels USING btree (tenant_id);
CREATE INDEX idx_commission_records_ar ON public.commission_records USING btree (ar_statement_id);
CREATE INDEX idx_commission_records_channel ON public.commission_records USING btree (channel_id);
CREATE INDEX idx_commission_records_tenant ON public.commission_records USING btree (tenant_id);
CREATE INDEX idx_commissions_channel ON public.channel_commissions USING btree (channel_id);
CREATE INDEX idx_commissions_order ON public.channel_commissions USING btree (order_id);
CREATE INDEX idx_commissions_status ON public.channel_commissions USING btree (status);
CREATE INDEX idx_commissions_tenant ON public.channel_commissions USING btree (tenant_id);
CREATE INDEX idx_credit_notes_customer ON public.credit_notes USING btree (customer_id);
CREATE INDEX idx_credit_notes_status ON public.credit_notes USING btree (status);
CREATE INDEX idx_credit_notes_tenant ON public.credit_notes USING btree (tenant_id);
CREATE INDEX idx_csp_channel ON public.channel_specific_prices USING btree (channel_id);
CREATE INDEX idx_csp_product ON public.channel_specific_prices USING btree (product_id);
CREATE INDEX idx_csp_tenant ON public.channel_specific_prices USING btree (tenant_id);
CREATE INDEX idx_cust_addresses_customer ON public.customer_addresses USING btree (customer_id);
CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX idx_customers_referrer ON public.customers USING btree (referrer_customer_id);
CREATE INDEX idx_customers_tenant ON public.customers USING btree (tenant_id);
CREATE INDEX idx_debit_notes_status ON public.debit_notes USING btree (status);
CREATE INDEX idx_debit_notes_supplier ON public.debit_notes USING btree (supplier_id);
CREATE INDEX idx_debit_notes_tenant ON public.debit_notes USING btree (tenant_id);
CREATE INDEX idx_fabric_inventory_product ON public.fabric_inventory USING btree (fabric_product_id);
CREATE INDEX idx_fabric_inventory_tenant ON public.fabric_inventory USING btree (tenant_id);
CREATE INDEX idx_fabric_logs_inventory ON public.fabric_inventory_logs USING btree (fabric_inventory_id);
CREATE UNIQUE INDEX idx_finance_accounts_no_tenant ON public.finance_accounts USING btree (account_no, tenant_id);
CREATE INDEX idx_finance_accounts_tenant ON public.finance_accounts USING btree (tenant_id);
CREATE INDEX idx_finance_configs_key ON public.finance_configs USING btree (config_key);
CREATE INDEX idx_finance_configs_tenant ON public.finance_configs USING btree (tenant_id);
CREATE INDEX idx_install_installer ON public.install_tasks USING btree (installer_id);
CREATE INDEX idx_install_items_task ON public.install_items USING btree (install_task_id);
CREATE INDEX idx_install_order ON public.install_tasks USING btree (order_id);
CREATE INDEX idx_install_scheduled_date ON public.install_tasks USING btree (scheduled_date);
CREATE INDEX idx_install_status ON public.install_tasks USING btree (status);
CREATE INDEX idx_install_tenant ON public.install_tasks USING btree (tenant_id);
CREATE INDEX idx_internal_transfers_from ON public.internal_transfers USING btree (from_account_id);
CREATE INDEX idx_internal_transfers_status ON public.internal_transfers USING btree (status);
CREATE INDEX idx_internal_transfers_tenant ON public.internal_transfers USING btree (tenant_id);
CREATE INDEX idx_internal_transfers_to ON public.internal_transfers USING btree (to_account_id);
CREATE INDEX idx_inventory_logs_created ON public.inventory_logs USING btree (created_at);
CREATE INDEX idx_inventory_logs_tenant ON public.inventory_logs USING btree (tenant_id);
CREATE INDEX idx_inventory_logs_warehouse ON public.inventory_logs USING btree (warehouse_id);
CREATE INDEX idx_inventory_product ON public.inventory USING btree (product_id);
CREATE INDEX idx_inventory_tenant ON public.inventory USING btree (tenant_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory USING btree (warehouse_id);
CREATE INDEX idx_labor_rates_entity ON public.labor_rates USING btree (entity_type, entity_id);
CREATE INDEX idx_labor_rates_tenant ON public.labor_rates USING btree (tenant_id);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities USING btree (lead_id);
CREATE INDEX idx_lead_history_lead ON public.lead_status_history USING btree (lead_id);
CREATE INDEX idx_lead_history_tenant ON public.lead_status_history USING btree (tenant_id);
CREATE INDEX idx_leads_phone ON public.leads USING btree (customer_phone);
CREATE INDEX idx_leads_sales ON public.leads USING btree (assigned_sales_id);
CREATE INDEX idx_leads_status ON public.leads USING btree (status);
CREATE INDEX idx_leads_tenant ON public.leads USING btree (tenant_id);
CREATE INDEX idx_leads_tenant_date ON public.leads USING btree (tenant_id, created_at);
CREATE INDEX idx_ln_after_sales ON public.liability_notices USING btree (after_sales_id);
CREATE INDEX idx_ln_notice_no ON public.liability_notices USING btree (notice_no);
CREATE INDEX idx_ln_tenant ON public.liability_notices USING btree (tenant_id);
CREATE INDEX idx_loyalty_customer ON public.loyalty_transactions USING btree (customer_id);
CREATE INDEX idx_loyalty_ref ON public.loyalty_transactions USING btree (reference_id);
CREATE INDEX idx_market_channels_parent ON public.market_channels USING btree (parent_id);
CREATE INDEX idx_market_channels_tenant ON public.market_channels USING btree (tenant_id);
CREATE INDEX idx_measure_items_sheet ON public.measure_items USING btree (sheet_id);
CREATE INDEX idx_measure_task_splits_original ON public.measure_task_splits USING btree (original_task_id);
CREATE INDEX idx_measure_task_splits_tenant ON public.measure_task_splits USING btree (tenant_id);
CREATE INDEX idx_measure_tasks_lead ON public.measure_tasks USING btree (lead_id);
CREATE INDEX idx_measure_tasks_status ON public.measure_tasks USING btree (status);
CREATE INDEX idx_measure_tasks_tenant ON public.measure_tasks USING btree (tenant_id);
CREATE INDEX idx_merge_logs_primary ON public.customer_merge_logs USING btree (primary_customer_id);
CREATE INDEX idx_merge_logs_tenant ON public.customer_merge_logs USING btree (tenant_id);
CREATE INDEX idx_notif_prefs_user ON public.notification_preferences USING btree (user_id);
CREATE INDEX idx_notif_queue_scheduled ON public.notification_queue USING btree (scheduled_at);
CREATE INDEX idx_notif_queue_status ON public.notification_queue USING btree (status);
CREATE INDEX idx_notif_queue_user ON public.notification_queue USING btree (user_id);
CREATE INDEX idx_notif_template_code ON public.notification_templates USING btree (code);
CREATE INDEX idx_notif_template_tenant ON public.notification_templates USING btree (tenant_id);
CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);
CREATE INDEX idx_notifications_tenant ON public.notifications USING btree (tenant_id);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX idx_order_changes_order ON public.order_changes USING btree (order_id);
CREATE INDEX idx_order_changes_status ON public.order_changes USING btree (status);
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX idx_orders_channel ON public.orders USING btree (channel_id);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_order_no ON public.orders USING btree (order_no);
CREATE INDEX idx_orders_quote ON public.orders USING btree (quote_id);
CREATE INDEX idx_orders_sales ON public.orders USING btree (sales_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_tenant ON public.orders USING btree (tenant_id);
CREATE INDEX idx_orders_tenant_status ON public.orders USING btree (tenant_id, status);
CREATE INDEX idx_package_products_package ON public.package_products USING btree (package_id);
CREATE INDEX idx_package_products_product ON public.package_products USING btree (product_id);
CREATE INDEX idx_packages_no ON public.product_packages USING btree (package_no);
CREATE INDEX idx_packages_tenant ON public.product_packages USING btree (tenant_id);
CREATE INDEX idx_payment_bill_items_bill ON public.payment_bill_items USING btree (payment_bill_id);
CREATE INDEX idx_payment_bill_items_statement ON public.payment_bill_items USING btree (statement_id);
CREATE INDEX idx_payment_bills_order ON public.payment_bills USING btree (order_id);
CREATE INDEX idx_payment_bills_payee ON public.payment_bills USING btree (payee_id);
CREATE INDEX idx_payment_bills_tenant ON public.payment_bills USING btree (tenant_id);
CREATE INDEX idx_payment_order_items_order ON public.payment_order_items USING btree (order_id);
CREATE INDEX idx_payment_order_items_payment ON public.payment_order_items USING btree (payment_order_id);
CREATE INDEX idx_payment_orders_customer ON public.payment_orders USING btree (customer_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders USING btree (status);
CREATE INDEX idx_payment_orders_tenant ON public.payment_orders USING btree (tenant_id);
CREATE INDEX idx_payment_schedules_order ON public.payment_schedules USING btree (order_id);
CREATE INDEX idx_phone_view_logs_customer ON public.phone_view_logs USING btree (customer_id);
CREATE INDEX idx_phone_view_logs_tenant ON public.phone_view_logs USING btree (tenant_id);
CREATE INDEX idx_phone_view_logs_viewer ON public.phone_view_logs USING btree (viewer_id);
CREATE INDEX idx_po_after_sales ON public.purchase_orders USING btree (after_sales_id);
CREATE INDEX idx_po_order ON public.purchase_orders USING btree (order_id);
CREATE INDEX idx_po_status ON public.purchase_orders USING btree (status);
CREATE INDEX idx_po_supplier ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX idx_po_tenant ON public.purchase_orders USING btree (tenant_id);
CREATE INDEX idx_poi_order_item ON public.purchase_order_items USING btree (order_item_id);
CREATE INDEX idx_poi_po ON public.purchase_order_items USING btree (po_id);
CREATE INDEX idx_poi_tenant ON public.purchase_order_items USING btree (tenant_id);
CREATE INDEX idx_product_attr_templates_category ON public.product_attribute_templates USING btree (category);
CREATE INDEX idx_product_attr_templates_tenant ON public.product_attribute_templates USING btree (tenant_id);
CREATE INDEX idx_product_price_history_product ON public.product_price_history USING btree (product_id);
CREATE INDEX idx_product_price_history_tenant ON public.product_price_history USING btree (tenant_id);
CREATE INDEX idx_product_suppliers_product ON public.product_suppliers USING btree (product_id);
CREATE INDEX idx_product_suppliers_supplier ON public.product_suppliers USING btree (supplier_id);
CREATE INDEX idx_product_suppliers_tenant ON public.product_suppliers USING btree (tenant_id);
CREATE INDEX idx_production_tasks_order ON public.production_tasks USING btree (order_id);
CREATE INDEX idx_production_tasks_tenant ON public.production_tasks USING btree (tenant_id);
CREATE INDEX idx_products_sku ON public.products USING btree (sku);
CREATE INDEX idx_products_supplier ON public.products USING btree (default_supplier_id);
CREATE INDEX idx_products_tenant ON public.products USING btree (tenant_id);
CREATE INDEX idx_quote_items_quote ON public.quote_items USING btree (quote_id);
CREATE UNIQUE INDEX idx_quote_plans_code_tenant ON public.quote_plans USING btree (code, tenant_id);
CREATE INDEX idx_quote_rooms_quote ON public.quote_rooms USING btree (quote_id);
CREATE INDEX idx_quote_template_items_room ON public.quote_template_items USING btree (room_id);
CREATE INDEX idx_quote_template_items_template ON public.quote_template_items USING btree (template_id);
CREATE INDEX idx_quote_template_rooms_template ON public.quote_template_rooms USING btree (template_id);
CREATE INDEX idx_quote_templates_category ON public.quote_templates USING btree (category);
CREATE INDEX idx_quote_templates_tenant ON public.quote_templates USING btree (tenant_id);
CREATE UNIQUE INDEX idx_quotes_active_version ON public.quotes USING btree (root_quote_id) WHERE (is_active = true);
CREATE INDEX idx_quotes_customer ON public.quotes USING btree (customer_id);
CREATE INDEX idx_quotes_tenant ON public.quotes USING btree (tenant_id);
CREATE INDEX idx_receipt_bill_items_order ON public.receipt_bill_items USING btree (order_id);
CREATE INDEX idx_receipt_bill_items_receipt ON public.receipt_bill_items USING btree (receipt_bill_id);
CREATE INDEX idx_receipt_bills_customer ON public.receipt_bills USING btree (customer_id);
CREATE INDEX idx_receipt_bills_status ON public.receipt_bills USING btree (status);
CREATE INDEX idx_receipt_bills_tenant ON public.receipt_bills USING btree (tenant_id);
CREATE INDEX idx_reconciliation_details_doc ON public.reconciliation_details USING btree (document_id);
CREATE INDEX idx_reconciliation_details_recon ON public.reconciliation_details USING btree (reconciliation_id);
CREATE INDEX idx_reconciliations_status ON public.reconciliations USING btree (status);
CREATE INDEX idx_reconciliations_target ON public.reconciliations USING btree (target_id);
CREATE INDEX idx_reconciliations_tenant ON public.reconciliations USING btree (tenant_id);
CREATE INDEX idx_settlements_channel ON public.channel_settlements USING btree (channel_id);
CREATE INDEX idx_settlements_status ON public.channel_settlements USING btree (status);
CREATE INDEX idx_settlements_tenant ON public.channel_settlements USING btree (tenant_id);
CREATE INDEX idx_statement_confirmation_details_confirmation ON public.statement_confirmation_details USING btree (confirmation_id);
CREATE INDEX idx_statement_confirmation_details_doc ON public.statement_confirmation_details USING btree (document_id);
CREATE INDEX idx_statement_confirmations_period ON public.statement_confirmations USING btree (period_start, period_end);
CREATE INDEX idx_statement_confirmations_status ON public.statement_confirmations USING btree (status);
CREATE INDEX idx_statement_confirmations_target ON public.statement_confirmations USING btree (target_id);
CREATE INDEX idx_statement_confirmations_tenant ON public.statement_confirmations USING btree (tenant_id);
CREATE INDEX idx_suppliers_tenant ON public.suppliers USING btree (tenant_id);
CREATE INDEX idx_suppliers_type ON public.suppliers USING btree (supplier_type);
CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (tenant_id, category);
CREATE INDEX idx_system_settings_history_setting ON public.system_settings_history USING btree (setting_id);
CREATE UNIQUE INDEX idx_system_settings_tenant_key ON public.system_settings USING btree (tenant_id, key);
CREATE INDEX idx_warehouses_tenant ON public.warehouses USING btree (tenant_id);
CREATE INDEX idx_work_order_items_wo ON public.work_order_items USING btree (wo_id);
CREATE INDEX idx_work_orders_order ON public.work_orders USING btree (order_id);
CREATE INDEX idx_work_orders_po ON public.work_orders USING btree (po_id);
CREATE INDEX idx_work_orders_tenant ON public.work_orders USING btree (tenant_id);
CREATE INDEX idx_worker_skills_tenant ON public.worker_skills USING btree (tenant_id);
CREATE INDEX idx_worker_skills_worker ON public.worker_skills USING btree (worker_id);
ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT IF NOT EXISTS account_transactions_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT IF NOT EXISTS account_transactions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT IF NOT EXISTS after_sales_tickets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT IF NOT EXISTS ap_labor_fee_details_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id);
ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT IF NOT EXISTS ap_labor_fee_details_statement_id_ap_labor_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ap_labor_statements(id);
ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT IF NOT EXISTS ap_labor_fee_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT IF NOT EXISTS ap_labor_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT IF NOT EXISTS ap_labor_statements_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT IF NOT EXISTS ap_labor_statements_worker_id_users_id_fk FOREIGN KEY (worker_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_purchase_order_id_purchase_orders_id_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_purchaser_id_users_id_fk FOREIGN KEY (purchaser_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT IF NOT EXISTS ap_supplier_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT IF NOT EXISTS approval_delegations_delegatee_id_users_id_fk FOREIGN KEY (delegatee_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT IF NOT EXISTS approval_delegations_delegator_id_users_id_fk FOREIGN KEY (delegator_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT IF NOT EXISTS approval_delegations_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id);
ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT IF NOT EXISTS approval_delegations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT IF NOT EXISTS approval_flows_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT IF NOT EXISTS approval_nodes_approver_user_id_users_id_fk FOREIGN KEY (approver_user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT IF NOT EXISTS approval_nodes_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT IF NOT EXISTS approval_nodes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_approval_id_approvals_id_fk FOREIGN KEY (approval_id) REFERENCES public.approvals(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_node_id_approval_nodes_id_fk FOREIGN KEY (node_id) REFERENCES public.approval_nodes(id);
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_parent_task_id_approval_tasks_id_fk FOREIGN KEY (parent_task_id) REFERENCES public.approval_tasks(id);
ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT IF NOT EXISTS approval_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT IF NOT EXISTS approvals_current_node_id_approval_nodes_id_fk FOREIGN KEY (current_node_id) REFERENCES public.approval_nodes(id);
ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT IF NOT EXISTS approvals_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id);
ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT IF NOT EXISTS approvals_requester_id_users_id_fk FOREIGN KEY (requester_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT IF NOT EXISTS approvals_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_channel_id_market_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.market_channels(id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT IF NOT EXISTS ar_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT IF NOT EXISTS audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT IF NOT EXISTS audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_categories
    ADD CONSTRAINT IF NOT EXISTS channel_categories_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT IF NOT EXISTS channel_commissions_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);
ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT IF NOT EXISTS channel_commissions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT IF NOT EXISTS channel_commissions_settled_by_users_id_fk FOREIGN KEY (settled_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT IF NOT EXISTS channel_commissions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT IF NOT EXISTS channel_contacts_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT IF NOT EXISTS channel_contacts_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT IF NOT EXISTS channel_contacts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channel_discount_overrides
    ADD CONSTRAINT IF NOT EXISTS channel_discount_overrides_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT IF NOT EXISTS channel_settlements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channel_specific_prices
    ADD CONSTRAINT IF NOT EXISTS channel_specific_prices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT IF NOT EXISTS channels_assigned_manager_id_users_id_fk FOREIGN KEY (assigned_manager_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT IF NOT EXISTS channels_category_id_channel_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.channel_categories(id);
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT IF NOT EXISTS channels_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.channels
    ADD CONSTRAINT IF NOT EXISTS channels_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT IF NOT EXISTS commission_adjustments_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);
ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT IF NOT EXISTS commission_adjustments_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT IF NOT EXISTS commission_adjustments_original_commission_id_channel_commissio FOREIGN KEY (original_commission_id) REFERENCES public.channel_commissions(id);
ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT IF NOT EXISTS commission_adjustments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_ar_statement_id_ar_statements_id_fk FOREIGN KEY (ar_statement_id) REFERENCES public.ar_statements(id);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_channel_id_market_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.market_channels(id);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT IF NOT EXISTS commission_records_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_ar_statement_id_ar_statements_id_fk FOREIGN KEY (ar_statement_id) REFERENCES public.ar_statements(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT IF NOT EXISTS credit_notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT IF NOT EXISTS customer_addresses_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT IF NOT EXISTS customer_addresses_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT IF NOT EXISTS customer_merge_logs_operator_id_users_id_fk FOREIGN KEY (operator_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT IF NOT EXISTS customer_merge_logs_primary_customer_id_customers_id_fk FOREIGN KEY (primary_customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT IF NOT EXISTS customer_merge_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_assigned_sales_id_users_id_fk FOREIGN KEY (assigned_sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.customers
    ADD CONSTRAINT IF NOT EXISTS customers_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_ap_statement_id_ap_supplier_statements_id_fk FOREIGN KEY (ap_statement_id) REFERENCES public.ap_supplier_statements(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_purchase_order_id_purchase_orders_id_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT IF NOT EXISTS debit_notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT IF NOT EXISTS fabric_inventory_logs_fabric_inventory_id_fabric_inventory_id_f FOREIGN KEY (fabric_inventory_id) REFERENCES public.fabric_inventory(id);
ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT IF NOT EXISTS fabric_inventory_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.fabric_inventory
    ADD CONSTRAINT IF NOT EXISTS fabric_inventory_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT IF NOT EXISTS finance_accounts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.finance_configs
    ADD CONSTRAINT IF NOT EXISTS finance_configs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT IF NOT EXISTS install_items_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT IF NOT EXISTS install_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT IF NOT EXISTS install_photos_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT IF NOT EXISTS install_photos_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_dispatcher_id_users_id_fk FOREIGN KEY (dispatcher_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_installer_id_users_id_fk FOREIGN KEY (installer_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT IF NOT EXISTS install_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_from_account_id_finance_accounts_id_fk FOREIGN KEY (from_account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_from_transaction_id_account_transactions_id_ FOREIGN KEY (from_transaction_id) REFERENCES public.account_transactions(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_to_account_id_finance_accounts_id_fk FOREIGN KEY (to_account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT IF NOT EXISTS internal_transfers_to_transaction_id_account_transactions_id_fk FOREIGN KEY (to_transaction_id) REFERENCES public.account_transactions(id);
ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT IF NOT EXISTS inventory_logs_operator_id_users_id_fk FOREIGN KEY (operator_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT IF NOT EXISTS inventory_logs_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT IF NOT EXISTS inventory_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT IF NOT EXISTS inventory_logs_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);
ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT IF NOT EXISTS inventory_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT IF NOT EXISTS inventory_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT IF NOT EXISTS inventory_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);
ALTER TABLE ONLY public.labor_rates
    ADD CONSTRAINT IF NOT EXISTS labor_rates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT IF NOT EXISTS lead_activities_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT IF NOT EXISTS lead_activities_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT IF NOT EXISTS lead_activities_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT IF NOT EXISTS lead_status_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT IF NOT EXISTS lead_status_history_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT IF NOT EXISTS lead_status_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_assigned_sales_id_users_id_fk FOREIGN KEY (assigned_sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_channel_contact_id_channel_contacts_id_fk FOREIGN KEY (channel_contact_id) REFERENCES public.channel_contacts(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_referrer_customer_id_customers_id_fk FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_source_channel_id_market_channels_id_fk FOREIGN KEY (source_channel_id) REFERENCES public.market_channels(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_source_sub_id_market_channels_id_fk FOREIGN KEY (source_sub_id) REFERENCES public.market_channels(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT IF NOT EXISTS leads_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_arbitrated_by_users_id_fk FOREIGN KEY (arbitrated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_source_install_task_id_install_tasks_id_fk FOREIGN KEY (source_install_task_id) REFERENCES public.install_tasks(id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_source_purchase_order_id_purchase_orders_id_f FOREIGN KEY (source_purchase_order_id) REFERENCES public.purchase_orders(id);
ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT IF NOT EXISTS liability_notices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT IF NOT EXISTS loyalty_transactions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT IF NOT EXISTS loyalty_transactions_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT IF NOT EXISTS loyalty_transactions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT IF NOT EXISTS market_channels_auto_assign_sales_id_users_id_fk FOREIGN KEY (auto_assign_sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT IF NOT EXISTS market_channels_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT IF NOT EXISTS measure_items_sheet_id_measure_sheets_id_fk FOREIGN KEY (sheet_id) REFERENCES public.measure_sheets(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT IF NOT EXISTS measure_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT IF NOT EXISTS measure_sheets_task_id_measure_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.measure_tasks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT IF NOT EXISTS measure_sheets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT IF NOT EXISTS measure_task_splits_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT IF NOT EXISTS measure_task_splits_new_task_id_measure_tasks_id_fk FOREIGN KEY (new_task_id) REFERENCES public.measure_tasks(id);
ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT IF NOT EXISTS measure_task_splits_original_task_id_measure_tasks_id_fk FOREIGN KEY (original_task_id) REFERENCES public.measure_tasks(id);
ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT IF NOT EXISTS measure_task_splits_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_assigned_worker_id_users_id_fk FOREIGN KEY (assigned_worker_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_fee_approval_id_approvals_id_fk FOREIGN KEY (fee_approval_id) REFERENCES public.approvals(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_parent_id_measure_tasks_id_fk FOREIGN KEY (parent_id) REFERENCES public.measure_tasks(id);
ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT IF NOT EXISTS measure_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT IF NOT EXISTS notification_preferences_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT IF NOT EXISTS notification_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT IF NOT EXISTS notification_queue_template_id_notification_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.notification_templates(id);
ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT IF NOT EXISTS notification_queue_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT IF NOT EXISTS notification_queue_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT IF NOT EXISTS notification_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT IF NOT EXISTS notifications_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT IF NOT EXISTS notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT IF NOT EXISTS order_changes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT IF NOT EXISTS order_changes_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT IF NOT EXISTS order_changes_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT IF NOT EXISTS order_changes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_quote_item_id_quote_items_id_fk FOREIGN KEY (quote_item_id) REFERENCES public.quote_items(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT IF NOT EXISTS order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_channel_contact_id_channel_contacts_id_fk FOREIGN KEY (channel_contact_id) REFERENCES public.channel_contacts(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_quote_version_id_quotes_id_fk FOREIGN KEY (quote_version_id) REFERENCES public.quotes(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT IF NOT EXISTS orders_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.package_products
    ADD CONSTRAINT IF NOT EXISTS package_products_package_id_product_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.product_packages(id);
ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT IF NOT EXISTS payment_bill_items_payment_bill_id_payment_bills_id_fk FOREIGN KEY (payment_bill_id) REFERENCES public.payment_bills(id);
ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT IF NOT EXISTS payment_bill_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT IF NOT EXISTS payment_bills_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_payment_order_id_payment_orders_id_fk FOREIGN KEY (payment_order_id) REFERENCES public.payment_orders(id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_schedule_id_payment_schedules_id_fk FOREIGN KEY (schedule_id) REFERENCES public.payment_schedules(id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_statement_id_ar_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ar_statements(id);
ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT IF NOT EXISTS payment_order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT IF NOT EXISTS payment_orders_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT IF NOT EXISTS payment_schedules_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT IF NOT EXISTS payment_schedules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT IF NOT EXISTS phone_view_logs_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT IF NOT EXISTS phone_view_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT IF NOT EXISTS phone_view_logs_viewer_id_users_id_fk FOREIGN KEY (viewer_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.product_attribute_templates
    ADD CONSTRAINT IF NOT EXISTS product_attribute_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT IF NOT EXISTS product_bundle_items_bundle_id_product_bundles_id_fk FOREIGN KEY (bundle_id) REFERENCES public.product_bundles(id);
ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT IF NOT EXISTS product_bundle_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT IF NOT EXISTS product_bundles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT IF NOT EXISTS product_packages_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT IF NOT EXISTS product_price_history_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT IF NOT EXISTS product_price_history_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT IF NOT EXISTS product_price_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT IF NOT EXISTS product_suppliers_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT IF NOT EXISTS product_suppliers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT IF NOT EXISTS product_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT IF NOT EXISTS production_tasks_assigned_worker_id_users_id_fk FOREIGN KEY (assigned_worker_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT IF NOT EXISTS production_tasks_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT IF NOT EXISTS production_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT IF NOT EXISTS products_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT IF NOT EXISTS products_default_supplier_id_suppliers_id_fk FOREIGN KEY (default_supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT IF NOT EXISTS products_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT IF NOT EXISTS purchase_order_items_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);
ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT IF NOT EXISTS purchase_order_items_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT IF NOT EXISTS purchase_order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT IF NOT EXISTS purchase_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_config
    ADD CONSTRAINT IF NOT EXISTS quote_config_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT IF NOT EXISTS quote_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT IF NOT EXISTS quote_items_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT IF NOT EXISTS quote_items_room_id_quote_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.quote_rooms(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT IF NOT EXISTS quote_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT IF NOT EXISTS quote_plan_items_plan_id_quote_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.quote_plans(id);
ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT IF NOT EXISTS quote_plan_items_template_id_product_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.product_templates(id);
ALTER TABLE ONLY public.quote_plans
    ADD CONSTRAINT IF NOT EXISTS quote_plans_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_rooms_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_rooms_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT IF NOT EXISTS quote_template_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT IF NOT EXISTS quote_template_items_room_id_quote_template_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.quote_template_rooms(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT IF NOT EXISTS quote_template_items_template_id_quote_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.quote_templates(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT IF NOT EXISTS quote_template_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_template_rooms_template_id_quote_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.quote_templates(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT IF NOT EXISTS quote_template_rooms_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT IF NOT EXISTS quote_templates_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT IF NOT EXISTS quote_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT IF NOT EXISTS quotes_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_receipt_bill_id_receipt_bills_id_fk FOREIGN KEY (receipt_bill_id) REFERENCES public.receipt_bills(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_schedule_id_payment_schedules_id_fk FOREIGN KEY (schedule_id) REFERENCES public.payment_schedules(id);
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_statement_id_ar_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ar_statements(id);
ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT IF NOT EXISTS receipt_bill_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT IF NOT EXISTS receipt_bills_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT IF NOT EXISTS reconciliation_details_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id);
ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT IF NOT EXISTS reconciliation_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT IF NOT EXISTS reconciliations_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT IF NOT EXISTS reconciliations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT IF NOT EXISTS roles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT IF NOT EXISTS split_route_rules_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT IF NOT EXISTS split_route_rules_target_supplier_id_suppliers_id_fk FOREIGN KEY (target_supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT IF NOT EXISTS split_route_rules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT IF NOT EXISTS statement_confirmation_details_confirmation_id_statement_confir FOREIGN KEY (confirmation_id) REFERENCES public.statement_confirmations(id);
ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT IF NOT EXISTS statement_confirmation_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT IF NOT EXISTS statement_confirmations_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT IF NOT EXISTS statement_confirmations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT IF NOT EXISTS suppliers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT IF NOT EXISTS suppliers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.sys_dictionaries
    ADD CONSTRAINT IF NOT EXISTS sys_dictionaries_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT IF NOT EXISTS system_announcements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT IF NOT EXISTS system_announcements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT IF NOT EXISTS system_settings_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT IF NOT EXISTS system_settings_history_setting_id_system_settings_id_fk FOREIGN KEY (setting_id) REFERENCES public.system_settings(id);
ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT IF NOT EXISTS system_settings_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT IF NOT EXISTS system_settings_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT IF NOT EXISTS system_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT IF NOT EXISTS users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT IF NOT EXISTS verification_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT IF NOT EXISTS warehouses_manager_id_users_id_fk FOREIGN KEY (manager_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT IF NOT EXISTS warehouses_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT IF NOT EXISTS work_order_items_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);
ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT IF NOT EXISTS work_order_items_wo_id_work_orders_id_fk FOREIGN KEY (wo_id) REFERENCES public.work_orders(id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT IF NOT EXISTS work_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT IF NOT EXISTS worker_skills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT IF NOT EXISTS worker_skills_worker_id_users_id_fk FOREIGN KEY (worker_id) REFERENCES public.users(id);