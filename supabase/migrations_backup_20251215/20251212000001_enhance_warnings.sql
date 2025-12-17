-- 增强预警系统 - 新增4种预警类型
-- 创建时间：2025-12-12
-- 说明：扩展预警系统从4种到8种预警类型

-- 1. 更新 get_lead_warnings 函数
CREATE OR REPLACE FUNCTION get_lead_warnings()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_follow_up_stale INT := 0;
    v_quoted_no_draft INT := 0;
    v_measurement_overdue INT := 0;
    v_no_follow_up_7days INT := 0;
    -- 新增预警类型
    v_high_intent_stale INT := 0;
    v_budget_exceeded INT := 0;
    v_churn_risk INT := 0;
    v_competitor_threat INT := 0;
BEGIN
    -- 原有1: 跟踪超3天未更新
    BEGIN
        SELECT COUNT(*) INTO v_follow_up_stale
        FROM leads
        WHERE status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
          AND updated_at < NOW() - INTERVAL '3 days'
          AND (deleted_at IS NULL OR deleted_at > NOW());
    EXCEPTION WHEN OTHERS THEN
        v_follow_up_stale := 0;
    END;
    
    -- 原有2: 报价后超7天未草签
    BEGIN
        SELECT COUNT(*) INTO v_quoted_no_draft
        FROM leads
        WHERE status NOT IN ('DRAFT_SIGNED', 'COMPLETED', 'CANCELLED')
          AND updated_at < NOW() - INTERVAL '7 days'
          AND (deleted_at IS NULL OR deleted_at > NOW());
    EXCEPTION WHEN OTHERS THEN
        v_quoted_no_draft := 0;
    END;
    
    -- 原有3: 草签后超14天未完成测量
    BEGIN
        SELECT COUNT(*) INTO v_measurement_overdue
        FROM leads 
        WHERE status = 'DRAFT_SIGNED'
          AND updated_at < NOW() - INTERVAL '14 days'
          AND (deleted_at IS NULL OR deleted_at > NOW());
    EXCEPTION WHEN OTHERS THEN
        v_measurement_overdue := 0;
    END;
    
    -- 原有4: 新线索7天内无跟进
    BEGIN
        SELECT COUNT(*) INTO v_no_follow_up_7days
        FROM leads l
        WHERE l.status = 'PENDING_FOLLOW_UP'
          AND l.created_at < NOW() - INTERVAL '7 days'
          AND (l.deleted_at IS NULL OR l.deleted_at > NOW());
    EXCEPTION WHEN OTHERS THEN
        v_no_follow_up_7days := 0;
    END;
    
    -- 新增1: 高意向客户7天无跟进
    BEGIN
        SELECT COUNT(*) INTO v_high_intent_stale
        FROM leads l
        WHERE l.business_tags IS NOT NULL
          AND 'high-intent' = ANY(l.business_tags)
          AND l.deleted_at IS NULL
          AND l.updated_at < NOW() - INTERVAL '7 days';
    EXCEPTION WHEN OTHERS THEN
        v_high_intent_stale := 0;
    END;
    
    -- 新增2: 预算超标（报价金额 > 预算上限 * 1.2）
    BEGIN
        SELECT COUNT(*) INTO v_budget_exceeded
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.budget_max IS NOT NULL
          AND l.total_quote_amount IS NOT NULL
          AND l.total_quote_amount > (l.budget_max * 1.2);
    EXCEPTION WHEN OTHERS THEN
        v_budget_exceeded := 0;
    END;
    
    -- 新增3: 流失风险（根据跟进频率判断）
    BEGIN
        SELECT COUNT(DISTINCT l.id) INTO v_churn_risk
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
          AND l.updated_at < NOW() - INTERVAL '10 days'
          AND l.created_at < NOW() - INTERVAL '30 days';
    EXCEPTION WHEN OTHERS THEN
        v_churn_risk := 0;
    END;
    
    -- 新增4: 竞品威胁（备注提及竞品）
    BEGIN
        SELECT COUNT(*) INTO v_competitor_threat
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.notes IS NOT NULL
          AND (
            l.notes ILIKE '%竞品%' OR
            l.notes ILIKE '%对比%' OR  
            l.notes ILIKE '%其他品牌%' OR
            l.notes ILIKE '%价格对比%'
          );
    EXCEPTION WHEN OTHERS THEN
        v_competitor_threat := 0;
    END;
    
    -- 构建返回结果
    result := JSONB_BUILD_OBJECT(
        'followUpStale', v_follow_up_stale,
        'quotedNoDraft', v_quoted_no_draft,
        'measurementOverdue', v_measurement_overdue,
        'noFollowUp7Days', v_no_follow_up_7days,
        'highIntentStale', v_high_intent_stale,
        'budgetExceeded', v_budget_exceeded,
        'churnRisk', v_churn_risk,
        'competitorThreat', v_competitor_threat,
        'total', v_follow_up_stale + v_quoted_no_draft + v_measurement_overdue + 
                 v_no_follow_up_7days + v_high_intent_stale + v_budget_exceeded + 
                 v_churn_risk + v_competitor_threat,
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. 更新 get_warning_leads 函数（支持新预警类型）
DROP FUNCTION IF EXISTS get_warning_leads(TEXT, INT);

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
    last_update TIMESTAMP WITH TIME ZONE,
    warning_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH warning_leads AS (
        -- 原有: 跟踪超期
        SELECT 
            l.id as lead_id,
            l.lead_number,
            l.name as customer_name,
            l.phone,
            l.status,
            'follow_up_stale'::TEXT as warning_type,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT as days_overdue,
            l.updated_at as last_update,
            JSONB_BUILD_OBJECT('status', l.status) as warning_details
        FROM leads l
        WHERE l.status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
          AND l.updated_at < NOW() - INTERVAL '3 days'
          AND (l.deleted_at IS NULL OR l.deleted_at > NOW())
          AND (p_warning_type = 'all' OR p_warning_type = 'follow_up_stale')
        
        UNION ALL
        
        -- 新增: 高意向客户无跟进
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'high_intent_stale'::TEXT,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT,
            l.updated_at,
            JSONB_BUILD_OBJECT('tags', l.business_tags)
        FROM leads l
        WHERE 'high-intent' = ANY(l.business_tags)
          AND l.deleted_at IS NULL
          AND l.updated_at < NOW() - INTERVAL '7 days'
          AND (p_warning_type = 'all' OR p_warning_type = 'high_intent_stale')
        
        UNION ALL
        
        -- 新增: 预算超标
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'budget_exceeded'::TEXT,
            0 as days_overdue,
            l.updated_at,
            JSONB_BUILD_OBJECT(
                'budget_max', l.budget_max, 
                'total_quote_amount', l.total_quote_amount,
                'exceeded_ratio', ROUND((l.total_quote_amount::NUMERIC / NULLIF(l.budget_max, 0) - 1) * 100, 2)
            )
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.budget_max IS NOT NULL
          AND l.total_quote_amount IS NOT NULL
          AND l.total_quote_amount > (l.budget_max * 1.2)
          AND (p_warning_type = 'all' OR p_warning_type = 'budget_exceeded')
        
        UNION ALL
        
        -- 新增: 流失风险
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'churn_risk'::TEXT,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT,
            l.updated_at,
            JSONB_BUILD_OBJECT('created_at', l.created_at)
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.status IN ('PENDING_FOLLOW_UP', 'FOLLOWING_UP')
          AND l.updated_at < NOW() - INTERVAL '10 days'
          AND l.created_at < NOW() - INTERVAL '30 days'
          AND (p_warning_type = 'all' OR p_warning_type = 'churn_risk')
        
        UNION ALL
        
        -- 新增: 竞品威胁
        SELECT 
            l.id,
            l.lead_number,
            l.name,
            l.phone,
            l.status,
            'competitor_threat'::TEXT,
            EXTRACT(DAY FROM NOW() - l.updated_at)::INT,
            l.updated_at,
            JSONB_BUILD_OBJECT('notes_snippet', LEFT(l.notes, 100))
        FROM leads l
        WHERE l.deleted_at IS NULL
          AND l.notes IS NOT NULL
          AND (
            l.notes ILIKE '%竞品%' OR
            l.notes ILIKE '%对比%' OR
            l.notes ILIKE '%其他品牌%'
          )
          AND (p_warning_type = 'all' OR p_warning_type = 'competitor_threat')
    )
    SELECT * FROM warning_leads
    ORDER BY days_overdue DESC, last_update ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_lead_warnings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_warning_leads(TEXT, INT) TO anon, authenticated;

-- 4. 添加注释
COMMENT ON FUNCTION public.get_lead_warnings() IS '获取线索预警统计（8种预警类型）';
COMMENT ON FUNCTION public.get_warning_leads(TEXT, INT) IS '获取需要关注的线索详细列表（支持8种预警类型过滤）';
