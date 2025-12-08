-- 积分系统增强: 在途积分 + 系数调节后台
-- 创建时间: 2025-12-05

-- ============================================
-- 第一部分: 补充在途积分功能
-- ============================================

-- 1. 添加在途积分字段到points_accounts表
ALTER TABLE public.points_accounts
ADD COLUMN IF NOT EXISTS pending_points INTEGER NOT NULL DEFAULT 0
CHECK (pending_points >= 0);

COMMENT ON COLUMN public.points_accounts.pending_points IS '在途积分(订单确认后,验收前)';

-- 2. 扩展积分交易类型
ALTER TYPE points_transaction_type ADD VALUE IF NOT EXISTS 'pending';  -- 转入在途
ALTER TYPE points_transaction_type ADD VALUE IF NOT EXISTS 'confirm';  -- 从在途转可用

-- 3. 创建积分转入在途函数
CREATE OR REPLACE FUNCTION public.points_to_pending(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_id UUID,
    p_description TEXT
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_transaction_id UUID;
BEGIN
    -- 获取或创建账户
    INSERT INTO public.points_accounts (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- 获取账户并加锁
    SELECT id INTO v_account_id
    FROM public.points_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 增加在途积分
    UPDATE public.points_accounts
    SET pending_points = pending_points + p_amount,
        updated_at = NOW()
    WHERE id = v_account_id;

    -- 记录交易
    INSERT INTO public.points_transactions (
        account_id, amount, type, source_type, source_id, description
    ) VALUES (
        v_account_id, p_amount, 'pending', 'sales_order', p_source_id, p_description
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.points_to_pending IS '积分转入在途状态(订单确认时调用)';

-- 4. 创建在途积分确认函数(转为可用)
CREATE OR REPLACE FUNCTION public.confirm_pending_points(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_id UUID,
    p_description TEXT DEFAULT '订单验收,在途积分转可用'
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_current_pending INTEGER;
    v_transaction_id UUID;
BEGIN
    -- 获取账户并加锁
    SELECT id, pending_points INTO v_account_id, v_current_pending
    FROM public.points_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Points account not found for user';
    END IF;

    -- 检查在途积分是否充足
    IF v_current_pending < p_amount THEN
        RAISE EXCEPTION 'Insufficient pending points: has % but need %', v_current_pending, p_amount;
    END IF;

    -- 从在途转到可用
    UPDATE public.points_accounts
    SET pending_points = pending_points - p_amount,
        available_points = available_points + p_amount,
        total_points = total_points + p_amount,
        updated_at = NOW()
    WHERE id = v_account_id;

    -- 记录交易
    INSERT INTO public.points_transactions (
        account_id, amount, type, source_type, source_id, description
    ) VALUES (
        v_account_id, p_amount, 'confirm', 'sales_order_verified', p_source_id, p_description
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.confirm_pending_points IS '确认在途积分转为可用(订单验收时调用)';

-- ============================================
-- 第二部分: 积分系数调节后台
-- ============================================

-- 1. 创建积分系数规则表
CREATE TABLE IF NOT EXISTS public.points_coefficient_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 规则识别
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 适用范围
    product_category VARCHAR(50),          -- 产品品类: 'curtain','wallpaper','wallcard'
    product_model VARCHAR(100),            -- 产品型号(可选)
    region_code VARCHAR(50),               -- 地区代码
    store_id UUID REFERENCES public.stores(id), -- 门店ID(可选)
    
    -- 系数设置
    base_coefficient DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    time_coefficient DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    final_coefficient DECIMAL(5,4) GENERATED ALWAYS AS (base_coefficient * time_coefficient) STORED,
    
    -- 生效时间
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- 审批信息
    approval_id UUID,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- 创建信息
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_coefficient CHECK (base_coefficient > 0 AND time_coefficient > 0)
);

COMMENT ON TABLE public.points_coefficient_rules IS '积分系数规则表';
COMMENT ON COLUMN public.points_coefficient_rules.status IS '状态: draft(草稿), pending_approval(待审批), approved(已批准), rejected(已拒绝), active(生效中), expired(已过期)';

-- 2. 创建积分系数审批表
CREATE TABLE IF NOT EXISTS public.points_coefficient_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 审批单信息
    approval_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    
    -- 关联规则
    rule_ids UUID[] NOT NULL,
    
    -- 多级审批流程
    status VARCHAR(20) NOT NULL DEFAULT 'pending_channel',
    
    -- 第一级审批: 渠道负责人
    channel_approver_id UUID REFERENCES auth.users(id),
    channel_approval_status VARCHAR(20),
    channel_approval_comment TEXT,
    channel_approved_at TIMESTAMPTZ,
    
    -- 第二级审批: 领导
    leader_approver_id UUID REFERENCES auth.users(id),
    leader_approval_status VARCHAR(20),
    leader_approval_comment TEXT,
    leader_approved_at TIMESTAMPTZ,
    
    -- 最终审批结果
    final_status VARCHAR(20),
    final_approved_at TIMESTAMPTZ,
    
    -- 提交人(销售负责人)
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    submitted_by_role VARCHAR(50) DEFAULT 'SALES_MANAGER',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.points_coefficient_approvals IS '积分系数调整审批表(两级审批)';
COMMENT ON COLUMN public.points_coefficient_approvals.status IS '状态: pending_channel(待渠道审批), pending_leader(待领导审批), approved(已批准), rejected(已拒绝), cancelled(已撤销)';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_coef_rules_product ON public.points_coefficient_rules(product_category, product_model);
CREATE INDEX IF NOT EXISTS idx_coef_rules_region ON public.points_coefficient_rules(region_code, store_id);
CREATE INDEX IF NOT EXISTS idx_coef_rules_time ON public.points_coefficient_rules(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_coef_rules_status ON public.points_coefficient_rules(status);

CREATE INDEX IF NOT EXISTS idx_coef_approvals_status ON public.points_coefficient_approvals(status);
CREATE INDEX IF NOT EXISTS idx_coef_approvals_channel ON public.points_coefficient_approvals(channel_approver_id);
CREATE INDEX IF NOT EXISTS idx_coef_approvals_leader ON public.points_coefficient_approvals(leader_approver_id);
CREATE INDEX IF NOT EXISTS idx_coef_approvals_submitter ON public.points_coefficient_approvals(submitted_by);

-- 4. 启用RLS
ALTER TABLE public.points_coefficient_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_coefficient_approvals ENABLE ROW LEVEL SECURITY;

-- 5. RLS策略 - 系数规则表
CREATE POLICY "Sales managers and above can view coefficient rules"
    ON public.points_coefficient_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('SALES_MANAGER', 'CHANNEL_MANAGER', 'LEAD_ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Sales managers can create rules"
    ON public.points_coefficient_rules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('SALES_MANAGER', 'SUPER_ADMIN')
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Sales managers can update their draft rules"
    ON public.points_coefficient_rules FOR UPDATE
    USING (
        created_by = auth.uid() AND status = 'draft'
    );

-- 6. RLS策略 - 审批表
CREATE POLICY "Users can view their own approval requests"
    ON public.points_coefficient_approvals FOR SELECT
    USING (submitted_by = auth.uid());

CREATE POLICY "Channel managers can view pending approvals"
    ON public.points_coefficient_approvals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('CHANNEL_MANAGER', 'SUPER_ADMIN')
        )
        AND status IN ('pending_channel', 'pending_leader', 'approved', 'rejected')
    );

CREATE POLICY "Leaders can view approvals"
    ON public.points_coefficient_approvals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('LEAD_ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Sales managers can create approvals"
    ON public.points_coefficient_approvals FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('SALES_MANAGER', 'SUPER_ADMIN')
        )
        AND submitted_by = auth.uid()
    );

CREATE POLICY "Channel managers can approve"
    ON public.points_coefficient_approvals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('CHANNEL_MANAGER', 'SUPER_ADMIN')
        )
        AND status = 'pending_channel'
    );

CREATE POLICY "Leaders can approve"
    ON public.points_coefficient_approvals FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('LEAD_ADMIN', 'SUPER_ADMIN')
        )
        AND status = 'pending_leader'
    );

-- 7. 触发器
CREATE TRIGGER update_coef_rules_updated_at
    BEFORE UPDATE ON public.points_coefficient_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coef_approvals_updated_at
    BEFORE UPDATE ON public.points_coefficient_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 完成
