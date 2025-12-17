-- Update installation_orders table
-- First, drop the old foreign key to orders if it exists (referencing the wrong table)
ALTER TABLE installation_orders DROP CONSTRAINT IF EXISTS installation_orders_order_id_fkey;

-- Rename order_id to sales_order_id if it exists, or add it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installation_orders' AND column_name = 'order_id') THEN
        ALTER TABLE installation_orders RENAME COLUMN order_id TO sales_order_id;
    ELSE
        ALTER TABLE installation_orders ADD COLUMN IF NOT EXISTS sales_order_id UUID;
    END IF;
END $$;

-- Add foreign key to sales_orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'installation_orders_sales_order_id_fkey') THEN
        ALTER TABLE installation_orders 
        ADD CONSTRAINT installation_orders_sales_order_id_fkey 
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add other missing columns
ALTER TABLE installation_orders
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS installer_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS installation_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS installation_photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_installation_orders_sales_order_id ON installation_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_installation_orders_installer_id ON installation_orders(installer_id);
CREATE INDEX IF NOT EXISTS idx_installation_orders_status ON installation_orders(status);
