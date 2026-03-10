ALTER TYPE "public"."ar_statement_status" ADD VALUE 'PENDING_INVOICE' BEFORE 'INVOICED';--> statement-breakpoint
ALTER TYPE "public"."ar_statement_status" ADD VALUE 'PENDING_PAYMENT' BEFORE 'PARTIAL';