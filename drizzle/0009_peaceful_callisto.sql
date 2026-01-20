CREATE TYPE "public"."approval_node_mode" AS ENUM('ANY', 'ALL', 'MAJORITY');--> statement-breakpoint
CREATE TYPE "public"."approval_timeout_action" AS ENUM('REMIND', 'AUTO_PASS', 'AUTO_REJECT');--> statement-breakpoint
CREATE TYPE "public"."approver_role" AS ENUM('STORE_MANAGER', 'ADMIN', 'FINANCE', 'PURCHASING', 'DISPATCHER');--> statement-breakpoint
CREATE TYPE "public"."delegation_type" AS ENUM('GLOBAL', 'FLOW');--> statement-breakpoint
CREATE TABLE "approval_delegations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delegator_id" uuid NOT NULL,
	"delegatee_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'GLOBAL',
	"flow_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
DROP TYPE "public"."notification_channel";--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'SMS', 'WECHAT', 'WECHAT_MINI', 'LARK', 'SYSTEM');--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "approver_mode" varchar(20) DEFAULT 'ANY';--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "timeout_hours" integer;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD COLUMN "timeout_action" varchar(20) DEFAULT 'REMIND';--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegator_id_users_id_fk" FOREIGN KEY ("delegator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegatee_id_users_id_fk" FOREIGN KEY ("delegatee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_config" ADD CONSTRAINT "quote_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_delegator" ON "approval_delegations" USING btree ("delegator_id");--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_delegatee" ON "approval_delegations" USING btree ("delegatee_id");--> statement-breakpoint
CREATE INDEX "idx_approval_delegations_active" ON "approval_delegations" USING btree ("is_active");