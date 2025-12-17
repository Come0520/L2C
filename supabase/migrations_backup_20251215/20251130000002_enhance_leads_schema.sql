-- Enhance leads table schema to match frontend requirements

-- Add new columns to leads table
ALTER TABLE "leads" 
ADD COLUMN IF NOT EXISTS "lead_number" varchar(50),
ADD COLUMN IF NOT EXISTS "project_address" text,
ADD COLUMN IF NOT EXISTS "requirements" text[],
ADD COLUMN IF NOT EXISTS "budget_min" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "budget_max" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "customer_level" varchar(10) DEFAULT 'C',
ADD COLUMN IF NOT EXISTS "business_tags" text[],
ADD COLUMN IF NOT EXISTS "appointment_time" timestamptz,
ADD COLUMN IF NOT EXISTS "appointment_reminder" varchar(20),
ADD COLUMN IF NOT EXISTS "designer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "shopping_guide_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "construction_progress" varchar(50),
ADD COLUMN IF NOT EXISTS "expected_purchase_date" date,
ADD COLUMN IF NOT EXISTS "expected_check_in_date" date,
ADD COLUMN IF NOT EXISTS "area_size" numeric;

-- Create index for new columns
CREATE INDEX IF NOT EXISTS idx_leads_designer_id ON "leads"("designer_id");
CREATE INDEX IF NOT EXISTS idx_leads_shopping_guide_id ON "leads"("shopping_guide_id");
CREATE INDEX IF NOT EXISTS idx_leads_lead_number ON "leads"("lead_number");

-- Function to generate lead number
CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_number IS NULL THEN
    -- Format: L + YYYYMMDD + 4 digit sequence (e.g., L202511300001)
    -- This is a simple implementation, for high concurrency consider a sequence
    NEW.lead_number := 'L' || to_char(now(), 'YYYYMMDD') || lpad(cast(floor(random() * 10000) as text), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate lead number
DROP TRIGGER IF EXISTS tr_generate_lead_number ON "leads";
CREATE TRIGGER tr_generate_lead_number
BEFORE INSERT ON "leads"
FOR EACH ROW
EXECUTE FUNCTION generate_lead_number();
