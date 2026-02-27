-- Migration: Add approval tracking fields to reservations
-- Date: 2026-02-27
-- Description: Add rejection_reason, admin_approved_by, and approved_at for approval workflow

-- UP MIGRATION
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN reservations.rejection_reason IS 'Admin explanation when reservation is rejected';
COMMENT ON COLUMN reservations.admin_approved_by IS 'Email of admin user who approved/rejected the reservation';
COMMENT ON COLUMN reservations.approved_at IS 'Timestamp when reservation was approved by admin';

-- DOWN MIGRATION (for rollback)
-- Uncomment below to rollback:
-- ALTER TABLE reservations
-- DROP COLUMN IF EXISTS rejection_reason,
-- DROP COLUMN IF EXISTS admin_approved_by,
-- DROP COLUMN IF EXISTS approved_at;
