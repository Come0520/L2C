ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);

ALTER TABLE ONLY public.labor_rates
    ADD CONSTRAINT labor_rates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_sales_id_users_id_fk FOREIGN KEY (assigned_sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_channel_contact_id_channel_contacts_id_fk FOREIGN KEY (channel_contact_id) REFERENCES public.channel_contacts(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_referrer_customer_id_customers_id_fk FOREIGN KEY (referrer_customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_source_channel_id_market_channels_id_fk FOREIGN KEY (source_channel_id) REFERENCES public.market_channels(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_source_sub_id_market_channels_id_fk FOREIGN KEY (source_sub_id) REFERENCES public.market_channels(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_arbitrated_by_users_id_fk FOREIGN KEY (arbitrated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_source_install_task_id_install_tasks_id_fk FOREIGN KEY (source_install_task_id) REFERENCES public.install_tasks(id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_source_purchase_order_id_purchase_orders_id_f FOREIGN KEY (source_purchase_order_id) REFERENCES public.purchase_orders(id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT market_channels_auto_assign_sales_id_users_id_fk FOREIGN KEY (auto_assign_sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT market_channels_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT measure_items_sheet_id_measure_sheets_id_fk FOREIGN KEY (sheet_id) REFERENCES public.measure_sheets(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT measure_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT measure_sheets_task_id_measure_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.measure_tasks(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT measure_sheets_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT measure_task_splits_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT measure_task_splits_new_task_id_measure_tasks_id_fk FOREIGN KEY (new_task_id) REFERENCES public.measure_tasks(id);

ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT measure_task_splits_original_task_id_measure_tasks_id_fk FOREIGN KEY (original_task_id) REFERENCES public.measure_tasks(id);

ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT measure_task_splits_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_assigned_worker_id_users_id_fk FOREIGN KEY (assigned_worker_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_fee_approval_id_approvals_id_fk FOREIGN KEY (fee_approval_id) REFERENCES public.approvals(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_parent_id_measure_tasks_id_fk FOREIGN KEY (parent_id) REFERENCES public.measure_tasks(id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_template_id_notification_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.notification_templates(id);

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT order_changes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT order_changes_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT order_changes_requested_by_users_id_fk FOREIGN KEY (requested_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT order_changes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_quote_item_id_quote_items_id_fk FOREIGN KEY (quote_item_id) REFERENCES public.quote_items(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_channel_contact_id_channel_contacts_id_fk FOREIGN KEY (channel_contact_id) REFERENCES public.channel_contacts(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_quote_version_id_quotes_id_fk FOREIGN KEY (quote_version_id) REFERENCES public.quotes(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.package_products
    ADD CONSTRAINT package_products_package_id_product_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.product_packages(id);

ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT payment_bill_items_payment_bill_id_payment_bills_id_fk FOREIGN KEY (payment_bill_id) REFERENCES public.payment_bills(id);

ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT payment_bill_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_recorded_by_users_id_fk FOREIGN KEY (recorded_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_payment_order_id_payment_orders_id_fk FOREIGN KEY (payment_order_id) REFERENCES public.payment_orders(id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_schedule_id_payment_schedules_id_fk FOREIGN KEY (schedule_id) REFERENCES public.payment_schedules(id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_statement_id_ar_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ar_statements(id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);