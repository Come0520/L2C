ALTER TABLE "role_overrides" ALTER COLUMN "added_permissions" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "role_overrides" ALTER COLUMN "added_permissions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "role_overrides" ALTER COLUMN "removed_permissions" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "role_overrides" ALTER COLUMN "removed_permissions" SET DEFAULT '[]'::jsonb;