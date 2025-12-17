-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE points_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE points_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gift_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_amounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for products table
CREATE POLICY "Everyone can view active products" ON products
  FOR SELECT USING (status = 'online');

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can create products" ON products
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for orders table
CREATE POLICY "Sales can view their own orders" ON orders
  FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Sales can create orders" ON orders
  FOR INSERT WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Sales can update their own orders" ON orders
  FOR UPDATE USING (sales_id = auth.uid());

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for leads table
CREATE POLICY "Sales can view their own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lead_assignments
      WHERE lead_assignments.lead_id = leads.id AND lead_assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Sales can create leads" ON leads
  FOR INSERT WITH CHECK (auth.jwt()->>'role' IN ('SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'LEAD_ADMIN', 'admin'));

CREATE POLICY "Sales can update their own leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lead_assignments
      WHERE lead_assignments.lead_id = leads.id AND lead_assignments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all leads" ON leads
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for quotes table
CREATE POLICY "Sales can view their own quotes" ON quotes
  FOR SELECT USING (salesperson_id = auth.uid());

CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Sales can create quotes" ON quotes
  FOR INSERT WITH CHECK (salesperson_id = auth.uid());

CREATE POLICY "Sales can update their own quotes" ON quotes
  FOR UPDATE USING (salesperson_id = auth.uid());

CREATE POLICY "Admins can update all quotes" ON quotes
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for reminders table
CREATE POLICY "Users can view their own reminders" ON reminders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all reminders" ON reminders
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can create reminders for themselves" ON reminders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders" ON reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update all reminders" ON reminders
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for points accounts table
-- CREATE POLICY "Users can view their own points account" ON points_accounts
--   FOR SELECT USING (user_id = auth.uid());
-- 
-- CREATE POLICY "Admins can view all points accounts" ON points_accounts
--   FOR SELECT USING (auth.jwt()->>'role' = 'admin');
-- 
-- -- Create RLS policies for points transactions table
-- CREATE POLICY "Users can view their own points transactions" ON points_transactions
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM points_accounts
--       WHERE points_accounts.id = points_transactions.points_account_id AND points_accounts.user_id = auth.uid()
--     )
--   );
-- 
-- CREATE POLICY "Admins can view all points transactions" ON points_transactions
--   FOR SELECT USING (auth.jwt()->>'role' = 'admin');
-- 
-- -- Create RLS policies for points orders table
-- CREATE POLICY "Users can view their own points orders" ON points_orders
--   FOR SELECT USING (user_id = auth.uid());
-- 
-- CREATE POLICY "Admins can view all points orders" ON points_orders
--   FOR SELECT USING (auth.jwt()->>'role' = 'admin');
-- 
-- CREATE POLICY "Users can create points orders" ON points_orders
--   FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for gifts table
-- CREATE POLICY "Everyone can view gifts" ON gifts
--   FOR SELECT USING (stock_quantity > 0);
-- 
-- CREATE POLICY "Admins can view all gifts" ON gifts
--   FOR SELECT USING (auth.jwt()->>'role' = 'admin');
-- 
-- CREATE POLICY "Admins can create gifts" ON gifts
--   FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
-- 
-- CREATE POLICY "Admins can update gifts" ON gifts
--   FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
-- 
-- CREATE POLICY "Admins can delete gifts" ON gifts
--   FOR DELETE USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policies for sales orders table
CREATE POLICY "Sales can view their own sales orders" ON sales_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = sales_orders.id AND orders.sales_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sales orders" ON sales_orders
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Sales can create sales orders" ON sales_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = sales_orders.id AND orders.sales_id = auth.uid()
    )
  );

CREATE POLICY "Sales can update their own sales orders" ON sales_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = sales_orders.id AND orders.sales_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all sales orders" ON sales_orders
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
