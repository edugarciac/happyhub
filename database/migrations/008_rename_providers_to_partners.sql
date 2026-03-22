-- Rename providers table to partners
ALTER TABLE providers RENAME TO partners;

-- Update foreign key reference in services table
-- (FK constraint name may vary, this handles the column reference)
ALTER TABLE services RENAME COLUMN provider_id TO partner_id;
