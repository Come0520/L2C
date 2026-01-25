ALTER TABLE ONLY public.sys_dictionaries
    ADD CONSTRAINT sys_dictionaries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT system_announcements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT system_settings_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_code_unique UNIQUE (code);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wechat_openid_unique UNIQUE (wechat_openid);

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_wo_no_unique UNIQUE (wo_no);

ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT worker_skills_pkey PRIMARY KEY (id);

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