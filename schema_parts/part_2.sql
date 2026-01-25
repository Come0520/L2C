CREATE TABLE public.approval_flows (
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

CREATE TABLE public.approval_nodes (
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

CREATE TABLE public.approval_tasks (
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

CREATE TABLE public.approvals (
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

CREATE TABLE public.ar_statements (
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

CREATE TABLE public.audit_logs (
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

CREATE TABLE public.channel_categories (
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

CREATE TABLE public.channel_commissions (
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

CREATE TABLE public.channel_contacts (
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

CREATE TABLE public.channel_discount_overrides (
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

CREATE TABLE public.channel_settlements (
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

CREATE TABLE public.channel_specific_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    special_price numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.channel_specific_prices FORCE ROW LEVEL SECURITY;

CREATE TABLE public.channels (
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

CREATE TABLE public.commission_adjustments (
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

CREATE TABLE public.commission_records (
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

CREATE TABLE public.credit_notes (
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

CREATE TABLE public.customer_addresses (
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

CREATE TABLE public.customer_merge_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    primary_customer_id uuid NOT NULL,
    merged_customer_ids uuid[] NOT NULL,
    operator_id uuid NOT NULL,
    field_conflicts jsonb,
    affected_tables text[],
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.customers (
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

CREATE TABLE public.debit_notes (
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

CREATE TABLE public.fabric_inventory (
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

CREATE TABLE public.fabric_inventory_logs (
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

CREATE TABLE public.finance_accounts (
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

CREATE TABLE public.finance_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.finance_configs FORCE ROW LEVEL SECURITY;

CREATE TABLE public.install_items (
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

CREATE TABLE public.install_photos (
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

CREATE TABLE public.install_tasks (
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

CREATE TABLE public.internal_transfers (
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

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0,
    location text,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_logs (
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

CREATE TABLE public.labor_rates (
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

CREATE TABLE public.lead_activities (
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

CREATE TABLE public.lead_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    old_status character varying(50),
    new_status character varying(50) NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    reason text
);

CREATE TABLE public.leads (
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

CREATE TABLE public.liability_notices (
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

CREATE TABLE public.loyalty_transactions (
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

CREATE TABLE public.market_channels (
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

CREATE TABLE public.measure_items (
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

CREATE TABLE public.measure_sheets (
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

CREATE TABLE public.measure_task_splits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    original_task_id uuid NOT NULL,
    new_task_id uuid NOT NULL,
    reason text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.measure_task_splits FORCE ROW LEVEL SECURITY;

CREATE TABLE public.measure_tasks (
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

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_type character varying(50) NOT NULL,
    channels jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.notification_preferences FORCE ROW LEVEL SECURITY;

CREATE TABLE public.notification_queue (
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

CREATE TABLE public.notification_templates (
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

CREATE TABLE public.notifications (
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

CREATE TABLE public.order_changes (
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

CREATE TABLE public.order_items (
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

CREATE TABLE public.orders (
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

CREATE TABLE public.package_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid NOT NULL,
    product_id uuid NOT NULL,
    is_required boolean DEFAULT false,
    min_quantity numeric(10,2),
    max_quantity numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payment_bill_items (
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

CREATE TABLE public.payment_bills (
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

CREATE TABLE public.payment_order_items (
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

CREATE TABLE public.payment_orders (
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

CREATE TABLE public.payment_schedules (
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

CREATE TABLE public.phone_view_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    viewer_id uuid NOT NULL,
    viewer_role character varying(50) NOT NULL,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.product_attribute_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    category public.product_category NOT NULL,
    template_schema jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);