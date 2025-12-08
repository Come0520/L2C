-- Update measurement_orders table
ALTER TABLE measurement_orders DROP CONSTRAINT IF EXISTS measurement_orders_order_id_fkey;
ALTER TABLE measurement_orders DROP CONSTRAINT IF EXISTS measurement_orders_order_id_key;

-- Rename order_id to sales_order_id if it exists, or just drop it if we want to start fresh. 
-- Since the table is likely empty or has bad data, let's just alter it.
-- But to be safe, let's check if we can rename.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'measurement_orders' AND column_name = 'order_id') THEN
        ALTER TABLE measurement_orders RENAME COLUMN order_id TO sales_order_id;
    ELSE
        ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS sales_order_id UUID;
    END IF;
END $$;

ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS quote_version_id UUID REFERENCES quote_versions(id) ON DELETE SET NULL;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS measurement_no VARCHAR(50);
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS measurer_id UUID REFERENCES users(id);
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS measurement_data JSONB;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS measurement_report_url TEXT;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS measurement_photos TEXT[];
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add foreign key for sales_order_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'measurement_orders_sales_order_id_fkey') THEN
        ALTER TABLE measurement_orders 
        ADD CONSTRAINT measurement_orders_sales_order_id_fkey 
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_measurement_orders_sales_order_id ON measurement_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_measurement_orders_quote_version_id ON measurement_orders(quote_version_id);
CREATE INDEX IF NOT EXISTS idx_measurement_orders_measurer_id ON measurement_orders(measurer_id);
CREATE INDEX IF NOT EXISTS idx_measurement_orders_status ON measurement_orders(status);
