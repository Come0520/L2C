ALTER TABLE ONLY public.product_attribute_templates FORCE ROW LEVEL SECURITY;

CREATE TABLE public.product_bundle_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    bundle_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit character varying(20),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.product_bundle_items FORCE ROW LEVEL SECURITY;

CREATE TABLE public.product_bundles (
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

CREATE TABLE public.product_packages (
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

CREATE TABLE public.product_price_history (
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

CREATE TABLE public.product_suppliers (
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

CREATE TABLE public.product_templates (
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

CREATE TABLE public.production_tasks (
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

CREATE TABLE public.products (
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

CREATE TABLE public.purchase_order_items (
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

CREATE TABLE public.purchase_orders (
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

CREATE TABLE public.quote_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    entity_id uuid NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);

CREATE TABLE public.quote_items (
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

CREATE TABLE public.quote_plan_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    template_id uuid NOT NULL,
    override_price numeric(10,2),
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quote_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quote_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    quote_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    measure_room_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quote_template_items (
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

CREATE TABLE public.quote_template_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.quote_templates (
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

CREATE TABLE public.quotes (
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

CREATE TABLE public.receipt_bill_items (
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

CREATE TABLE public.receipt_bills (
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

CREATE TABLE public.reconciliation_details (
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

CREATE TABLE public.reconciliations (
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

CREATE TABLE public.roles (
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

CREATE TABLE public.split_route_rules (
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

CREATE TABLE public.statement_confirmation_details (
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

CREATE TABLE public.statement_confirmations (
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

CREATE TABLE public.suppliers (
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

CREATE TABLE public.sys_dictionaries (
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

CREATE TABLE public.system_announcements (
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

CREATE TABLE public.system_settings (
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

CREATE TABLE public.system_settings_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    setting_id uuid NOT NULL,
    key character varying(100) NOT NULL,
    old_value text,
    new_value text NOT NULL,
    changed_by uuid NOT NULL,
    changed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.tenants (
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

CREATE TABLE public.users (
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

CREATE TABLE public.verification_codes (
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

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    manager_id uuid,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.work_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wo_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    status public.work_order_item_status DEFAULT 'PENDING'::public.work_order_item_status,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.work_orders (
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

CREATE TABLE public.worker_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    worker_id uuid NOT NULL,
    skill_type public.worker_skill_type NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_transaction_no_unique UNIQUE (transaction_no);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_ticket_no_unique UNIQUE (ticket_no);

ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT ap_labor_fee_details_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT ap_labor_statements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT ap_labor_statements_statement_no_unique UNIQUE (statement_no);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_statement_no_unique UNIQUE (statement_no);

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT approval_nodes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_statement_no_unique UNIQUE (statement_no);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_categories
    ADD CONSTRAINT channel_categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT channel_commissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT channel_contacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_discount_overrides
    ADD CONSTRAINT channel_discount_overrides_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_settlement_no_unique UNIQUE (settlement_no);

ALTER TABLE ONLY public.channel_specific_prices
    ADD CONSTRAINT channel_specific_prices_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_commission_no_unique UNIQUE (commission_no);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_credit_note_no_unique UNIQUE (credit_note_no);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);