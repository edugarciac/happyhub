// User database operations for authentication
import pool, { queryOne, query } from '../../lib/db';
import * as bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  role: 'client' | 'provider' | 'admin';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'client' | 'provider' | 'admin';
  email_verified: boolean;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return await queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  return await queryOne<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
}

/**
 * Create new user with password
 */
export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'client' | 'provider' | 'admin';
  email_verified?: boolean;
}): Promise<UserResponse> {
  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await queryOne<User>(
    `INSERT INTO users (email, password_hash, name, phone, role, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, name, phone, role, email_verified`,
    [
      data.email,
      passwordHash,
      data.name,
      data.phone || null,
      data.role || 'client',
      data.email_verified ?? false,
    ]
  );

  if (!result) {
    throw new Error('Failed to create user');
  }

  return {
    id: result.id,
    email: result.email,
    name: result.name,
    phone: result.phone,
    role: result.role,
    email_verified: result.email_verified,
  };
}

/**
 * Verify user password
 */
export async function verifyPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: { name?: string; phone?: string }
): Promise<UserResponse | null> {
  const result = await queryOne<User>(
    `UPDATE users
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, name, phone, role, email_verified`,
    [userId, data.name, data.phone]
  );

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    email: result.email,
    name: result.name,
    phone: result.phone,
    role: result.role,
    email_verified: result.email_verified,
  };
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}
