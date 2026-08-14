CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  page_path VARCHAR(500),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
