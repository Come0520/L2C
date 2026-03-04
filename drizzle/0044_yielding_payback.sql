ALTER TABLE "products" DROP CONSTRAINT "products_sku_unique";--> statement-breakpoint
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_quote_no_unique";--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_cust_addresses_tenant" ON "customer_addresses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quote_items_parent" ON "quote_items" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quotes_quoteno_tenant" ON "quotes" USING btree ("quote_no","tenant_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "uq_products_tenant_sku" UNIQUE("tenant_id","sku");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "idx_customers_tenant_phone" UNIQUE("tenant_id","phone");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "idx_customers_tenant_no" UNIQUE("tenant_id","customer_no");