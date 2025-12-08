-- Create a generic function to log changes to the audit_logs table
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    changes jsonb;
    entity_key uuid;
BEGIN
    -- Get current user ID from Supabase auth context
    current_user_id := auth.uid();
    
    -- If no user is authenticated (e.g. service role or system event), 
    -- we capture it as NULL or you could set a specific system user UUID if preferred.

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
        
        -- Calculate changed fields only
        -- Using jsonb_diff_val (if available) or simple distinction
        -- For simplicity and standard Postgres, we'll store the NEW state or a merged diff logic
        -- Here we will just store the NEW state for simplicity in this version, 
        -- OR strictly better: store fields that changed.
        
        -- Storing simplified diff:
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

-- Trigger for orders table
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Trigger for finance_records table (if it exists, assuming usage of `finance` schema or table)
-- Based on previous context, financial records are important. 
-- Let's check table name. Assuming 'finance_records' or similar. 
-- I will add a safe check or just apply it to 'orders' first as primary goal.
-- To be safe, I'll limit to 'orders' which I know exists and is HIGH priority.
