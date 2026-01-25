ALTER TABLE ONLY public.customer_merge_logs
    ADD CONSTRAINT customer_merge_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_no_unique UNIQUE (customer_no);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_referral_code_unique UNIQUE (referral_code);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_wechat_openid_unique UNIQUE (wechat_openid);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_debit_note_no_unique UNIQUE (debit_note_no);

ALTER TABLE ONLY public.debit_notes
    ADD CONSTRAINT debit_notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fabric_inventory_logs
    ADD CONSTRAINT fabric_inventory_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.fabric_inventory
    ADD CONSTRAINT fabric_inventory_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.finance_configs
    ADD CONSTRAINT finance_configs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.install_items
    ADD CONSTRAINT install_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.install_photos
    ADD CONSTRAINT install_photos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.install_tasks
    ADD CONSTRAINT install_tasks_task_no_unique UNIQUE (task_no);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.internal_transfers
    ADD CONSTRAINT internal_transfers_transfer_no_unique UNIQUE (transfer_no);

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.labor_rates
    ADD CONSTRAINT labor_rates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.lead_status_history
    ADD CONSTRAINT lead_status_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_lead_no_unique UNIQUE (lead_no);

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_notice_no_unique UNIQUE (notice_no);

ALTER TABLE ONLY public.liability_notices
    ADD CONSTRAINT liability_notices_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT market_channels_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.measure_items
    ADD CONSTRAINT measure_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.measure_sheets
    ADD CONSTRAINT measure_sheets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.measure_task_splits
    ADD CONSTRAINT measure_task_splits_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_measure_no_unique UNIQUE (measure_no);

ALTER TABLE ONLY public.measure_tasks
    ADD CONSTRAINT measure_tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_changes
    ADD CONSTRAINT order_changes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_no_unique UNIQUE (order_no);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.package_products
    ADD CONSTRAINT package_products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_bill_items
    ADD CONSTRAINT payment_bill_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_payment_no_unique UNIQUE (payment_no);

ALTER TABLE ONLY public.payment_bills
    ADD CONSTRAINT payment_bills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_order_items
    ADD CONSTRAINT payment_order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_payment_no_unique UNIQUE (payment_no);

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_schedules
    ADD CONSTRAINT payment_schedules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.phone_view_logs
    ADD CONSTRAINT phone_view_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_attribute_templates
    ADD CONSTRAINT product_attribute_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_bundle_items
    ADD CONSTRAINT product_bundle_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT product_bundles_bundle_sku_unique UNIQUE (bundle_sku);

ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT product_bundles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT product_packages_package_no_unique UNIQUE (package_no);

ALTER TABLE ONLY public.product_packages
    ADD CONSTRAINT product_packages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_price_history
    ADD CONSTRAINT product_price_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_task_no_unique UNIQUE (task_no);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_no_unique UNIQUE (po_no);

ALTER TABLE ONLY public.quote_config
    ADD CONSTRAINT quote_config_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_plan_items
    ADD CONSTRAINT quote_plan_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_plans
    ADD CONSTRAINT quote_plans_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_rooms
    ADD CONSTRAINT quote_rooms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_template_items
    ADD CONSTRAINT quote_template_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_template_rooms
    ADD CONSTRAINT quote_template_rooms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quote_templates
    ADD CONSTRAINT quote_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_quote_no_unique UNIQUE (quote_no);

ALTER TABLE ONLY public.receipt_bill_items
    ADD CONSTRAINT receipt_bill_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.receipt_bills
    ADD CONSTRAINT receipt_bills_receipt_no_unique UNIQUE (receipt_no);

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT reconciliation_details_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_reconciliation_no_unique UNIQUE (reconciliation_no);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.split_route_rules
    ADD CONSTRAINT split_route_rules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.statement_confirmation_details
    ADD CONSTRAINT statement_confirmation_details_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT statement_confirmations_confirmation_no_unique UNIQUE (confirmation_no);

ALTER TABLE ONLY public.statement_confirmations
    ADD CONSTRAINT statement_confirmations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_no_unique UNIQUE (supplier_no);