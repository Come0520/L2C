-- Create approval_timeout_config table
CREATE TABLE IF NOT EXISTS "public"."approval_timeout_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "step_id" "uuid" NOT NULL REFERENCES "public"."approval_steps"("id") ON DELETE CASCADE,
    "timeout_hours" integer NOT NULL CHECK (timeout_hours > 0),
    "action" character varying(50) NOT NULL CHECK (action IN ('auto_approve', 'auto_reject', 'escalate')),
    "escalate_to_role" character varying(50),
    "escalate_to_user_id" "uuid" REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "approval_timeout_config_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "approval_timeout_config_step_id_key" UNIQUE ("step_id")
);

-- Enable RLS
ALTER TABLE "public"."approval_timeout_config" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "timeout_config_admin_all" ON "public"."approval_timeout_config"
    TO "authenticated"
    USING ("public"."is_admin"())
    WITH CHECK ("public"."is_admin"());

CREATE POLICY "timeout_config_read_all" ON "public"."approval_timeout_config"
    FOR SELECT TO "authenticated"
    USING (true);

-- Add columns to approval_requests to support timeout and escalation
ALTER TABLE "public"."approval_requests" 
ADD COLUMN IF NOT EXISTS "step_started_at" timestamp with time zone DEFAULT "now"(),
ADD COLUMN IF NOT EXISTS "current_approver_override_role" character varying(50),
ADD COLUMN IF NOT EXISTS "current_approver_override_user_id" "uuid" REFERENCES "public"."users"("id");

-- Allow system actions (NULL actor_id) in approval_actions
ALTER TABLE "public"."approval_actions" ALTER COLUMN "actor_id" DROP NOT NULL;

-- Function to update step_started_at when step changes
CREATE OR REPLACE FUNCTION "public"."update_approval_step_started_at"()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.current_step_order IS DISTINCT FROM NEW.current_step_order) THEN
        NEW.step_started_at = now();
        -- Reset overrides when step changes
        NEW.current_approver_override_role = NULL;
        NEW.current_approver_override_user_id = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for step_started_at
DROP TRIGGER IF EXISTS "update_approval_step_started_at_trigger" ON "public"."approval_requests";
CREATE TRIGGER "update_approval_step_started_at_trigger"
    BEFORE INSERT OR UPDATE OF "current_step_order"
    ON "public"."approval_requests"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_approval_step_started_at"();

-- Function to process timeouts (to be called by Cron/Edge Function)
CREATE OR REPLACE FUNCTION "public"."process_approval_timeouts"()
RETURNS "jsonb" AS $$
DECLARE
    v_processed_count integer := 0;
    v_request record;
    v_config record;
    v_action_result jsonb;
    v_actor_id uuid;
BEGIN
    v_actor_id := auth.uid(); -- Might be NULL if system/cron

    FOR v_request IN 
        SELECT 
            ar.id, 
            ar.flow_id, 
            ar.current_step_order, 
            ar.step_started_at,
            ar.entity_type,
            ar.entity_id,
            ar.requester_id,
            s.id as step_id
        FROM "public"."approval_requests" ar
        JOIN "public"."approval_steps" s ON s.flow_id = ar.flow_id AND s.step_order = ar.current_step_order
        WHERE ar.status = 'pending'
    LOOP
        -- Check if config exists for this step
        SELECT * INTO v_config FROM "public"."approval_timeout_config" WHERE step_id = v_request.step_id;
        
        IF FOUND THEN
            -- Check timeout
            IF v_request.step_started_at + (v_config.timeout_hours || ' hours')::interval < now() THEN
                -- Timed out! Perform action
                IF v_config.action = 'escalate' THEN
                    UPDATE "public"."approval_requests"
                    SET 
                        current_approver_override_role = v_config.escalate_to_role,
                        current_approver_override_user_id = v_config.escalate_to_user_id,
                        updated_at = now()
                    WHERE id = v_request.id;
                    
                    -- Log action
                    INSERT INTO "public"."approval_actions" (request_id, step_order, actor_id, action, comment)
                    VALUES (
                        v_request.id, 
                        v_request.current_step_order, 
                        v_actor_id,
                        'escalate', 
                        'Automatically escalated due to timeout'
                    );

                    -- Notify requester
                    INSERT INTO "public"."notifications" (user_id, title, content)
                    VALUES (
                        v_request.requester_id,
                        '审批请求已升级',
                        '您的 ' || v_request.entity_type || ' 审批请求已因超时自动升级处理。'
                    );
                     
                    v_processed_count := v_processed_count + 1;
                    
                ELSIF v_config.action = 'auto_approve' THEN
                    -- Placeholder for auto-approve logic
                    RAISE NOTICE 'Auto-approve logic triggered for request %', v_request.id;
                    
                ELSIF v_config.action = 'auto_reject' THEN
                    UPDATE "public"."approval_requests"
                    SET status = 'rejected', updated_at = now()
                    WHERE id = v_request.id;
                    
                    INSERT INTO "public"."approval_actions" (request_id, step_order, actor_id, action, comment)
                    VALUES (
                        v_request.id, 
                        v_request.current_step_order, 
                        v_actor_id,
                        'reject', 
                        'Automatically rejected due to timeout'
                    );

                    -- Notify requester
                    INSERT INTO "public"."notifications" (user_id, title, content)
                    VALUES (
                        v_request.requester_id,
                        '审批请求已自动拒绝',
                        '您的 ' || v_request.entity_type || ' 审批请求已因超时自动拒绝。'
                    );

                    v_processed_count := v_processed_count + 1;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object('processed', v_processed_count, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
