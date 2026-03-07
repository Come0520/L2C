CREATE TABLE "ai_curtain_style_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" text NOT NULL,
	"thumbnail_url" text,
	"reference_image_url" text,
	"prompt_fragment" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_renderings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"original_image_url" text NOT NULL,
	"mask_data" jsonb,
	"user_notes" text,
	"fabric_source" text DEFAULT 'showroom' NOT NULL,
	"showroom_product_id" uuid,
	"custom_fabric_url" text,
	"curtain_style_id" uuid,
	"camera_angle" jsonb,
	"output_mode" text DEFAULT 'proposal' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result_image_url" text,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"parent_rendering_id" uuid,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"ai_prompt" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_renderings" ADD CONSTRAINT "ai_renderings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_renderings" ADD CONSTRAINT "ai_renderings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_renderings" ADD CONSTRAINT "ai_renderings_curtain_style_id_ai_curtain_style_templates_id_fk" FOREIGN KEY ("curtain_style_id") REFERENCES "public"."ai_curtain_style_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_renderings" ADD CONSTRAINT "ai_renderings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_renderings" ADD CONSTRAINT "ai_renderings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_curtain_style_templates_category" ON "ai_curtain_style_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ai_curtain_style_templates_active" ON "ai_curtain_style_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ai_renderings_tenant" ON "ai_renderings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ai_renderings_user" ON "ai_renderings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_renderings_status" ON "ai_renderings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_renderings_fabric_source" ON "ai_renderings" USING btree ("fabric_source");