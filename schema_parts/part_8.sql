ALTER TABLE ONLY public.approval_tasks
    ADD CONSTRAINT approval_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_current_node_id_approval_nodes_id_fk FOREIGN KEY (current_node_id) REFERENCES public.approval_nodes(id);

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_flow_id_approval_flows_id_fk FOREIGN KEY (flow_id) REFERENCES public.approval_flows(id);

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_requester_id_users_id_fk FOREIGN KEY (requester_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_channel_id_market_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.market_channels(id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.ar_statements
    ADD CONSTRAINT ar_statements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_categories
    ADD CONSTRAINT channel_categories_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT channel_commissions_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);

ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT channel_commissions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT channel_commissions_settled_by_users_id_fk FOREIGN KEY (settled_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_commissions
    ADD CONSTRAINT channel_commissions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT channel_contacts_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT channel_contacts_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_contacts
    ADD CONSTRAINT channel_contacts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channel_discount_overrides
    ADD CONSTRAINT channel_discount_overrides_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channel_settlements
    ADD CONSTRAINT channel_settlements_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channel_specific_prices
    ADD CONSTRAINT channel_specific_prices_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_assigned_manager_id_users_id_fk FOREIGN KEY (assigned_manager_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_category_id_channel_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.channel_categories(id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_channel_id_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.channels(id);

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_original_commission_id_channel_commissio FOREIGN KEY (original_commission_id) REFERENCES public.channel_commissions(id);

ALTER TABLE ONLY public.commission_adjustments
    ADD CONSTRAINT commission_adjustments_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_ar_statement_id_ar_statements_id_fk FOREIGN KEY (ar_statement_id) REFERENCES public.ar_statements(id);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_channel_id_market_channels_id_fk FOREIGN KEY (channel_id) REFERENCES public.market_channels(id);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.commission_records
    ADD CONSTRAINT commission_records_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_ar_statement_id_ar_statements_id_fk FOREIGN KEY (ar_statement_id) REFERENCES public.ar_statements(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT customer_merge_logs_operator_id_users_id_fk FOREIGN KEY (operator_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT customer_merge_logs_primary_customer_id_customers_id_fk FOREIGN KEY (primary_customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT customer_merge_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_assigned_sales_id_users_id_fk FOREIGN KEY (assigned_sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_ap_statement_id_ap_supplier_statements_id_fk FOREIGN KEY (ap_statement_id) REFERENCES public.ap_supplier_statements(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_purchase_order_id_purchase_orders_id_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT fabric_inventory_logs_fabric_inventory_id_fabric_inventory_id_f FOREIGN KEY (fabric_inventory_id) REFERENCES public.fabric_inventory(id);

ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT fabric_inventory_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.fabric_inventory
    ADD CONSTRAINT fabric_inventory_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.finance_configs
    ADD CONSTRAINT finance_configs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT install_items_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT install_items_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT install_photos_install_task_id_install_tasks_id_fk FOREIGN KEY (install_task_id) REFERENCES public.install_tasks(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT install_photos_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_after_sales_id_after_sales_tickets_id_fk FOREIGN KEY (after_sales_id) REFERENCES public.after_sales_tickets(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_dispatcher_id_users_id_fk FOREIGN KEY (dispatcher_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_installer_id_users_id_fk FOREIGN KEY (installer_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_sales_id_users_id_fk FOREIGN KEY (sales_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_from_account_id_finance_accounts_id_fk FOREIGN KEY (from_account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_from_transaction_id_account_transactions_id_ FOREIGN KEY (from_transaction_id) REFERENCES public.account_transactions(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_to_account_id_finance_accounts_id_fk FOREIGN KEY (to_account_id) REFERENCES public.finance_accounts(id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_to_transaction_id_account_transactions_id_fk FOREIGN KEY (to_transaction_id) REFERENCES public.account_transactions(id);

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_operator_id_users_id_fk FOREIGN KEY (operator_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);