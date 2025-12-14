-- Add RLS Policies, Triggers and Link to Sales Orders
-- Created at: 2025-12-12

-- 1. Create generic updated_at timestamp function if not exists
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() 
RETURNS "trigger" 
LANGUAGE "plpgsql" 
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Add Triggers for updated_at
CREATE TRIGGER "update_quotes_updated_at" 
BEFORE UPDATE ON "public"."quotes" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE TRIGGER "update_quote_versions_updated_at" 
BEFORE UPDATE ON "public"."quote_versions" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

-- 3. Enable RLS
ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quote_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quote_items" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Quotes
-- Admin can do everything
CREATE POLICY "quotes_admin_all" ON "public"."quotes" 
TO "authenticated" 
USING ("public"."is_admin"()) 
WITH CHECK ("public"."is_admin"());

-- Salesperson can view their own quotes
CREATE POLICY "quotes_salesperson_view" ON "public"."quotes" 
FOR SELECT 
TO "authenticated" 
USING ("salesperson_id" = "auth"."uid"());

-- Salesperson can insert their own quotes
CREATE POLICY "quotes_salesperson_insert" ON "public"."quotes" 
FOR INSERT 
TO "authenticated" 
WITH CHECK ("salesperson_id" = "auth"."uid"());

-- Salesperson can update their own quotes
CREATE POLICY "quotes_salesperson_update" ON "public"."quotes" 
FOR UPDATE 
TO "authenticated" 
USING ("salesperson_id" = "auth"."uid"())
WITH CHECK ("salesperson_id" = "auth"."uid"());

-- Salesperson can delete their own quotes
CREATE POLICY "quotes_salesperson_delete" ON "public"."quotes" 
FOR DELETE 
TO "authenticated" 
USING ("salesperson_id" = "auth"."uid"());


-- 5. RLS Policies for Quote Versions (Inherit access from Quotes)
-- Admin
CREATE POLICY "quote_versions_admin_all" ON "public"."quote_versions" 
TO "authenticated" 
USING ("public"."is_admin"()) 
WITH CHECK ("public"."is_admin"());

-- Salesperson (View/Modify via Quote ownership)
CREATE POLICY "quote_versions_salesperson_all" ON "public"."quote_versions" 
TO "authenticated" 
USING (
    EXISTS (
        SELECT 1 FROM "public"."quotes" q 
        WHERE q.id = "quote_versions"."quote_id" 
        AND q.salesperson_id = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."quotes" q 
        WHERE q.id = "quote_versions"."quote_id" 
        AND q.salesperson_id = "auth"."uid"()
    )
);


-- 6. RLS Policies for Quote Items (Inherit access from Versions -> Quotes)
-- Admin
CREATE POLICY "quote_items_admin_all" ON "public"."quote_items" 
TO "authenticated" 
USING ("public"."is_admin"()) 
WITH CHECK ("public"."is_admin"());

-- Salesperson
CREATE POLICY "quote_items_salesperson_all" ON "public"."quote_items" 
TO "authenticated" 
USING (
    EXISTS (
        SELECT 1 FROM "public"."quote_versions" qv
        JOIN "public"."quotes" q ON qv.quote_id = q.id
        WHERE qv.id = "quote_items"."quote_version_id"
        AND q.salesperson_id = "auth"."uid"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "public"."quote_versions" qv
        JOIN "public"."quotes" q ON qv.quote_id = q.id
        WHERE qv.id = "quote_items"."quote_version_id"
        AND q.salesperson_id = "auth"."uid"()
    )
);

-- 7. Add Link to Sales Orders
ALTER TABLE "public"."sales_orders" 
ADD COLUMN IF NOT EXISTS "source_quote_id" "uuid" REFERENCES "public"."quotes"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_sales_orders_source_quote_id" ON "public"."sales_orders" USING "btree" ("source_quote_id");

COMMENT ON COLUMN "public"."sales_orders"."source_quote_id" IS '关联的来源报价单ID (Linked Source Quote ID)';
