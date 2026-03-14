import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { getUserByEmail } from '@/utils/db/users';

const resetRequestSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email } = resetRequestSchema.parse(req.body);

    // Always return success to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña',
    };

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Ensure password_reset_tokens table exists
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
    `);

    // Invalidate previous tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [user.id]
    );

    // Generate secure token
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset/${token}`;

    // Log the reset URL in development (in production, send via email/n8n)
    console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);

    // Send email via n8n webhook if configured
    if (process.env.N8N_PASSWORD_RESET_WEBHOOK) {
      try {
        await fetch(process.env.N8N_PASSWORD_RESET_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            resetUrl,
            expiresAt: expiresAt.toISOString(),
          }),
        });
      } catch (emailError) {
        console.error('Error sending reset email via n8n:', emailError);
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
