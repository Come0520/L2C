CREATE TYPE "public"."account_category" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."accounting_period_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."finance_audit_action" AS ENUM('CREATE', 'UPDATE', 'POST', 'REVERSE', 'CLOSE_PERIOD', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."journal_entry_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'POSTED');--> statement-breakpoint
CREATE TYPE "public"."journal_source_type" AS ENUM('MANUAL', 'AUTO_RECEIPT', 'AUTO_PAYMENT', 'AUTO_ORDER', 'AUTO_PURCHASE', 'AUTO_TRANSFER', 'AUTO_EXPENSE', 'REVERSAL');--> statement-breakpoint
CREATE TABLE "accounting_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"quarter" integer NOT NULL,
	"status" "accounting_period_status" DEFAULT 'OPEN' NOT NULL,
	"closed_by" uuid,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "account_category" NOT NULL,
	"parent_id" uuid,
	"level" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_default" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period_id" uuid,
	"account_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"expense_date" date NOT NULL,
	"import_batch_id" varchar(50),
	"journal_entry_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "finance_audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"before_data" text,
	"after_data" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"voucher_no" varchar(50) NOT NULL,
	"period_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"description" text,
	"status" "journal_entry_status" DEFAULT 'DRAFT' NOT NULL,
	"source_type" "journal_source_type" DEFAULT 'MANUAL' NOT NULL,
	"source_id" uuid,
	"is_reversal" boolean DEFAULT false NOT NULL,
	"reversed_entry_id" uuid,
	"total_debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_type" "journal_source_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"debit_account_id" uuid NOT NULL,
	"credit_account_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_records" ADD CONSTRAINT "expense_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_records" ADD CONSTRAINT "expense_records_period_id_accounting_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."accounting_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_records" ADD CONSTRAINT "expense_records_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_records" ADD CONSTRAINT "expense_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_audit_logs" ADD CONSTRAINT "finance_audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_audit_logs" ADD CONSTRAINT "finance_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_period_id_accounting_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."accounting_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_templates" ADD CONSTRAINT "voucher_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_templates" ADD CONSTRAINT "voucher_templates_debit_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("debit_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_templates" ADD CONSTRAINT "voucher_templates_credit_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounting_periods_tenant" ON "accounting_periods" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_accounting_periods_ym_tenant" ON "accounting_periods" USING btree ("year","month","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_periods_status" ON "accounting_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_tenant" ON "chart_of_accounts" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chart_of_accounts_code_tenant" ON "chart_of_accounts" USING btree ("code","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_category" ON "chart_of_accounts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_chart_of_accounts_parent" ON "chart_of_accounts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_expense_records_tenant" ON "expense_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_expense_records_period" ON "expense_records" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "idx_expense_records_account" ON "expense_records" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_expense_records_date" ON "expense_records" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "idx_finance_audit_logs_tenant" ON "finance_audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_finance_audit_logs_entity" ON "finance_audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_finance_audit_logs_user" ON "finance_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_finance_audit_logs_date" ON "finance_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_tenant" ON "journal_entries" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_journal_entries_voucher_tenant" ON "journal_entries" USING btree ("voucher_no","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_period" ON "journal_entries" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_status" ON "journal_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_source" ON "journal_entries" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entries_date" ON "journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "idx_journal_entry_lines_entry" ON "journal_entry_lines" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_journal_entry_lines_account" ON "journal_entry_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_voucher_templates_tenant" ON "voucher_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_voucher_templates_source_tenant" ON "voucher_templates" USING btree ("source_type","tenant_id");