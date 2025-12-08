-- Update quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS project_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id),
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'formal';

-- Update quote_versions table
ALTER TABLE quote_versions
ADD COLUMN IF NOT EXISTS quote_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Add missing columns to quote_items if needed (already created in init, but checking)
ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS space VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS width DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unit VARCHAR(20);

-- Make product_id nullable in quote_items as some items might be custom
ALTER TABLE quote_items ALTER COLUMN product_id DROP NOT NULL;
