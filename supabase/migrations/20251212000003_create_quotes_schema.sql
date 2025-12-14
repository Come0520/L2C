-- Create Quotes Schema (Separated from Sales Orders)
-- Created at: 2025-12-12

-- 1. Create Quotes Table (Main Container)
CREATE TABLE IF NOT EXISTS "public"."quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_no" character varying(50) NOT NULL, -- Unified Quote Number Prefix e.g., Q20251212001
    "lead_id" "uuid",
    "customer_id" "uuid",
    "project_name" character varying(255),
    "project_address" "text",
    "salesperson_id" "uuid",
    "current_version_id" "uuid", -- Pointer to the active/latest version
    "status" character varying(50) DEFAULT 'draft'::character varying NOT NULL, 
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotes_quote_no_key" UNIQUE ("quote_no")
);

-- Note: Foreign keys will be added at the end to avoid circular dependency issues during creation if any

-- 2. Create Quote Versions Table (Snapshots)
CREATE TABLE IF NOT EXISTS "public"."quote_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "version_suffix" character varying(10), -- e.g., "V1", "V2"
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "status" character varying(50) DEFAULT 'draft'::character varying NOT NULL, -- draft, presented, rejected, accepted
    "valid_until" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    
    CONSTRAINT "quote_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quote_versions_quote_id_version_key" UNIQUE ("quote_id", "version_number")
);

-- 3. Create Quote Items Table (Line Items per Version)
CREATE TABLE IF NOT EXISTS "public"."quote_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_version_id" "uuid" NOT NULL,
    "category" character varying(50) NOT NULL, -- Curtain, Wallcovering...
    "space" character varying(50) NOT NULL, -- Living Room, Bedroom...
    "product_name" character varying(255) NOT NULL,
    "product_id" "uuid", -- Optional link to product catalog
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "total_price" numeric DEFAULT 0 NOT NULL,
    "description" "text",
    "image_url" "text",
    "attributes" "jsonb", -- For flexible attributes like width, height, fabric color
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    
    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- 4. Add Constraints and Foreign Keys

-- Quotes FKs
ALTER TABLE "public"."quotes"
    ADD CONSTRAINT "quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;

ALTER TABLE "public"."quotes"
    ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;

ALTER TABLE "public"."quotes"
    ADD CONSTRAINT "quotes_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Quote Versions FKs
ALTER TABLE "public"."quote_versions"
    ADD CONSTRAINT "quote_versions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE CASCADE;

-- Quote Items FKs
ALTER TABLE "public"."quote_items"
    ADD CONSTRAINT "quote_items_quote_version_id_fkey" FOREIGN KEY ("quote_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE CASCADE;

-- Circular reference for current_version_id (Add after table creation)
ALTER TABLE "public"."quotes"
    ADD CONSTRAINT "quotes_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE SET NULL;


-- 5. Add Indexes
CREATE INDEX "idx_quotes_lead_id" ON "public"."quotes" USING "btree" ("lead_id");
CREATE INDEX "idx_quotes_customer_id" ON "public"."quotes" USING "btree" ("customer_id");
CREATE INDEX "idx_quotes_salesperson_id" ON "public"."quotes" USING "btree" ("salesperson_id");
CREATE INDEX "idx_quote_versions_quote_id" ON "public"."quote_versions" USING "btree" ("quote_id");
CREATE INDEX "idx_quote_items_quote_version_id" ON "public"."quote_items" USING "btree" ("quote_version_id");

-- 6. Grant Permissions (Matching existing pattern)
GRANT ALL ON TABLE "public"."quotes" TO "postgres";
GRANT ALL ON TABLE "public"."quotes" TO "service_role";
GRANT ALL ON TABLE "public"."quotes" TO "authenticated";

GRANT ALL ON TABLE "public"."quote_versions" TO "postgres";
GRANT ALL ON TABLE "public"."quote_versions" TO "service_role";
GRANT ALL ON TABLE "public"."quote_versions" TO "authenticated";

GRANT ALL ON TABLE "public"."quote_items" TO "postgres";
GRANT ALL ON TABLE "public"."quote_items" TO "service_role";
GRANT ALL ON TABLE "public"."quote_items" TO "authenticated";

-- 7. Add comments
COMMENT ON TABLE "public"."quotes" IS '报价单主表 (Quote Main Record)';
COMMENT ON TABLE "public"."quote_versions" IS '报价单版本历史 (Quote Versions Snapshot)';
COMMENT ON TABLE "public"."quote_items" IS '报价单明细项 (Quote Line Items)';
