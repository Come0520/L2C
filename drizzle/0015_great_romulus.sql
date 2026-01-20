ALTER TABLE "channel_contacts" DROP CONSTRAINT "channel_contacts_channel_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "channel_contacts" ADD CONSTRAINT "channel_contacts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_changes_order" ON "order_changes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_changes_status" ON "order_changes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_sales" ON "orders" USING btree ("sales_id");--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_as_status" ON "after_sales_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_as_assigned_to" ON "after_sales_tickets" USING btree ("assigned_to");