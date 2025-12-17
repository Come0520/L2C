-- 线索预警功能
-- 创建时间：2025-12-11

-- 1. 获取线索预警统计的函数
-- 确保 leads 表包含所需字段
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_number') THEN
        ALTER TABLE leads ADD COLUMN lead_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'deleted_at') THEN
        ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'business_tags') THEN
        ALTER TABLE leads ADD COLUMN business_tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'measurement_completed') THEN
        ALTER TABLE leads ADD COLUMN measurement_completed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'notes') THEN
        ALTER TABLE leads ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'budget_max') THEN
        ALTER TABLE leads ADD COLUMN budget_max NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'total_quote_amount') THEN
        ALTER TABLE leads ADD COLUMN total_quote_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION get_lead_warnings()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_follow_up_stale INT;
    v_quoted_no_draft INT;
    v_measurement_overdue INT;
    v_no_follow_up_7days INT;
BEGIN
    -- 统计1: 跟踪超3天未更新
    SELECT COUNT(*) INTO v_follow_up_stale
    FROM leads
    WHERE status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
      AND updated_at < NOW() - INTERVAL '3 days'
      AND deleted_at IS NULL;
    
    -- 统计2: 报价后超7天未草签
    SELECT COUNT(*) INTO v_quoted_no_draft
    FROM leads
    WHERE 'quoted' = ANY(business_tags)
      AND status NOT IN ('DRAFT_SIGNED', 'COMPLETED', 'CANCELLED')
      AND updated_at < NOW() - INTERVAL '7 days'
      AND deleted_at IS NULL;
    
    -- 统计3: 草签后超14天未完成测量
    SELECT COUNT(*) INTO v_measurement_overdue
    FROM leads
    WHERE status = 'DRAFT_SIGNED'
      AND measurement_completed = FALSE
      AND updated_at < NOW() - INTERVAL '14 days'
      AND deleted_at IS NULL;
    
    -- 统计4: 新线索7天内无跟进记录
    SELECT COUNT(*) INTO v_no_follow_up_7days
    FROM leads l
    WHERE l.status = 'PENDING_FOLLOW_UP'
      AND l.created_at < NOW() - INTERVAL '7 days'
      AND l.deleted_at IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM lead_follow_up_records lfr
          WHERE lfr.lead_id = l.id
      );
    
    -- 构建返回结果
    result := JSONB_BUILD_OBJECT(
        'followUpStale', v_follow_up_stale,
        'quotedNoDraft', v_quoted_no_draft,
        'measurementOverdue', v_measurement_overdue,
        'noFollowUp7Days', v_no_follow_up_7days,
        'total', v_follow_up_stale + v_quoted_no_draft + v_measurement_overdue + v_no_follow_up_7days,
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. 获取需要关注的线索列表
CREATE OR REPLACE FUNCTION get_warning_leads(
    p_warning_type TEXT DEFAULT 'all',
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    lead_id UUID,
    lead_number TEXT,
    customer_name TEXT,
    phone TEXT,
    status TEXT,
    warning_type TEXT,
    days_overdue INT,
    last_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH warning_leads AS (
        -- 跟踪超期
        SELECT 
            l.id as lead_id,
            l.lead_number,
            l.name as customer_name,
            l.phone,
            l.status,
            'follow_up_stale'::TEXT as warning_type,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT as days_overdue,
            l.updated_at as last_update
        FROM leads l
        WHERE l.status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
          AND l.updated_at < NOW() - INTERVAL '3 days'
          AND l.deleted_at IS NULL
          AND (p_warning_type = 'all' OR p_warning_type = 'follow_up_stale')
        
        UNION ALL
        
        -- 报价未签约
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'quoted_no_draft'::TEXT,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT,
            l.updated_at
        FROM leads l
        WHERE 'quoted' = ANY(l.business_tags)
          AND l.status NOT IN ('DRAFT_SIGNED', 'COMPLETED', 'CANCELLED')
          AND l.updated_at < NOW() - INTERVAL '7 days'
          AND l.deleted_at IS NULL
          AND (p_warning_type = 'all' OR p_warning_type = 'quoted_no_draft')
        
        UNION ALL
        
        -- 测量超期
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'measurement_overdue'::TEXT,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT,
            l.updated_at
        FROM leads l
        WHERE l.status = 'DRAFT_SIGNED'
          AND l.measurement_completed = FALSE
          AND l.updated_at < NOW() - INTERVAL '14 days'
          AND l.deleted_at IS NULL
          AND (p_warning_type = 'all' OR p_warning_type = 'measurement_overdue')
    )
    SELECT * FROM warning_leads
    ORDER BY days_overdue DESC, last_update ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. 添加注释
COMMENT ON FUNCTION get_lead_warnings IS '获取线索预警统计（跟踪超期、报价未签、测量超期等）';
COMMENT ON FUNCTION get_warning_leads IS '获取需要关注的线索详细列表';
