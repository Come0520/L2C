DO $$
DECLARE
  v_flow_id uuid;
BEGIN
  -- Check if flow already exists
  IF NOT EXISTS (SELECT 1 FROM "public"."approval_flows" WHERE name = 'High Discount Quote') THEN
    INSERT INTO "public"."approval_flows" ("name", "description", "trigger_type", "is_active")
    VALUES ('High Discount Quote', 'Approval for quotes with high discount', 'manual', true)
    RETURNING id INTO v_flow_id;

    INSERT INTO "public"."approval_steps" ("flow_id", "step_order", "approver_role", "is_final")
    VALUES (v_flow_id, 1, 'manager', true);
  END IF;
END $$;
