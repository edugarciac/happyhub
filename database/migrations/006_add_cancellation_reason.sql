-- Migration: Add cancellation_reason to reservations
-- Date: 2026-03-21

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
