-- Drop old points tables if they exist (from previous migrations)
-- This ensures we use the new complete schema
DROP TABLE IF EXISTS public.points_transactions CASCADE;
DROP TABLE IF EXISTS public.points_accounts CASCADE;
DROP TABLE IF EXISTS public.points_rules CASCADE;
DROP TABLE IF EXISTS public.points_orders CASCADE;
DROP TYPE IF EXISTS points_transaction_type CASCADE;
DROP TYPE IF EXISTS points_rule_type CASCADE;

-- Create points_accounts table
CREATE TABLE public.points_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,
    frozen_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT points_accounts_user_id_key UNIQUE (user_id),
    CONSTRAINT points_accounts_total_points_check CHECK (total_points >= 0),
    CONSTRAINT points_accounts_available_points_check CHECK (available_points >= 0),
    CONSTRAINT points_accounts_frozen_points_check CHECK (frozen_points >= 0)
);

-- Create points_transactions table
CREATE TYPE points_transaction_type AS ENUM ('earn', 'spend', 'freeze', 'unfreeze', 'expire', 'refund');

CREATE TABLE public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.points_accounts(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type points_transaction_type NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create points_rules table
CREATE TYPE points_rule_type AS ENUM ('fixed', 'percentage');

CREATE TABLE public.points_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type points_rule_type NOT NULL,
    value INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_points_accounts_user_id ON public.points_accounts(user_id);
CREATE INDEX idx_points_transactions_account_id ON public.points_transactions(account_id);
CREATE INDEX idx_points_transactions_created_at ON public.points_transactions(created_at);
CREATE INDEX idx_points_rules_code ON public.points_rules(code);

-- Enable Row Level Security
ALTER TABLE public.points_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- points_accounts: Users can view their own account
CREATE POLICY "Users can view their own points account"
    ON public.points_accounts FOR SELECT
    USING (auth.uid() = user_id);

-- points_transactions: Users can view their own transactions
CREATE POLICY "Users can view their own points transactions"
    ON public.points_transactions FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM public.points_accounts WHERE user_id = auth.uid()
        )
    );

-- points_rules: Everyone can view active rules
CREATE POLICY "Everyone can view active points rules"
    ON public.points_rules FOR SELECT
    USING (is_active = TRUE);

-- Admin policies (assuming admin role check exists or using service role for admin ops)
-- For simplicity, we'll allow service role full access (default) and add specific admin policies if needed later.

-- Functions

-- Function to process points transaction
CREATE OR REPLACE FUNCTION public.process_points_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_type points_transaction_type,
    p_source_type VARCHAR,
    p_source_id UUID,
    p_description TEXT
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_current_available INTEGER;
    v_current_frozen INTEGER;
    v_current_total INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Get or create account
    INSERT INTO public.points_accounts (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id, available_points, frozen_points, total_points
    INTO v_account_id, v_current_available, v_current_frozen, v_current_total
    FROM public.points_accounts
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row

    -- Validate transaction
    IF p_type = 'spend' OR p_type = 'freeze' THEN
        IF v_current_available < p_amount THEN
            RAISE EXCEPTION 'Insufficient points balance';
        END IF;
    END IF;

    IF p_type = 'unfreeze' OR p_type = 'refund' THEN
        -- Logic for unfreeze/refund might depend on specific business rules, 
        -- here we assume simple addition back to available or reduction from frozen
        NULL; 
    END IF;

    -- Update account balance based on type
    CASE p_type
        WHEN 'earn' THEN
            UPDATE public.points_accounts
            SET available_points = available_points + p_amount,
                total_points = total_points + p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
        WHEN 'spend' THEN
            UPDATE public.points_accounts
            SET available_points = available_points - p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
        WHEN 'freeze' THEN
            UPDATE public.points_accounts
            SET available_points = available_points - p_amount,
                frozen_points = frozen_points + p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
        WHEN 'unfreeze' THEN
            -- Assuming unfreeze moves points back to available (e.g. cancelled order)
            -- Or if it's 'consume frozen', that would be a different logic. 
            -- Let's assume 'unfreeze' means releasing frozen points back to available.
            IF v_current_frozen < p_amount THEN
                 RAISE EXCEPTION 'Insufficient frozen points balance';
            END IF;
            UPDATE public.points_accounts
            SET available_points = available_points + p_amount,
                frozen_points = frozen_points - p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
        WHEN 'expire' THEN
             UPDATE public.points_accounts
            SET available_points = available_points - p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
        WHEN 'refund' THEN
             UPDATE public.points_accounts
            SET available_points = available_points + p_amount,
                updated_at = NOW()
            WHERE id = v_account_id;
    END CASE;

    -- Record transaction
    INSERT INTO public.points_transactions (
        account_id, amount, type, source_type, source_id, description
    ) VALUES (
        v_account_id, p_amount, p_type, p_source_type, p_source_id, p_description
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate points based on rule
CREATE OR REPLACE FUNCTION public.calculate_points(
    p_rule_code VARCHAR,
    p_base_amount INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    v_rule RECORD;
    v_points INTEGER;
BEGIN
    SELECT * INTO v_rule
    FROM public.points_rules
    WHERE code = p_rule_code
      AND is_active = TRUE
      AND (start_time IS NULL OR start_time <= NOW())
      AND (end_time IS NULL OR end_time >= NOW());

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    IF v_rule.type = 'fixed' THEN
        v_points := v_rule.value;
    ELSIF v_rule.type = 'percentage' THEN
        v_points := FLOOR(p_base_amount * v_rule.value / 100.0);
    ELSE
        v_points := 0;
    END IF;

    RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_points_accounts_updated_at
    BEFORE UPDATE ON public.points_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_rules_updated_at
    BEFORE UPDATE ON public.points_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default rules
INSERT INTO public.points_rules (code, name, description, type, value) VALUES
('LOGIN_DAILY', '每日登录', '每日首次登录获得积分', 'fixed', 5),
('ORDER_PAYMENT', '订单支付', '订单支付金额百分比返积分', 'percentage', 10), -- 10%
('REFERRAL_REGISTER', '邀请注册', '邀请新用户注册获得积分', 'fixed', 50)
ON CONFLICT (code) DO NOTHING;
