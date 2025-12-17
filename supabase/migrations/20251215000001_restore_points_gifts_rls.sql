-- 恢复 points 和 gifts 表的 RLS 策略（幂等版）
-- 前置条件：points_accounts, points_transactions, points_rules, gifts 表必须存在
-- 创建日期: 2025-12-15

-- ============================================
-- 1. 启用 RLS
-- ============================================
ALTER TABLE points_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_coefficient_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_coefficient_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Points Accounts 策略
-- ============================================
DROP POLICY IF EXISTS "Users can view their own points account" ON points_accounts;
CREATE POLICY "Users can view their own points account" ON points_accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all points accounts" ON points_accounts;
CREATE POLICY "Admins can manage all points accounts" ON points_accounts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 3. Points Transactions 策略
-- 注意：points_transactions 通过 account_id 关联 points_accounts，
--       因此需要通过子查询检查用户权限
-- ============================================
DROP POLICY IF EXISTS "Users can view their own points transactions" ON points_transactions;
CREATE POLICY "Users can view their own points transactions" ON points_transactions
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM points_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert transactions" ON points_transactions;
CREATE POLICY "System can insert transactions" ON points_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all transactions" ON points_transactions;
CREATE POLICY "Admins can view all transactions" ON points_transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 4. Points Rules 策略
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active rules" ON points_rules;
CREATE POLICY "Anyone can view active rules" ON points_rules
    FOR SELECT TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage rules" ON points_rules;
CREATE POLICY "Admins can manage rules" ON points_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 5. Points Coefficient Rules 策略
-- ============================================
DROP POLICY IF EXISTS "Anyone can view coefficient rules" ON points_coefficient_rules;
CREATE POLICY "Anyone can view coefficient rules" ON points_coefficient_rules
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage coefficient rules" ON points_coefficient_rules;
CREATE POLICY "Admins can manage coefficient rules" ON points_coefficient_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 6. Points Coefficient Approvals 策略
-- ============================================
DROP POLICY IF EXISTS "Users can view their own approvals" ON points_coefficient_approvals;
CREATE POLICY "Users can view their own approvals" ON points_coefficient_approvals
    FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all approvals" ON points_coefficient_approvals;
CREATE POLICY "Admins can manage all approvals" ON points_coefficient_approvals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'sales_manager'))
    );

-- ============================================
-- 7. Gifts 策略
-- ============================================
DROP POLICY IF EXISTS "Anyone can view available gifts" ON gifts;
CREATE POLICY "Anyone can view available gifts" ON gifts
    FOR SELECT TO authenticated
    USING (stock_quantity > 0);

DROP POLICY IF EXISTS "Admins can view all gifts" ON gifts;
CREATE POLICY "Admins can view all gifts" ON gifts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "Admins can manage gifts" ON gifts;
CREATE POLICY "Admins can manage gifts" ON gifts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================
-- 8. 添加注释
-- ============================================
COMMENT ON POLICY "Users can view their own points account" ON points_accounts IS '用户只能查看自己的积分账户';
COMMENT ON POLICY "Admins can manage all points accounts" ON points_accounts IS '管理员可以管理所有积分账户';
COMMENT ON POLICY "Users can view their own points transactions" ON points_transactions IS '用户只能查看自己的积分交易';
COMMENT ON POLICY "Anyone can view active rules" ON points_rules IS '所有用户可以查看激活的积分规则';
COMMENT ON POLICY "Anyone can view available gifts" ON gifts IS '所有用户可以查看可兑换的礼品';
