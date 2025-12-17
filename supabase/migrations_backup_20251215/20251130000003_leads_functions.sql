-- Function to assign a lead to a user
-- This function updates the leads table and inserts a record into lead_assignments table

CREATE OR REPLACE FUNCTION assign_lead(
  p_lead_id uuid,
  p_assignee_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid;
BEGIN
  -- Get current user id
  v_current_user_id := auth.uid();
  
  -- Update leads table
  UPDATE leads
  SET 
    assigned_to_id = p_assignee_id,
    updated_at = now(),
    status = CASE WHEN status = 'new' THEN 'assigned' ELSE status END
  WHERE id = p_lead_id;

  -- Insert into lead_assignments
  INSERT INTO lead_assignments (
    lead_id,
    user_id,
    assigned_by,
    assigned_at
  ) VALUES (
    p_lead_id,
    p_assignee_id,
    v_current_user_id, -- Assuming the assigner is the current user. If called by system, might need adjustment.
    now()
  );
  
  -- Optional: Create a notification for the assignee (if notification system exists)
END;
$$;
