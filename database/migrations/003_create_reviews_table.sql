-- Migration: Create reviews table for customer ratings
-- Date: 2026-02-27
-- Description: Add reviews table with ratings, optional text, admin moderation, and unique constraint per reservation

-- UP MIGRATION

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (review_text IS NULL OR length(review_text) <= 500),
  customer_name VARCHAR(255) NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX idx_reviews_published ON reviews(is_published, created_at DESC);
CREATE INDEX idx_reviews_reservation ON reviews(reservation_id);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE reviews IS 'Customer ratings and reviews for completed reservations. Admin approval required before public display (is_published=true).';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.review_text IS 'Optional text review, max 500 characters';
COMMENT ON COLUMN reviews.is_published IS 'Admin approval flag - only published reviews appear publicly';

-- DOWN MIGRATION (for rollback)
-- Uncomment below to rollback:
-- DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
-- DROP INDEX IF EXISTS idx_reviews_reservation;
-- DROP INDEX IF EXISTS idx_reviews_published;
-- DROP TABLE IF EXISTS reviews;
