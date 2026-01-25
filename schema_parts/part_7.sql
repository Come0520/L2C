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
    ADD CONSTRAINT account_transactions_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.account_transactions
    ADD CONSTRAINT account_transactions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.after_sales_tickets
    ADD CONSTRAINT after_sales_tickets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT ap_labor_fee_details_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id);

ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT ap_labor_fee_details_statement_id_ap_labor_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ap_labor_statements(id);

ALTER TABLE ONLY public.ap_labor_fee_details
    ADD CONSTRAINT ap_labor_fee_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT ap_labor_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT ap_labor_statements_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.ap_labor_statements
    ADD CONSTRAINT ap_labor_statements_worker_id_users_id_fk FOREIGN KEY (worker_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_purchase_order_id_purchase_orders_id_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_purchaser_id_users_id_fk FOREIGN KEY (purchaser_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.ap_supplier_statements
    ADD CONSTRAINT ap_supplier_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegatee_id_users_id_fk FOREIGN KEY (delegatee_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegator_id_users_id_fk FOREIGN KEY (delegator_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id);

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.approval_flows
    ADD CONSTRAINT approval_flows_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT approval_nodes_approver_user_id_users_id_fk FOREIGN KEY (approver_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT approval_nodes_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.approval_nodes
    ADD CONSTRAINT approval_nodes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_approval_id_approvals_id_fk FOREIGN KEY (approval_id) REFERENCES public.approvals(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_node_id_approval_nodes_id_fk FOREIGN KEY (node_id) REFERENCES public.approval_nodes(id);

ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_parent_task_id_approval_tasks_id_fk FOREIGN KEY (parent_task_id) REFERENCES public.approval_tasks(id);