-- HappyHub IAM Inline Policies Migration
-- Adds support for fine-grained permission policies attached to individual users

-- ============================================================================
-- USER POLICIES TABLE (IAM Inline Policies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_policies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    policy_document JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, policy_name)
);

COMMENT ON TABLE user_policies IS 'IAM inline policies attached to individual users';
COMMENT ON COLUMN user_policies.policy_name IS 'Unique policy name per user';
COMMENT ON COLUMN user_policies.policy_document IS 'JSON policy document with Version and Statement array';
COMMENT ON COLUMN user_policies.created_by IS 'Admin user who created the policy';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_policies_user_id ON user_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_policies_created_by ON user_policies(created_by);

-- Trigger to keep updated_at current
CREATE TRIGGER update_user_policies_updated_at
    BEFORE UPDATE ON user_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE user_policies TO dbadmin;
GRANT USAGE, SELECT ON SEQUENCE user_policies_id_seq TO dbadmin;

DO $$
BEGIN
    RAISE NOTICE 'IAM Policies migration applied: user_policies table created.';
END $$;
