-- Update measurement order status column type from SMALLINT to VARCHAR(50)

-- 1. Create a temporary column to hold the new status values
ALTER TABLE measurement_orders ADD COLUMN IF NOT EXISTS new_status VARCHAR(50);

-- 2. Update the new_status column with the corresponding string values
UPDATE measurement_orders
SET new_status = CASE 
    WHEN status = 1 THEN 'pending_measurement' 
    WHEN status = 2 THEN 'measuring_pending_visit' 
    WHEN status = 3 THEN 'completed' 
    WHEN status = 4 THEN 'cancelled' 
    ELSE 'pending_measurement' -- Default value for any other cases
END;

-- 3. Drop the old status column
ALTER TABLE measurement_orders DROP COLUMN IF EXISTS status;

-- 4. Rename the new_status column to status
ALTER TABLE measurement_orders RENAME COLUMN new_status TO status;

-- 5. Add NOT NULL constraint to the new status column
ALTER TABLE measurement_orders ALTER COLUMN status SET NOT NULL;

-- 6. Create index on the status column for better query performance
CREATE INDEX IF NOT EXISTS idx_measurement_orders_status ON measurement_orders(status);

-- 7. Update updated_at timestamp for all rows that were modified
UPDATE measurement_orders
SET updated_at = NOW()
WHERE status IN ('pending_measurement', 'measuring_pending_visit', 'completed', 'cancelled');
