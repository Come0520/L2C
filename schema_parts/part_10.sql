ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT phone_view_logs_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT phone_view_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT phone_view_logs_viewer_id_users_id_fk FOREIGN KEY (viewer_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.product_attribute_templates
    ADD CONSTRAINT product_attribute_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_bundle_id_product_bundles_id_fk FOREIGN KEY (bundle_id) REFERENCES public.product_bundles(id);

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT product_bundles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT product_packages_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_assigned_worker_id_users_id_fk FOREIGN KEY (assigned_worker_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_default_supplier_id_suppliers_id_fk FOREIGN KEY (default_supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_config
    ADD CONSTRAINT quote_config_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_room_id_quote_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.quote_rooms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT quote_plan_items_plan_id_quote_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.quote_plans(id);

ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT quote_plan_items_template_id_product_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.product_templates(id);

ALTER TABLE ONLY public.quote_plans
    ADD CONSTRAINT quote_plans_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT quote_rooms_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT quote_rooms_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT quote_template_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT quote_template_items_room_id_quote_template_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.quote_template_rooms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT quote_template_items_template_id_quote_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.quote_templates(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT quote_template_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT quote_template_rooms_template_id_quote_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.quote_templates(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT quote_template_rooms_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT quote_templates_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT quote_templates_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_approver_id_users_id_fk FOREIGN KEY (approver_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_receipt_bill_id_receipt_bills_id_fk FOREIGN KEY (receipt_bill_id) REFERENCES public.receipt_bills(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_schedule_id_payment_schedules_id_fk FOREIGN KEY (schedule_id) REFERENCES public.payment_schedules(id);

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_statement_id_ar_statements_id_fk FOREIGN KEY (statement_id) REFERENCES public.ar_statements(id);

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_account_id_finance_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT reconciliation_details_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id);

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT reconciliation_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT split_route_rules_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT split_route_rules_target_supplier_id_suppliers_id_fk FOREIGN KEY (target_supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT split_route_rules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT statement_confirmation_details_confirmation_id_statement_confir FOREIGN KEY (confirmation_id) REFERENCES public.statement_confirmations(id);

ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT statement_confirmation_details_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT statement_confirmations_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT statement_confirmations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.sys_dictionaries
    ADD CONSTRAINT sys_dictionaries_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT system_announcements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.system_announcements
    ADD CONSTRAINT system_announcements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT system_settings_history_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT system_settings_history_setting_id_system_settings_id_fk FOREIGN KEY (setting_id) REFERENCES public.system_settings(id);

ALTER TABLE ONLY public.system_settings_history
    ADD CONSTRAINT system_settings_history_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_manager_id_users_id_fk FOREIGN KEY (manager_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_wo_id_work_orders_id_fk FOREIGN KEY (wo_id) REFERENCES public.work_orders(id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_po_id_purchase_orders_id_fk FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT worker_skills_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.worker_skills
    ADD CONSTRAINT worker_skills_worker_id_users_id_fk FOREIGN KEY (worker_id) REFERENCES public.users(id);