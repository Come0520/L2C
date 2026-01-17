CREATE TABLE "approval_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"flow_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"approver_role" varchar(50),
	"approver_user_id" uuid,
	"node_type" varchar(20) DEFAULT 'APPROVAL',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"node_id" uuid,
	"approver_id" uuid,
	"status" varchar(50) DEFAULT 'PENDING',
	"comment" text,
	"action_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_approver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "flow_id" uuid;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "current_node_id" uuid;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "approval_flows" ADD CONSTRAINT "approval_flows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_nodes" ADD CONSTRAINT "approval_nodes_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_node_id_approval_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."approval_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_tasks" ADD CONSTRAINT "approval_tasks_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_flows_tenant_code" ON "approval_flows" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_approval_nodes_flow" ON "approval_nodes" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_approver" ON "approval_tasks" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "idx_approval_tasks_approval" ON "approval_tasks" USING btree ("approval_id");--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_flow_id_approval_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."approval_flows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approvals_requester" ON "approvals" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_approvals_status" ON "approvals" USING btree ("status");--> statement-breakpoint
ALTER TABLE "approvals" DROP COLUMN "approver_id";