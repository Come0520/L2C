-- 线索分配历史表和相关功能（修正版）
-- 创建时间：2025-12-11
-- 修正：使用 BIGINT 类型匹配 leads 表的 id 类型

-- 1. 创建线索分配历史表
CREATE TABLE IF NOT EXISTS lead_assignments (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    assignment_method VARCHAR(20) DEFAULT 'manual',
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 创建线索合并历史表
CREATE TABLE IF NOT EXISTS lead_merge_history (
    id BIGSERIAL PRIMARY KEY,
    primary_lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    duplicate_lead_ids BIGINT[] NOT NULL,
    merged_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to_id ON lead_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_created_at ON lead_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_merge_history_primary_lead_id ON lead_merge_history(primary_lead_id);

-- 4. 查找重复线索的函数（按手机号）
CREATE OR REPLACE FUNCTION find_duplicate_leads_by_phone(p_limit INT DEFAULT 1000)
RETURNS TABLE (
    phone TEXT,
    lead_ids BIGINT[],
    lead_count INT,
    latest_created_at TIMESTAMPTZ,
    lead_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.phone,
        ARRAY_AGG(l.id ORDER BY l.created_at DESC) as lead_ids,
        COUNT(*)::INT as lead_count,
        MAX(l.created_at) as latest_created_at,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', l.id,
                'name', l.name,
                'phone', l.phone,
                'project_address', l.project_address,
                'lead_number', l.lead_number,
                'created_at', l.created_at,
                'status', l.status
            ) ORDER BY l.created_at DESC
        ) as lead_details
    FROM leads l
    WHERE l.deleted_at IS NULL
      AND l.phone IS NOT NULL
      AND l.phone != ''
    GROUP BY l.phone
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, MAX(l.created_at) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. 合并线索的函数
CREATE OR REPLACE FUNCTION merge_leads(
    p_primary_id BIGINT,
    p_duplicate_ids BIGINT[],
    p_merged_by_id BIGINT,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_affected_records INT := 0;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM leads WHERE id = p_primary_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Primary lead % does not exist or is deleted', p_primary_id;
    END IF;
    
    IF p_primary_id = ANY(p_duplicate_ids) THEN
        RAISE EXCEPTION 'Primary lead cannot be in duplicate list';
    END IF;
    
    UPDATE lead_follow_up_records 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_affected_records = ROW_COUNT;
    
    UPDATE lead_quote_records 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE lead_measurement_records 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE lead_installation_records 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE lead_attachment_records 
    SET lead_id = p_primary_id, uploaded_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE lead_approval_records 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE lead_tag_assignments 
    SET lead_id = p_primary_id, assigned_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids)
      AND NOT EXISTS (
          SELECT 1 FROM lead_tag_assignments 
          WHERE lead_id = p_primary_id AND tag_id = lead_tag_assignments.tag_id
      );
    
    UPDATE lead_assignments 
    SET lead_id = p_primary_id, updated_at = NOW()
    WHERE lead_id = ANY(p_duplicate_ids);
    
    UPDATE leads 
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ANY(p_duplicate_ids) AND deleted_at IS NULL;
    
    INSERT INTO lead_merge_history (
        primary_lead_id, duplicate_lead_ids, merged_by_id, merged_at, notes
    ) VALUES (
        p_primary_id, p_duplicate_ids, p_merged_by_id, NOW(), p_notes
    );
    
    v_result := JSONB_BUILD_OBJECT(
        'success', true,
        'primary_lead_id', p_primary_id,
        'merged_count', ARRAY_LENGTH(p_duplicate_ids, 1),
        'duplicate_ids', p_duplicate_ids
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Merge failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE lead_assignments IS '线索分配历史记录表';
COMMENT ON TABLE lead_merge_history IS '线索合并历史记录表';
COMMENT ON FUNCTION find_duplicate_leads_by_phone IS '查找重复线索（按手机号分组）';
COMMENT ON FUNCTION merge_leads IS '合并重复线索到主线索';
