-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'measurer', 'installer', 'customer', 'partner');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'online', 'offline');

-- Create users table
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    role user_role DEFAULT 'customer',
    status user_status DEFAULT 'active',
    profile JSONB,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add username if it doesn't exist (for migration compatibility)
-- Safely add missing columns if they don't exist (for migration compatibility)
DO $$
BEGIN
    -- username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50);
        UPDATE users SET username = phone WHERE username IS NULL;
        UPDATE users SET username = id::text WHERE username IS NULL;
        ALTER TABLE users ALTER COLUMN username SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Safely add other columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
-- Handle password default if added
UPDATE users SET password = '$2b$10$DummyHashForMigrationCompatibility' WHERE password IS NULL;
-- We can't easily set NOT NULL safely here without checking, but let's try
-- ALTER TABLE users ALTER COLUMN password SET NOT NULL; -- Skipping strict constraint for now to avoid errors

ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    category_level1_id UUID NOT NULL REFERENCES product_categories(id),
    category_level2_id UUID REFERENCES product_categories(id),
    unit VARCHAR(20) NOT NULL,
    status product_status DEFAULT 'draft',
    cost_price DECIMAL(10,2) NOT NULL,
    internal_cost_price DECIMAL(10,2) NOT NULL,
    internal_settlement_price DECIMAL(10,2) NOT NULL,
    settlement_price DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    images JSONB,
    description VARCHAR(255),
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    project_address VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    sales_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create measurement orders table
CREATE TABLE IF NOT EXISTS measurement_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote items table
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote versions table
CREATE TABLE IF NOT EXISTS quote_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    version INTEGER NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gift categories table
CREATE TABLE IF NOT EXISTS gift_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES gift_categories(id),
    points INTEGER NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead followups table
CREATE TABLE IF NOT EXISTS lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead tags table
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead tag assignments table
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales order items table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales order status history table
CREATE TABLE IF NOT EXISTS sales_order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales order packages table
CREATE TABLE IF NOT EXISTS sales_order_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    package_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales order amounts table
CREATE TABLE IF NOT EXISTS sales_order_amounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL UNIQUE REFERENCES sales_orders(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package items table
CREATE TABLE IF NOT EXISTS package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clean up incompatible points tables if they exist with integer IDs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'points_accounts' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Drop tables with incompatible schema
        DROP TABLE IF EXISTS points_transactions CASCADE;
        DROP TABLE IF EXISTS points_accounts CASCADE;
        -- Also drop other related tables if they use integer IDs from that migration
        DROP TABLE IF EXISTS points_order_items CASCADE;
        DROP TABLE IF EXISTS points_orders CASCADE;
        DROP TABLE IF EXISTS points_products CASCADE;
        DROP TABLE IF EXISTS points_product_categories CASCADE;
        DROP TABLE IF EXISTS points_rules CASCADE;
    END IF;
END $$;

-- Points tables are now defined in migration 20251203000001_points_system_complete.sql
-- This ensures we use the complete schema with all required fields (total_points, available_points, frozen_points)
-- The old simplified schema below has been commented out to avoid conflicts

-- -- Create points accounts table (OLD - DO NOT USE)
-- CREATE TABLE IF NOT EXISTS points_accounts (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
--     balance INTEGER NOT NULL DEFAULT 0,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- 
-- -- Create points transactions table (OLD - DO NOT USE)
-- CREATE TABLE IF NOT EXISTS points_transactions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     points_account_id UUID NOT NULL REFERENCES points_accounts(id) ON DELETE CASCADE,
--     type VARCHAR(50) NOT NULL,
--     amount INTEGER NOT NULL,
--     balance INTEGER NOT NULL,
--     description TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- 
-- -- Create points orders table (OLD - DO NOT USE)
-- CREATE TABLE IF NOT EXISTS points_orders (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES users(id),
--     total_points INTEGER NOT NULL,
--     status VARCHAR(50) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );


-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create installation orders table
CREATE TABLE IF NOT EXISTS installation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reconciliation orders table
CREATE TABLE IF NOT EXISTS reconciliation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create measurers table
CREATE TABLE IF NOT EXISTS measurers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partner profiles table
CREATE TABLE IF NOT EXISTS partner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales order partners table
CREATE TABLE IF NOT EXISTS sales_order_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create foreign key constraints
ALTER TABLE quote_items ADD CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE quote_versions ADD CONSTRAINT fk_quote_versions_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE package_items ADD CONSTRAINT fk_package_items_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;
ALTER TABLE sales_order_packages ADD CONSTRAINT fk_sales_order_packages_package FOREIGN KEY (package_id) REFERENCES packages(id);

-- Safely add missing columns for other tables
DO $$
BEGIN
    -- products.product_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'product_code') THEN
        ALTER TABLE products ADD COLUMN product_code VARCHAR(50);
        UPDATE products SET product_code = 'PROD-' || id::text WHERE product_code IS NULL;
        ALTER TABLE products ALTER COLUMN product_code SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_product_code_key') THEN
        ALTER TABLE products ADD CONSTRAINT products_product_code_key UNIQUE (product_code);
    END IF;

    -- products.status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status product_status DEFAULT 'draft';
    END IF;

    -- orders.order_no
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_no') THEN
        ALTER TABLE orders ADD COLUMN order_no VARCHAR(50);
        UPDATE orders SET order_no = 'ORD-' || id::text WHERE order_no IS NULL;
        ALTER TABLE orders ALTER COLUMN order_no SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_no_key') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_order_no_key UNIQUE (order_no);
    END IF;

    -- orders.status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';
    END IF;

    -- sales_orders.order_no
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'order_no') THEN
        ALTER TABLE sales_orders ADD COLUMN order_no VARCHAR(50);
        UPDATE sales_orders SET order_no = 'SO-' || id::text WHERE order_no IS NULL;
        ALTER TABLE sales_orders ALTER COLUMN order_no SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_order_no_key') THEN
        ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_order_no_key UNIQUE (order_no);
    END IF;

    -- sales_orders.status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_orders' AND column_name = 'status') THEN
        ALTER TABLE sales_orders ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft';
    END IF;
    
    -- leads.phone (should exist but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') THEN
        ALTER TABLE leads ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '';
    END IF;

    -- leads.status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
        ALTER TABLE leads ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'new';
    END IF;

    -- points_accounts.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'points_accounts' AND column_name = 'user_id') THEN
        ALTER TABLE points_accounts ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'points_accounts_user_id_key') THEN
        ALTER TABLE points_accounts ADD CONSTRAINT points_accounts_user_id_key UNIQUE (user_id);
    END IF;

    -- points_transactions.points_account_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'points_transactions' AND column_name = 'points_account_id') THEN
        ALTER TABLE points_transactions ADD COLUMN points_account_id UUID REFERENCES points_accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_no ON sales_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_points_accounts_user_id ON points_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_points_account_id ON points_transactions(points_account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
