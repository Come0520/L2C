-- Function to enable RLS on all tables with tenant_id and create isolation policy
CREATE OR REPLACE FUNCTION enable_rls_for_common_tables() RETURNS void AS $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'tenant_id'
        AND table_schema = 'public'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

        -- Drop existing policy if any (to allow re-running)
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);

        -- Create new policy
        -- The policy enforces that rows can only be accessed if their tenant_id matches the current setting.
        -- We cast the setting to UUID.
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I USING (tenant_id = current_setting(''app.current_tenant_id'')::uuid)', t);
        
        RAISE NOTICE 'Enabled RLS on table: %', t;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT enable_rls_for_common_tables();

-- Drop the function after use (optional, but cleaner for one-off migration)
DROP FUNCTION enable_rls_for_common_tables();
