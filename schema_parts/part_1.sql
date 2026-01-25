CREATE SCHEMA drizzle;

CREATE TYPE public.after_sales_status AS ENUM (
    'PENDING',
    'INVESTIGATING',
    'PROCESSING',
    'PENDING_VISIT',
    'PENDING_CALLBACK',
    'PENDING_VERIFY',
    'CLOSED',
    'REJECTED'
);

CREATE TYPE public.approval_node_mode AS ENUM (
    'ANY',
    'ALL',
    'MAJORITY'
);

CREATE TYPE public.approval_timeout_action AS ENUM (
    'REMIND',
    'AUTO_PASS',
    'AUTO_REJECT'
);

CREATE TYPE public.approver_role AS ENUM (
    'STORE_MANAGER',
    'ADMIN',
    'FINANCE',
    'PURCHASING',
    'DISPATCHER'
);

CREATE TYPE public.ar_statement_status AS ENUM (
    'PENDING_RECON',
    'RECONCILED',
    'INVOICED',
    'PARTIAL',
    'PAID',
    'PENDING_DELIVER',
    'COMPLETED',
    'BAD_DEBT'
);

CREATE TYPE public.bill_status AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'PAID',
    'REJECTED',
    'CANCELLED'
);

CREATE TYPE public.change_request_status AS ENUM (
    'PENDING',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);

CREATE TYPE public.change_request_type AS ENUM (
    'FIELD_CHANGE',
    'CUSTOMER_CHANGE',
    'STOCK_OUT',
    'OTHER'
);

CREATE TYPE public.channel_category AS ENUM (
    'ONLINE',
    'OFFLINE',
    'REFERRAL'
);

CREATE TYPE public.channel_level AS ENUM (
    'S',
    'A',
    'B',
    'C'
);

CREATE TYPE public.channel_settlement_type AS ENUM (
    'PREPAY',
    'MONTHLY'
);

CREATE TYPE public.channel_status AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED'
);

CREATE TYPE public.channel_type AS ENUM (
    'DECORATION_CO',
    'DESIGNER',
    'CROSS_INDUSTRY',
    'DOUYIN',
    'XIAOHONGSHU',
    'STORE',
    'OTHER'
);

CREATE TYPE public.commission_status AS ENUM (
    'PENDING',
    'CALCULATED',
    'PAID'
);

CREATE TYPE public.commission_trigger_mode AS ENUM (
    'ORDER_CREATED',
    'ORDER_COMPLETED',
    'PAYMENT_COMPLETED'
);

CREATE TYPE public.commission_type AS ENUM (
    'FIXED',
    'TIERED'
);

CREATE TYPE public.cooperation_mode AS ENUM (
    'BASE_PRICE',
    'COMMISSION'
);

CREATE TYPE public.customer_level AS ENUM (
    'A',
    'B',
    'C',
    'D'
);

CREATE TYPE public.customer_lifecycle_stage AS ENUM (
    'LEAD',
    'OPPORTUNITY',
    'SIGNED',
    'DELIVERED',
    'LOST'
);

CREATE TYPE public.customer_pipeline_status AS ENUM (
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

CREATE TYPE public.customer_type AS ENUM (
    'INDIVIDUAL',
    'COMPANY',
    'DESIGNER',
    'PARTNER'
);

CREATE TYPE public.decoration_progress AS ENUM (
    'WATER_ELECTRIC',
    'MUD_WOOD',
    'INSTALLATION',
    'PAINTING',
    'COMPLETED'
);

CREATE TYPE public.delegation_type AS ENUM (
    'GLOBAL',
    'FLOW'
);

CREATE TYPE public.fabric_inventory_log_type AS ENUM (
    'PURCHASE_IN',
    'PROCESSING_OUT',
    'ADJUSTMENT',
    'RETURN'
);

CREATE TYPE public.fee_check_status AS ENUM (
    'NONE',
    'PENDING',
    'PAID',
    'WAIVED',
    'REFUNDED'
);

CREATE TYPE public.header_process_type AS ENUM (
    'HOOK',
    'PUNCH',
    'FIXED_PLEAT'
);

CREATE TYPE public.install_item_issue_category AS ENUM (
    'NONE',
    'MISSING',
    'DAMAGED',
    'WRONG_SIZE'
);

CREATE TYPE public.install_photo_type AS ENUM (
    'BEFORE',
    'AFTER',
    'DETAIL'
);

CREATE TYPE public.install_task_category AS ENUM (
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'OTHER'
);

CREATE TYPE public.install_task_source_type AS ENUM (
    'ORDER',
    'AFTER_SALES',
    'REWORK'
);

CREATE TYPE public.install_task_status AS ENUM (
    'PENDING_DISPATCH',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE public.install_type AS ENUM (
    'TOP',
    'SIDE'
);

CREATE TYPE public.intention_level AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);

CREATE TYPE public.inventory_log_type AS ENUM (
    'IN',
    'OUT',
    'ADJUST',
    'TRANSFER'
);

CREATE TYPE public.labor_category AS ENUM (
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'WALLPANEL',
    'MEASURE_LEAD',
    'MEASURE_PRECISE',
    'OTHER'
);

CREATE TYPE public.labor_rate_entity_type AS ENUM (
    'TENANT',
    'WORKER'
);

CREATE TYPE public.labor_unit_type AS ENUM (
    'WINDOW',
    'SQUARE_METER',
    'FIXED'
);

CREATE TYPE public.lead_activity_type AS ENUM (
    'PHONE_CALL',
    'WECHAT_CHAT',
    'STORE_VISIT',
    'HOME_VISIT',
    'QUOTE_SENT',
    'SYSTEM'
);

CREATE TYPE public.lead_status AS ENUM (
    'PENDING_ASSIGNMENT',
    'PENDING_FOLLOWUP',
    'FOLLOWING_UP',
    'INVALID',
    'WON',
    'VOID'
);

CREATE TYPE public.liability_reason_category AS ENUM (
    'PRODUCTION_QUALITY',
    'CONSTRUCTION_ERROR',
    'DATA_ERROR',
    'SALES_ERROR',
    'LOGISTICS_ISSUE',
    'CUSTOMER_REASON'
);

CREATE TYPE public.liability_status AS ENUM (
    'DRAFT',
    'PENDING_CONFIRM',
    'CONFIRMED',
    'DISPUTED',
    'ARBITRATED'
);

CREATE TYPE public.liable_party_type AS ENUM (
    'COMPANY',
    'FACTORY',
    'INSTALLER',
    'MEASURER',
    'LOGISTICS',
    'CUSTOMER'
);

CREATE TYPE public.measure_sheet_status AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'ARCHIVED'
);

CREATE TYPE public.measure_task_status AS ENUM (
    'PENDING_APPROVAL',
    'PENDING',
    'DISPATCHING',
    'PENDING_VISIT',
    'PENDING_CONFIRM',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE public.measure_type AS ENUM (
    'QUOTE_BASED',
    'BLIND',
    'SALES_SELF'
);

CREATE TYPE public.notification_channel AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS',
    'WECHAT',
    'WECHAT_MINI',
    'LARK',
    'SYSTEM'
);

CREATE TYPE public.notification_type_enum AS ENUM (
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

CREATE TYPE public.order_item_status AS ENUM (
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

CREATE TYPE public.order_settlement_type AS ENUM (
    'PREPAID',
    'CREDIT',
    'CASH'
);

CREATE TYPE public.order_status AS ENUM (
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

CREATE TYPE public.package_overflow_mode AS ENUM (
    'FIXED_PRICE',
    'IGNORE',
    'ORIGINAL',
    'DISCOUNT'
);

CREATE TYPE public.package_type AS ENUM (
    'QUANTITY',
    'COMBO',
    'CATEGORY',
    'TIME_LIMITED'
);

CREATE TYPE public.payment_method AS ENUM (
    'CASH',
    'WECHAT',
    'ALIPAY',
    'BANK'
);

CREATE TYPE public.payment_schedule_status AS ENUM (
    'PENDING',
    'PAID'
);

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID'
);

CREATE TYPE public.po_fabric_status AS ENUM (
    'DRAFT',
    'IN_PRODUCTION',
    'DELIVERED',
    'STOCKED',
    'CANCELLED'
);

CREATE TYPE public.po_finished_status AS ENUM (
    'DRAFT',
    'IN_PRODUCTION',
    'READY',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE public.po_type AS ENUM (
    'FINISHED',
    'FABRIC',
    'STOCK'
);

CREATE TYPE public.product_category AS ENUM (
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

CREATE TYPE public.product_type AS ENUM (
    'FINISHED',
    'CUSTOM'
);

CREATE TYPE public.purchase_order_status AS ENUM (
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

CREATE TYPE public.quote_plan_type AS ENUM (
    'ECONOMIC',
    'COMFORT',
    'LUXURY'
);

CREATE TYPE public.quote_status AS ENUM (
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

CREATE TYPE public.room_type AS ENUM (
    'LIVING_ROOM',
    'BEDROOM',
    'DINING_ROOM',
    'STUDY',
    'BALCONY',
    'BATHROOM',
    'KITCHEN',
    'OTHER'
);

CREATE TYPE public.settlement_type AS ENUM (
    'CASH',
    'TRANSFER'
);

CREATE TYPE public.supplier_type AS ENUM (
    'SUPPLIER',
    'PROCESSOR',
    'BOTH'
);

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'SALES',
    'MANAGER',
    'WORKER',
    'FINANCE',
    'SUPPLY'
);

CREATE TYPE public.verification_code_type AS ENUM (
    'LOGIN_MFA',
    'PASSWORD_RESET',
    'BIND_PHONE'
);

CREATE TYPE public.wall_material AS ENUM (
    'CONCRETE',
    'WOOD',
    'GYPSUM'
);

CREATE TYPE public.window_type AS ENUM (
    'STRAIGHT',
    'L_SHAPE',
    'U_SHAPE',
    'ARC'
);

CREATE TYPE public.work_order_item_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE public.work_order_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE public.worker_skill_type AS ENUM (
    'MEASURE_CURTAIN',
    'INSTALL_CURTAIN',
    'MEASURE_WALLCLOTH',
    'INSTALL_WALLCLOTH',
    'MEASURE_WALLPANEL',
    'INSTALL_WALLPANEL'
);

CREATE TABLE drizzle.__drizzle_migrations (
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

CREATE TABLE public.account_transactions (
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

CREATE TABLE public.after_sales_tickets (
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

CREATE TABLE public.ap_labor_fee_details (
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

CREATE TABLE public.ap_labor_statements (
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

CREATE TABLE public.ap_supplier_statements (
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

CREATE TABLE public.approval_delegations (
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