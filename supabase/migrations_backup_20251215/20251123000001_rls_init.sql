-- RLS 基线策略初始化
-- 前提：使用 Supabase，JWT 中可通过 auth.uid() 取得认证用户的 UUID
-- 为了将 Supabase 用户与业务用户映射，给 users 表增加 auth_user_id (uuid)

-- 1) 用户映射列
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "auth_user_id" uuid UNIQUE;

-- 2) 辅助函数：判断当前用户是否为管理员/超管
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- 3) 启用 RLS（默认拒绝）
ALTER TABLE "users"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_follow_ups"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_assignments"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_status_logs"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_accounts"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_transactions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_products"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_exchanges"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_cache"     ENABLE ROW LEVEL SECURITY;

-- 4) Users 表策略
DROP POLICY IF EXISTS users_admin_all ON "users";
DROP POLICY IF EXISTS users_self_read ON "users";

CREATE POLICY users_admin_all ON "users"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY users_self_read ON "users"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.id = users.id
    )
    OR public.is_admin()
  );

-- 5) Leads 表策略（本人创建/分配可读，管理员全读写）
DROP POLICY IF EXISTS leads_admin_all ON "leads";
DROP POLICY IF EXISTS leads_self_read ON "leads";

CREATE POLICY leads_admin_all ON "leads"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY leads_self_read ON "leads"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          leads.assigned_to_id = u.id OR
          leads.created_by_id   = u.id
        )
    )
    OR public.is_admin()
  );

-- 6) Lead Follow Ups（自己或线索被分配人可读）
DROP POLICY IF EXISTS lead_follow_ups_admin_all ON "lead_follow_ups";
DROP POLICY IF EXISTS lead_follow_ups_self_read ON "lead_follow_ups";

CREATE POLICY lead_follow_ups_admin_all ON "lead_follow_ups"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY lead_follow_ups_self_read ON "lead_follow_ups"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          lead_follow_ups.user_id = u.id OR
          EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_follow_ups.lead_id
              AND l.assigned_to_id = u.id
          )
        )
    )
    OR public.is_admin()
  );

-- 7) Orders（客户本人或销售本人可读，管理员全读写）
DROP POLICY IF EXISTS orders_admin_all ON "orders";
DROP POLICY IF EXISTS orders_self_read ON "orders";

CREATE POLICY orders_admin_all ON "orders"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY orders_self_read ON "orders"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          orders.customer_id = u.id OR
          orders.sales_id    = u.id
        )
    )
    OR public.is_admin()
  );

-- 8) Order Items（跟随订单可读）
DROP POLICY IF EXISTS order_items_admin_all ON "order_items";
DROP POLICY IF EXISTS order_items_self_read ON "order_items";

CREATE POLICY order_items_admin_all ON "order_items"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY order_items_self_read ON "order_items"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.orders o ON o.id = order_items.order_id
      WHERE u.auth_user_id = auth.uid()
        AND (
          o.customer_id = u.id OR
          o.sales_id    = u.id
        )
    )
    OR public.is_admin()
  );

-- 9) Order Status Logs（跟随订单可读）
DROP POLICY IF EXISTS order_status_logs_admin_all ON "order_status_logs";
DROP POLICY IF EXISTS order_status_logs_self_read ON "order_status_logs";

CREATE POLICY order_status_logs_admin_all ON "order_status_logs"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY order_status_logs_self_read ON "order_status_logs"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.orders o ON o.id = order_status_logs.order_id
      WHERE u.auth_user_id = auth.uid()
        AND (
          o.customer_id = u.id OR
          o.sales_id    = u.id
        )
    )
    OR public.is_admin()
  );

-- 10) Products（所有认证用户可读，管理员可写）
DROP POLICY IF EXISTS products_admin_all ON "products";
DROP POLICY IF EXISTS products_all_read ON "products";

CREATE POLICY products_admin_all ON "products"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_all_read ON "products"
  FOR SELECT TO authenticated
  USING (true);

-- 11) Point Accounts（本人可读，管理员全读写）
DROP POLICY IF EXISTS point_accounts_admin_all ON "point_accounts";
DROP POLICY IF EXISTS point_accounts_self_read ON "point_accounts";

CREATE POLICY point_accounts_admin_all ON "point_accounts"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY point_accounts_self_read ON "point_accounts"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND point_accounts.user_id = u.id
    )
    OR public.is_admin()
  );

-- 12) Point Transactions（本人可读，管理员全读写）
DROP POLICY IF EXISTS point_transactions_admin_all ON "point_transactions";
DROP POLICY IF EXISTS point_transactions_self_read ON "point_transactions";

CREATE POLICY point_transactions_admin_all ON "point_transactions"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY point_transactions_self_read ON "point_transactions"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND point_transactions.user_id = u.id
    )
    OR public.is_admin()
  );

-- 13) Point Products（所有认证用户可读，管理员可写）
DROP POLICY IF EXISTS point_products_admin_all ON "point_products";
DROP POLICY IF EXISTS point_products_all_read ON "point_products";

CREATE POLICY point_products_admin_all ON "point_products"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY point_products_all_read ON "point_products"
  FOR SELECT TO authenticated
  USING (true);

-- 14) Point Exchanges（本人可读，管理员全读写）
DROP POLICY IF EXISTS point_exchanges_admin_all ON "point_exchanges";
DROP POLICY IF EXISTS point_exchanges_self_read ON "point_exchanges";

CREATE POLICY point_exchanges_admin_all ON "point_exchanges"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY point_exchanges_self_read ON "point_exchanges"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND point_exchanges.user_id = u.id
    )
    OR public.is_admin()
  );

-- 15) Analytics Cache（仅管理员可读写）
DROP POLICY IF EXISTS analytics_cache_admin_all ON "analytics_cache";

CREATE POLICY analytics_cache_admin_all ON "analytics_cache"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 16) Lead Assignments（关联线索可读，管理员全读写）
DROP POLICY IF EXISTS lead_assignments_admin_all ON "lead_assignments";
DROP POLICY IF EXISTS lead_assignments_self_read ON "lead_assignments";

CREATE POLICY lead_assignments_admin_all ON "lead_assignments"
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY lead_assignments_self_read ON "lead_assignments"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.leads l ON l.id = lead_assignments.lead_id
      WHERE u.auth_user_id = auth.uid()
        AND (
          l.assigned_to_id = u.id OR
          l.created_by_id   = u.id
        )
    )
    OR public.is_admin()
  );

-- 注意：非管理员写操作默认拒绝；后续可按业务状态机细化 INSERT/UPDATE/DELETE 的 WITH CHECK 条件

