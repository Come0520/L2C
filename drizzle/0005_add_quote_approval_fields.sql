-- Add approval fields to quotes table for discount control
ALTER TABLE quotes ADD COLUMN approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN approver_id UUID REFERENCES users(id);
ALTER TABLE quotes ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN reject_reason TEXT;
