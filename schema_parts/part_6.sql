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