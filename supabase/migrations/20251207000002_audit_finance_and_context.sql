-- Modify audit_log_changes to support app.current_user_id context
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    changes jsonb;
    entity_key uuid;
    app_user_id text;
BEGIN
    -- 1. Try to get user ID from app.current_user_id setting (set via set_config)
    BEGIN
        app_user_id := current_setting('app.current_user_id', true);
    EXCEPTION WHEN OTHERS THEN
        app_user_id := NULL;
    END;

    -- 2. Validate and cast app_user_id
    IF app_user_id IS NOT NULL AND app_user_id != '' THEN
        BEGIN
            current_user_id := app_user_id::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            -- Fallback to auth.uid() if invalid UUID
            current_user_id := auth.uid();
        END;
    ELSE
        -- 3. Fallback to Supabase Auth context
        current_user_id := auth.uid();
    END IF;

    -- 4. Process the change
    IF (TG_OP = 'DELETE') THEN
        entity_key := OLD.id;
        changes := to_jsonb(OLD);
        
        INSERT INTO public.audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            current_user_id,
            'DELETE',
            TG_TABLE_NAME,
            entity_key,
            changes,
            now()
        );
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        entity_key := NEW.id;
        
        -- Calculate changed fields
        SELECT jsonb_object_agg(key, value) INTO changes
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(OLD)->key IS DISTINCT FROM value;
        
        -- Only insert if there are actual changes
        IF changes IS NOT NULL AND changes != '{}'::jsonb THEN
            INSERT INTO public.audit_logs (
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at
            ) VALUES (
                current_user_id,
                'UPDATE',
                TG_TABLE_NAME,
                entity_key,
                changes,
                now()
            );
        END IF;
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        entity_key := NEW.id;
        changes := to_jsonb(NEW);
        
        INSERT INTO public.audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            current_user_id,
            'INSERT',
            TG_TABLE_NAME,
            entity_key,
            changes,
            now()
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set audit context (can be called via RPC)
CREATE OR REPLACE FUNCTION set_audit_context(p_user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::text, true); -- true = is_local (transaction scoped)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for reconciliation_orders (Finance)
DROP TRIGGER IF EXISTS audit_reconciliation_orders_trigger ON public.reconciliation_orders;
CREATE TRIGGER audit_reconciliation_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reconciliation_orders
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Add trigger for sales_order_amounts (Finance related)
DROP TRIGGER IF EXISTS audit_sales_order_amounts_trigger ON public.sales_order_amounts;
CREATE TRIGGER audit_sales_order_amounts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_amounts
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Re-apply trigger for orders (to ensure it uses updated function)
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
