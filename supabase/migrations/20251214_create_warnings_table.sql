-- 创建预警表（修复版：使用 INTEGER 类型）
CREATE TABLE IF NOT EXISTS warnings (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    action_required TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    UNIQUE(type, lead_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_warnings_lead_id ON warnings(lead_id);
CREATE INDEX IF NOT EXISTS idx_warnings_order_id ON warnings(order_id);
CREATE INDEX IF NOT EXISTS idx_warnings_resolved ON warnings(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warnings_created ON warnings(created_at DESC);

-- 启用 RLS
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有认证用户可查看未解决的预警
CREATE POLICY "Users can view unresolved warnings"
ON warnings FOR SELECT
TO authenticated
USING (resolved_at IS NULL);

-- RLS 策略：销售经理和业务经理可标记已解决
CREATE POLICY "Managers can resolve warnings"
ON warnings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' IN ('sales_manager', 'business_manager')
    )
);

-- 创建函数：标记预警已解决
CREATE OR REPLACE FUNCTION resolve_warning(warning_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE warnings
    SET 
        resolved_at = NOW(),
        resolved_by = auth.uid()
    WHERE id = warning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取未解决预警统计
CREATE OR REPLACE FUNCTION get_warning_stats()
RETURNS TABLE (
    type TEXT,
    count BIGINT,
    severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.type,
        COUNT(*)::BIGINT,
        w.severity
    FROM warnings w
    WHERE w.resolved_at IS NULL
    GROUP BY w.type, w.severity
    ORDER BY 
        CASE w.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
