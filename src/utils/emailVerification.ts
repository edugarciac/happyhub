import crypto from 'crypto';
import { query, queryOne } from '../lib/db';

const TOKEN_EXPIRY_HOURS = 24;

export async function generateVerificationToken(userId: number): Promise<string> {
  // Invalidate any existing tokens for this user
  await invalidateUserTokens(userId);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt.toISOString()]
  );

  return token;
}

interface TokenValidationResult {
  valid: boolean;
  userId?: number;
  error?: 'invalid' | 'expired' | 'used';
}

export async function validateVerificationToken(token: string): Promise<TokenValidationResult> {
  const row = await queryOne<{
    id: number;
    user_id: number;
    expires_at: Date;
    used: boolean;
  }>(
    `SELECT id, user_id, expires_at, used FROM email_verification_tokens WHERE token = $1`,
    [token]
  );

  if (!row) {
    return { valid: false, error: 'invalid' };
  }

  if (row.used) {
    return { valid: false, error: 'used' };
  }

  if (new Date(row.expires_at) < new Date()) {
    return { valid: false, error: 'expired' };
  }

  // Mark token as used
  await query(
    `UPDATE email_verification_tokens SET used = true WHERE id = $1`,
    [row.id]
  );

  // Mark user email as verified
  await query(
    `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`,
    [row.user_id]
  );

  return { valid: true, userId: row.user_id };
}

export async function invalidateUserTokens(userId: number): Promise<void> {
  await query(
    `UPDATE email_verification_tokens SET used = true WHERE user_id = $1 AND used = false`,
    [userId]
  );
}
