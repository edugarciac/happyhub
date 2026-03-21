-- Migration: Add status, title, photo_urls to reviews; replace is_published
-- Date: 2026-03-21

-- Add new columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending_review';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]';

-- Migrate existing data
UPDATE reviews SET status = 'published' WHERE is_published = true;
UPDATE reviews SET status = 'pending_review' WHERE is_published = false;

-- Set default title for existing reviews
UPDATE reviews SET title = 'Mi experiencia en Happyhub' WHERE title IS NULL;

-- Drop old column and index
DROP INDEX IF EXISTS idx_reviews_published;
ALTER TABLE reviews DROP COLUMN IF EXISTS is_published;

-- Allow reviews without reservation (user-submitted from area privada)
ALTER TABLE reviews ALTER COLUMN reservation_id DROP NOT NULL;

-- Create new index on status
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, created_at DESC);
