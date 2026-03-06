CREATE TABLE "showroom_view_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"share_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"visitor_user_id" uuid,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "showroom_shares" ADD COLUMN "locked_to_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "showroom_view_logs" ADD CONSTRAINT "showroom_view_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_view_logs" ADD CONSTRAINT "showroom_view_logs_share_id_showroom_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."showroom_shares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_view_logs" ADD CONSTRAINT "showroom_view_logs_item_id_showroom_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."showroom_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showroom_view_logs" ADD CONSTRAINT "showroom_view_logs_visitor_user_id_users_id_fk" FOREIGN KEY ("visitor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_showroom_view_logs_share" ON "showroom_view_logs" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_view_logs_item" ON "showroom_view_logs" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_view_logs_visitor" ON "showroom_view_logs" USING btree ("visitor_user_id");--> statement-breakpoint
CREATE INDEX "idx_showroom_view_logs_tenant" ON "showroom_view_logs" USING btree ("tenant_id");